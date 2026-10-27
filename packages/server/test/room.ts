import { boardSolutions, findPath, PALETTE, type RoomState, type RoundStartMessage, type ServerMessage } from '@bwords/core';
import { runInDurableObject } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import type { RoomDO } from '../src/room-do.ts';
import { fixturePack } from './fixture-pack.ts';
import { type Client, connect, createRoom } from './ws.ts';

/** Shared steps of the room tests, over real WebSockets. */

export const stubOf = (code: string) => env.ROOM.get(env.ROOM.idFromName(code));

/** Sets the room's clock to `ms`; it stays there until set again. */
export async function setClock(code: string, ms: number): Promise<void> {
  await runInDurableObject(stubOf(code), (room: RoomDO) => {
    room.clock = () => ms;
  });
}

export const T0 = 1_800_000_000_000;

/** A new room with its clock at `T0` and its TV connected. */
export async function roomWithTv(): Promise<{ code: string; tvToken: string; tv: Client }> {
  const { code, tvToken } = await createRoom();
  await setClock(code, T0);
  const tv = await connect(code);
  tv.send({ type: 'hello', role: 'tv', token: tvToken });
  await tv.next('welcome');
  return { code, tvToken, tv };
}

export interface Phone {
  client: Client;
  playerId: string;
  token: string;
}

/** A phone that says `hello` and joins with the n-th palette color; reads up to its `joined`. */
export async function joinPhone(code: string, nickname: string, n: number): Promise<Phone> {
  const client = await connect(code);
  client.send({ type: 'hello', role: 'player' });
  await client.next('welcome');
  client.send({ type: 'join', nickname, color: PALETTE[n]! });
  const joined = await client.skipTo('joined');
  return { client, playerId: joined.playerId, token: joined.token };
}

let pack: ReturnType<typeof fixturePack> | null = null;

/** Valid words of a round board (minimum 3, filter on) with the path of each. */
export function solutionPaths(board: string[][], minLength: 3 | 4 = 3): { word: string; path: number[] }[] {
  pack ??= fixturePack();
  const { words } = boardSolutions(board, pack, { minLength, filterProfanity: true });
  return [...words].sort().map((word) => ({ word, path: findPath(board, word)! }));
}

/** Every JSON message a client got. */
export const messagesOf = (client: Client): ServerMessage[] =>
  client.frames.flatMap((f) => (f.kind === 'json' ? [f.msg] : []));

/** The `room` record in the room's storage. */
export async function storedRoom(code: string): Promise<RoomState | undefined> {
  return runInDurableObject(stubOf(code), (_, state) => state.storage.get<RoomState>('room'));
}

/** The room's alarm time, or null. */
export async function alarmOf(code: string): Promise<number | null> {
  return runInDurableObject(stubOf(code), (_, state) => state.storage.getAlarm());
}

/** Waits until the stored room satisfies `ready` (the room handles closes asynchronously). */
export async function untilStored(code: string, ready: (room: RoomState) => boolean, what: string): Promise<RoomState> {
  const deadline = Date.now() + 2000;
  for (;;) {
    const room = await storedRoom(code);
    if (room && ready(room)) return room;
    if (Date.now() > deadline) throw new Error(`Timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

/** Starts the first round with the host phone; every client reads up to its `round-start`. */
export async function startRound(host: Phone, clients: Client[]): Promise<RoundStartMessage> {
  host.client.send({ type: 'start' });
  let start: RoundStartMessage | null = null;
  for (const c of [host.client, ...clients]) start = await c.skipTo('round-start');
  return start!;
}
