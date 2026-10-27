import { type RoomState, ROOM_CODE_ALPHABET } from '@bwords/core';
import { runInDurableObject } from 'cloudflare:test';
import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { connect, createRoom } from './ws.ts';

const stubOf = (code: string) => env.ROOM.get(env.ROOM.idFromName(code));

describe('worker routes', () => {
  it('creates a room with a 4-letter code and a TV token', async () => {
    const { code, tvToken } = await createRoom();
    expect(code).toMatch(new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`));
    expect(tvToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const stored = await runInDurableObject(stubOf(code), (_, state) => state.storage.get<RoomState>('room'));
    expect(stored?.phase).toBe('lobby');
    expect(stored?.code).toBe(code);
    expect(stored?.tvToken).toBe(tvToken);
  });

  it('refuses to create a room on a code with an active room', async () => {
    const { code } = await createRoom();
    expect(await stubOf(code).create(code, { idleMin: 30, tvGoneMin: 10 })).toBeNull();
  });

  it.each([
    ['a code without a room', 'ZZZZ'],
    ['a malformed code', 'zz1'],
    ['a code with I or O', 'IOIO'],
  ])('answers room-not-found for a code without a room: %s', async (_, code) => {
    const client = await connect(code);
    expect(await client.next('error')).toEqual({ type: 'error', code: 'room-not-found' });
    await client.waitClosed();
  });

  it('answers 404 to other routes', async () => {
    for (const [method, path] of [
      ['GET', '/'],
      ['GET', '/api/rooms'],
      ['POST', '/api/rooms/ABCD/ws'],
    ] as const) {
      const res = await exports.default.fetch(new Request(`https://bwords.test${path}`, { method }));
      expect(res.status, `${method} ${path}`).toBe(404);
      await res.body?.cancel();
    }
  });
});
