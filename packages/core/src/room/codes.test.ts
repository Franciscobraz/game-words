import { describe, expect, test } from 'vitest';
import { mulberry32 } from '../generator.ts';
import { createWithFreeCode, isRoomCode, randomRoomCode, ROOM_CODE_ALPHABET } from './codes.ts';

describe('room codes', () => {
  test('draws codes only from the unambiguous alphabet', () => {
    expect(ROOM_CODE_ALPHABET).toBe('ABCDEFGHJKLMNPQRSTUVWXYZ');
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[IO]/);
    const rand = mulberry32(7);
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const code = randomRoomCode(rand);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
      for (const ch of code) seen.add(ch);
    }
    // Every letter of the alphabet is reachable, including both ends.
    expect([...seen].sort().join('')).toBe(ROOM_CODE_ALPHABET);
    expect(randomRoomCode(() => 0)).toBe('AAAA');
    expect(randomRoomCode(() => 0.999999)).toBe('ZZZZ');
  });

  test('draws again until a code is free', async () => {
    const expected = (() => {
      const rand = mulberry32(42);
      return [randomRoomCode(rand), randomRoomCode(rand), randomRoomCode(rand)];
    })();
    const tried: string[] = [];
    const taken = new Set(expected.slice(0, 2));
    const out = await createWithFreeCode(async (code) => {
      tried.push(code);
      return taken.has(code) ? null : { tvToken: `token-${code}` };
    }, mulberry32(42));
    expect(tried).toEqual(expected);
    expect(out).toEqual({ code: expected[2], result: { tvToken: `token-${expected[2]}` } });
  });

  test('isRoomCode accepts only 4 letters of the alphabet', () => {
    expect(isRoomCode('ABCD')).toBe(true);
    expect(isRoomCode('ZZZZ')).toBe(true);
    expect(isRoomCode('ABCI')).toBe(false);
    expect(isRoomCode('OBCD')).toBe(false);
    expect(isRoomCode('abcd')).toBe(false);
    expect(isRoomCode('ABC')).toBe(false);
    expect(isRoomCode('ABCDE')).toBe(false);
    expect(isRoomCode('AB1D')).toBe(false);
    expect(isRoomCode('')).toBe(false);
  });
});
