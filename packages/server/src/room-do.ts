import {
  type ConnRef,
  createRoom,
  type Effect,
  type LanguagePack,
  prepareRound,
  type RoomConfig,
  type RoomDeps,
  type RoomInput,
  type RoomState,
  step,
} from '@bwords/core';
import { DurableObject } from 'cloudflare:workers';
import { syncAlarm } from './alarms.ts';
import type { Env } from './env.ts';
import { loadPack } from './pack-loader.ts';
import { CLOSE_CODE, randomToken, roomNotFound } from './socket.ts';

/**
 * One room per Durable Object, named by its code: the adapter between the
 * runtime (sockets, storage, alarm, static assets) and the pure `step()` of the
 * core. Every socket carries its `ConnRef` in the attachment, so routing survives
 * hibernation; the core's `bind` effect updates it.
 */
export class RoomDO extends DurableObject<Env> {
  /** The room's clock; tests replace it through `runInDurableObject`. */
  clock: () => number = () => Date.now();
  private state: RoomState | null = null;
  /** The room's pack with spellings, once loaded; `deps.pack()` reads it when a round ends. */
  private pack: LanguagePack | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Answered by the runtime without waking the object (RECON-01 AC 6).
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    void ctx.blockConcurrencyWhile(async () => {
      this.state = (await ctx.storage.get<RoomState>('room')) ?? null;
    });
  }

  /**
   * Creates the room in the lobby (RPC from the Worker). Returns null when the
   * code already has an active room, so the Worker draws another (ROOM-01 AC 2).
   */
  async create(code: string, cfg: RoomConfig): Promise<{ tvToken: string } | null> {
    if (this.state !== null && !this.state.closed) return null;
    const tvToken = randomToken();
    this.state = createRoom(code, tvToken, this.clock(), cfg);
    void this.ctx.storage.put('room', this.state);
    await syncAlarm(this.ctx.storage, this.state);
    return { tvToken };
  }

  /** The WebSocket upgrade of a client; it starts `pending` until its `hello`. */
  override async fetch(): Promise<Response> {
    if (this.state === null || this.state.closed) return roomNotFound();
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    const conn: ConnRef = { id: crypto.randomUUID(), role: 'pending' };
    server.serializeAttachment(conn);
    await this.input({ kind: 'connect', conn });
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    // The protocol has no binary client frame: an empty text fails to parse and gets `bad-message`.
    await this.input({ kind: 'message', conn: connOf(ws), data: typeof data === 'string' ? data : '' });
  }

  override async webSocketClose(ws: WebSocket): Promise<void> {
    await this.input({ kind: 'disconnect', conn: connOf(ws) });
  }

  override async webSocketError(ws: WebSocket): Promise<void> {
    await this.input({ kind: 'disconnect', conn: connOf(ws) });
  }

  /**
   * A deadline is due. In a round the results need the pack with its spellings,
   * so it loads first; a failed load throws, and the runtime retries the alarm.
   */
  override async alarm(): Promise<void> {
    if (this.state === null) return;
    if (this.state.phase === 'round') {
      this.pack = await loadPack(this.env.ASSETS, this.state.settings.pack, { spellings: true });
    }
    await this.input({ kind: 'alarm' });
  }

  private deps(): RoomDeps {
    return {
      randomToken,
      pack: () => {
        if (!this.pack) throw new Error('The language pack is not loaded');
        return this.pack;
      },
    };
  }

  /**
   * Steps one input, runs its effects and points the alarm at the next deadline.
   * A `prepare-next` runs last and feeds a `prepared` input.
   */
  private async input(input: RoomInput): Promise<void> {
    if (this.state === null) return;
    const result = step(this.state, input, this.clock(), this.deps());
    this.state = result.state;
    let prepare = false;
    for (const effect of result.effects) {
      if (effect.kind === 'prepare-next') prepare = true;
      else await this.run(effect);
    }
    // After `close-room` the state is gone and so is the alarm.
    if (this.state !== null) await syncAlarm(this.ctx.storage, this.state);
    if (prepare) await this.prepareNext();
  }

  private async run(effect: Exclude<Effect, { kind: 'prepare-next' }>): Promise<void> {
    switch (effect.kind) {
      case 'send':
        return send(this.socket(effect.to.id), JSON.stringify(effect.msg));
      case 'broadcast': {
        const text = JSON.stringify(effect.msg);
        for (const ws of this.ctx.getWebSockets()) {
          const role = connOf(ws).role;
          if (role !== 'pending' && (!effect.roles || effect.roles.includes(role))) send(ws, text);
        }
        return;
      }
      case 'send-hashes':
        return send(this.socket(effect.to.id), effect.frame);
      case 'bind':
        this.socket(effect.conn.id)?.serializeAttachment(effect.conn);
        return;
      case 'close':
        return close(this.socket(effect.to.id));
      case 'persist':
        void this.ctx.storage.put('room', this.state);
        return;
      case 'close-room':
        for (const ws of this.ctx.getWebSockets()) close(ws);
        await this.ctx.storage.deleteAll();
        await this.ctx.storage.deleteAlarm();
        this.state = null;
        return;
    }
  }

  /** Prepares a board for the current settings and hands it to the room; on failure the room stays as it is. */
  private async prepareNext(): Promise<void> {
    if (this.state === null) return;
    const settings = this.state.settings;
    try {
      const pack = await loadPack(this.env.ASSETS, settings.pack);
      const seed = crypto.getRandomValues(new Uint32Array(1))[0]!;
      const round = await prepareRound(pack, settings, seed, crypto.getRandomValues(new Uint8Array(16)));
      await this.input({ kind: 'prepared', round });
    } catch (err) {
      console.error('prepare-next failed', err);
    }
  }

  private socket(id: string): WebSocket | undefined {
    return this.ctx.getWebSockets().find((ws) => connOf(ws).id === id);
  }
}

const connOf = (ws: WebSocket): ConnRef => ws.deserializeAttachment() as ConnRef;

/** Sends to a socket that may be gone or closing already. */
function send(ws: WebSocket | undefined, data: string | ArrayBuffer): void {
  try {
    ws?.send(data);
  } catch {
    // The client left; its close event updates the room.
  }
}

function close(ws: WebSocket | undefined): void {
  try {
    ws?.close(CLOSE_CODE);
  } catch {
    // Already closed.
  }
}
