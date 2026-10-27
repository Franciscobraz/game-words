import { createRoom, nextDeadline, type RoomConfig, type RoomState } from '@bwords/core';
import { DurableObject } from 'cloudflare:workers';
import type { Env } from './env.ts';
import { randomToken, roomNotFound } from './socket.ts';

/** One room per Durable Object, named by its code. */
export class RoomDO extends DurableObject<Env> {
  /** The room's clock; tests replace it through `runInDurableObject`. */
  clock: () => number = () => Date.now();
  private state: RoomState | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
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
    const deadline = nextDeadline(this.state);
    if (deadline !== null) await this.ctx.storage.setAlarm(deadline);
    return { tvToken };
  }

  override async fetch(): Promise<Response> {
    if (this.state === null || this.state.closed) return roomNotFound();
    return new Response('Not implemented', { status: 501 });
  }
}
