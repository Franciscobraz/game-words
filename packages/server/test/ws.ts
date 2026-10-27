import { type ClientMessage, decodeHashFrame, type ServerMessage } from '@bwords/core';
import { exports } from 'cloudflare:workers';

/** A frame a client got: a JSON message or the binary hash frame. */
export type Frame =
  | { kind: 'json'; msg: ServerMessage }
  /** A text frame that is not JSON: the `pong` of the auto-response. */
  | { kind: 'text'; text: string }
  | { kind: 'hashes'; roundId: number; prefixes: Uint8Array };

type Of<T extends ServerMessage['type']> = Extract<ServerMessage, { type: T }>;

const WAIT_MS = 2000;

/** A test WebSocket client of the Worker. Every frame it gets stays in `frames`, in order. */
export class Client {
  readonly frames: Frame[] = [];
  closed = false;
  private read = 0;
  private waiters: (() => void)[] = [];

  readonly ws: WebSocket;

  constructor(ws: WebSocket) {
    this.ws = ws;
    // With this compatibility date binary frames arrive as Blobs by default.
    ws.binaryType = 'arraybuffer';
    ws.addEventListener('message', (event) => {
      if (typeof event.data === 'string') {
        this.frames.push(event.data.startsWith('{') ? { kind: 'json', msg: JSON.parse(event.data) as ServerMessage } : { kind: 'text', text: event.data });
      } else {
        const frame = decodeHashFrame(event.data as ArrayBuffer);
        if (!frame) throw new Error('Unexpected binary frame');
        this.frames.push({ kind: 'hashes', ...frame });
      }
      this.wake();
    });
    ws.addEventListener('close', () => {
      this.closed = true;
      this.wake();
    });
  }

  private wake() {
    const waiters = this.waiters;
    this.waiters = [];
    for (const w of waiters) w();
  }

  /** Waits until `ready()` holds; fails after 2 s. */
  async until(ready: () => boolean, what: string): Promise<void> {
    const deadline = Date.now() + WAIT_MS;
    while (!ready()) {
      if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}; got ${JSON.stringify(this.unread())}`);
      await new Promise<void>((resolve) => {
        this.waiters.push(resolve);
        setTimeout(resolve, 50);
      });
    }
  }

  private unread(): Frame[] {
    return this.frames.slice(this.read);
  }

  /** The next unread frame, waiting for it. */
  async nextFrame(): Promise<Frame> {
    await this.until(() => this.frames.length > this.read, 'a frame');
    return this.frames[this.read++]!;
  }

  /** The next unread JSON message, which must have type `type`. */
  async next<T extends ServerMessage['type']>(type: T): Promise<Of<T>> {
    const frame = await this.nextFrame();
    if (frame.kind !== 'json' || frame.msg.type !== type) {
      throw new Error(`Expected ${type}, got ${JSON.stringify(frame)}`);
    }
    return frame.msg as Of<T>;
  }

  /** Skips unread frames up to and including the first JSON message of type `type`. */
  async skipTo<T extends ServerMessage['type']>(type: T): Promise<Of<T>> {
    for (;;) {
      const frame = await this.nextFrame();
      if (frame.kind === 'json' && frame.msg.type === type) return frame.msg as Of<T>;
    }
  }

  /** The next unread frame, which must be the hash frame. */
  async hashes(): Promise<Extract<Frame, { kind: 'hashes' }>> {
    const frame = await this.nextFrame();
    if (frame.kind !== 'hashes') throw new Error(`Expected the hash frame, got ${JSON.stringify(frame)}`);
    return frame;
  }

  /** Marks every frame so far as read. */
  drain(): void {
    this.read = this.frames.length;
  }

  send(msg: ClientMessage | object): void {
    this.ws.send(JSON.stringify(msg));
  }

  sendRaw(data: string): void {
    this.ws.send(data);
  }

  async waitClosed(): Promise<void> {
    await this.until(() => this.closed, 'the close');
  }

  close(): void {
    this.ws.close(1000);
  }
}

const ORIGIN = 'https://bwords.test';

/** `POST /api/rooms`. */
export async function createRoom(): Promise<{ code: string; tvToken: string }> {
  const res = await exports.default.fetch(new Request(`${ORIGIN}/api/rooms`, { method: 'POST' }));
  if (!res.ok) throw new Error(`POST /api/rooms: HTTP ${res.status}`);
  return res.json();
}

/** Opens a WebSocket to `/api/rooms/<code>/ws`. */
export async function connect(code: string): Promise<Client> {
  const res = await exports.default.fetch(new Request(`${ORIGIN}/api/rooms/${code}/ws`, { headers: { Upgrade: 'websocket' } }));
  const ws = res.webSocket;
  if (res.status !== 101 || !ws) throw new Error(`Upgrade failed: HTTP ${res.status}`);
  ws.accept();
  return new Client(ws);
}
