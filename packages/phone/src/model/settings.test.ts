import { describe, expect, test } from 'vitest';
import { canStep, formatRoundTime, stepRounds, stepSeconds } from './settings.ts';

describe('formatRoundTime', () => {
  test('shows the round time as M:SS', () => {
    expect(formatRoundTime(30)).toBe('0:30');
    expect(formatRoundTime(90)).toBe('1:30');
    expect(formatRoundTime(120)).toBe('2:00');
    expect(formatRoundTime(180)).toBe('3:00');
  });
});

describe('round time stepper', () => {
  test('steps the round time by 30 seconds between 30 and 180', () => {
    // HOST-01 AC 3: + and − move 30 s, shown as "M:SS".
    expect(stepSeconds(120, 1)).toBe(150);
    expect(stepSeconds(120, -1)).toBe(90);
    expect(formatRoundTime(stepSeconds(120, 1))).toBe('2:30');

    // L-001: one step inside each limit reaches it; at the limit it stays.
    expect(stepSeconds(60, -1)).toBe(30);
    expect(stepSeconds(30, -1)).toBe(30);
    expect(stepSeconds(150, 1)).toBe(180);
    expect(stepSeconds(180, 1)).toBe(180);
  });

  test('disables minus at 30 seconds and plus at 180 seconds', () => {
    // HOST-01 AC 4, L-001: at the limit and one step inside it.
    expect(canStep('seconds', 30, -1)).toBe(false);
    expect(canStep('seconds', 30, 1)).toBe(true);
    expect(canStep('seconds', 60, -1)).toBe(true);
    expect(canStep('seconds', 180, 1)).toBe(false);
    expect(canStep('seconds', 180, -1)).toBe(true);
    expect(canStep('seconds', 150, 1)).toBe(true);
  });
});

describe('rounds stepper', () => {
  test('steps rounds by one between 1 and 5', () => {
    // HOST-01 AC 5: + and − move one round.
    expect(stepRounds(3, 1)).toBe(4);
    expect(stepRounds(3, -1)).toBe(2);

    // L-001: one step inside each limit reaches it; at the limit it stays and the button is off.
    expect(stepRounds(2, -1)).toBe(1);
    expect(stepRounds(1, -1)).toBe(1);
    expect(stepRounds(4, 1)).toBe(5);
    expect(stepRounds(5, 1)).toBe(5);
    expect(canStep('rounds', 1, -1)).toBe(false);
    expect(canStep('rounds', 2, -1)).toBe(true);
    expect(canStep('rounds', 5, 1)).toBe(false);
    expect(canStep('rounds', 4, 1)).toBe(true);
  });
});
