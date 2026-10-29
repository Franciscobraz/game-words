import { describe, expect, test } from 'vitest';
import { formatRoundTime } from './settings.ts';

describe('formatRoundTime', () => {
  test('shows the round time as M:SS', () => {
    expect(formatRoundTime(30)).toBe('0:30');
    expect(formatRoundTime(90)).toBe('1:30');
    expect(formatRoundTime(120)).toBe('2:00');
    expect(formatRoundTime(180)).toBe('3:00');
  });
});
