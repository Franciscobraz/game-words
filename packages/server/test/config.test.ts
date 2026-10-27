import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config.ts';

describe('readConfig', () => {
  it('reads both timeouts with defaults 30 and 10', () => {
    expect(readConfig({ ROOM_IDLE_TIMEOUT_MIN: '45', TV_DISCONNECT_TIMEOUT_MIN: '5' })).toEqual({ idleMin: 45, tvGoneMin: 5 });
    expect(readConfig({})).toEqual({ idleMin: 30, tvGoneMin: 10 });
    // The vars of wrangler.jsonc.
    expect(readConfig(env)).toEqual({ idleMin: 30, tvGoneMin: 10 });
    // 0 is a valid value: it turns the rule off.
    expect(readConfig({ ROOM_IDLE_TIMEOUT_MIN: '0', TV_DISCONNECT_TIMEOUT_MIN: '0' })).toEqual({ idleMin: 0, tvGoneMin: 0 });
  });

  it.each([
    ['empty', ''],
    ['negative', '-1'],
    ['decimal', '1.5'],
    ['text', 'ten'],
  ])('falls back to the default for invalid values: %s', (_, value) => {
    expect(readConfig({ ROOM_IDLE_TIMEOUT_MIN: value, TV_DISCONNECT_TIMEOUT_MIN: value })).toEqual({ idleMin: 30, tvGoneMin: 10 });
  });
});
