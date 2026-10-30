import { describe, expect, test } from 'vitest';
import { createRoom, validateSettingsPatch } from './state.ts';

const CFG = { idleMin: 30, tvGoneMin: 10 };

describe('createRoom', () => {
  test('creates rooms with the default settings', () => {
    const room = createRoom('ABCD', 'tv-token', 1000, CFG);
    // CFG-01 AC 1: 4x4, 120 s, 1 round, minimum 3, filter on, pt-BR, sound on.
    expect(room.settings).toMatchObject({
      size: 4,
      seconds: 120,
      rounds: 1,
      minLength: 3,
      filterProfanity: true,
      pack: 'pt-BR',
      muted: false,
    });
    expect(room.settings).not.toHaveProperty('fastMode');
    expect(room.phase).toBe('lobby');
    expect(room.code).toBe('ABCD');
    expect(room.tvToken).toBe('tv-token');
    expect(room.players).toEqual([]);
    expect(room.hostId).toBeNull();
    expect(room.round).toBeNull();
    expect(room.lastActionAt).toBe(1000);
  });

  test('rooms do not share settings objects', () => {
    const a = createRoom('ABCD', 't1', 0, CFG);
    const b = createRoom('EFGH', 't2', 0, CFG);
    a.settings.size = 6;
    expect(b.settings.size).toBe(4);
  });
});

describe('validateSettingsPatch', () => {
  // CFG-01 AC 3: one row per option, each with its exact limits (L-001, L-007).
  const OUT_OF_RANGE: [string, unknown][] = [
    ['size', 3],
    ['size', 7],
    ['size', '4'],
    ['seconds', 0],
    ['seconds', 210],
    ['seconds', 45],
    ['seconds', 29],
    ['seconds', 181],
    ['rounds', 0],
    ['rounds', 6],
    ['rounds', 2.5],
    ['minLength', 2],
    ['minLength', 5],
    ['filterProfanity', 'yes'],
    ['fastMode', 1],
    ['fastMode', true],
    ['pack', 'en-US'],
    ['unknownOption', true],
  ];

  test.each(OUT_OF_RANGE)('rejects out-of-range settings: %s = %j', (key, value) => {
    expect(validateSettingsPatch({ [key]: value })).toBeNull();
  });

  test('rejects out-of-range settings: one bad value fails the whole patch', () => {
    expect(validateSettingsPatch({ size: 5, rounds: 6 })).toBeNull();
  });

  const IN_RANGE: [string, unknown][] = [
    ['size', 4],
    ['size', 5],
    ['size', 6],
    ['seconds', 30],
    ['seconds', 60],
    ['seconds', 90],
    ['seconds', 120],
    ['seconds', 150],
    ['seconds', 180],
    ['rounds', 1],
    ['rounds', 5],
    ['minLength', 3],
    ['minLength', 4],
    ['filterProfanity', false],
    ['pack', 'pt-BR'],
  ];

  test.each(IN_RANGE)('accepts in-range settings: %s = %j', (key, value) => {
    expect(validateSettingsPatch({ [key]: value })).toEqual({ [key]: value });
  });

  const VOLUME_AND_MUTE: [string, unknown, boolean][] = [
    ['volume', 0, true],
    ['volume', 100, true],
    ['volume', 50, true],
    ['volume', -1, false],
    ['volume', 101, false],
    ['volume', 50.5, false],
    ['volume', '50', false],
    ['muted', true, true],
    ['muted', false, true],
    ['muted', 0, false],
    ['muted', 'true', false],
  ];

  test.each(VOLUME_AND_MUTE)('accepts volume 0-100 and a boolean mute only: %s = %j', (key, value, ok) => {
    expect(validateSettingsPatch({ [key]: value })).toEqual(ok ? { [key]: value } : null);
  });
});
