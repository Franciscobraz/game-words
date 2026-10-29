import type { ClientMessage, ServerMessage } from '@bwords/core';

/**
 * The TV and extra players of the E2E tests, as Node WebSockets on `wrangler dev`
 * (design, Tech Decisions): the phone under test does not depend on driving the
 * debug page. Node 24 has a global WebSocket.
 */

/** `wrangler dev` of `@bwords/server`. */
export const SERVER = '127.0.0.1:8787';

/** How long a helper waits for an answer from the server. */
const ANSWER_TIMEOUT_MS = 10_000;

/** A socket with the server messages it got, in order. */
interface ServerSocket {
  send(msg: ClientMessage): void;
  /** Waits for the first message, past or future, that matches. */
  waitFor<T extends ServerMessage>(match: (msg: ServerMessage) => msg is T): Promise<T>;
  close(): void;
}

/** A room created like the TV creates it, with the TV socket kept open. */
export interface TvRoom {
  code: string;
  close(): void;
}

/** A player joined from Node, to fill a room or to act as its host. */
export interface NodePlayer {
  id: string;
  send(msg: ClientMessage): void;
  /** Waits for the first message, past or future, that matches. */
  waitFor<T extends ServerMessage>(match: (msg: ServerMessage) => msg is T): Promise<T>;
  /** Drops the connection without leaving the room. */
  close(): void;
}

/** `POST /api/rooms`, then `hello` as the TV, which keeps the room alive. */
export async function createRoom(): Promise<TvRoom> {
  const response = await fetch(`http://${SERVER}/api/rooms`, { method: 'POST' });
  const { code, tvToken } = (await response.json()) as { code: string; tvToken: string };
  const tv = await openSocket(code);
  tv.send({ type: 'hello', role: 'tv', token: tvToken });
  await tv.waitFor(isType('welcome'));
  return { code, close: () => tv.close() };
}

/** Joins room `code` from Node with `nickname` and `color`. */
export async function joinPlayer(code: string, nickname: string, color: string): Promise<NodePlayer> {
  const socket = await openSocket(code);
  socket.send({ type: 'hello', role: 'player' });
  await socket.waitFor(isType('welcome'));
  socket.send({ type: 'join', nickname, color });
  const joined = await socket.waitFor(isType('joined'));
  return { id: joined.playerId, send: (msg) => socket.send(msg), waitFor: socket.waitFor, close: () => socket.close() };
}

/** A type guard for server messages of one type. */
export function isType<K extends ServerMessage['type']>(type: K) {
  return (msg: ServerMessage): msg is Extract<ServerMessage, { type: K }> => msg.type === type;
}

async function openSocket(code: string): Promise<ServerSocket> {
  const ws = new WebSocket(`ws://${SERVER}/api/rooms/${code}/ws`);
  const received: ServerMessage[] = [];
  const waiting: (() => void)[] = [];
  ws.addEventListener('message', (event: MessageEvent) => {
    if (typeof event.data !== 'string') return;
    received.push(JSON.parse(event.data) as ServerMessage);
    for (const wake of waiting.splice(0)) wake();
  });
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => resolve(), { once: true });
    ws.addEventListener('error', () => reject(new Error(`Could not open the socket of room ${code}`)), { once: true });
  });

  async function waitFor<T extends ServerMessage>(match: (msg: ServerMessage) => msg is T): Promise<T> {
    const deadline = Date.now() + ANSWER_TIMEOUT_MS;
    for (;;) {
      const found = received.find(match);
      if (found) return found;
      if (Date.now() > deadline) throw new Error(`Room ${code} sent no matching message`);
      await new Promise<void>((resolve) => {
        waiting.push(resolve);
        setTimeout(resolve, ANSWER_TIMEOUT_MS);
      });
    }
  }

  return { send: (msg) => ws.send(JSON.stringify(msg)), waitFor, close: () => ws.close() };
}
