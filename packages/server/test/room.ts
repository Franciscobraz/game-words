import { boardSolutions, findPath, PALETTE, type ServerMessage } from '@bwords/core';
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
