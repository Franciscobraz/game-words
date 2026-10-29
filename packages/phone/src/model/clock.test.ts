import { describe, expect, test } from 'vitest';
import { ALERT_REMAINING_MS, countdownNumber, formatClock, isAlert, isTimeUp, remainingShare } from './clock.ts';

describe('formatClock', () => {
  test('formats the remaining time as MM:SS', () => {
    // PLAY-01 AC 14: 1 min 47 s left reads "01:47".
    expect(formatClock(107_000)).toBe('01:47');
    expect(formatClock(180_000)).toBe('03:00');
    expect(formatClock(60_000)).toBe('01:00');
    expect(formatClock(9_000)).toBe('00:09');
  });

  test('rounds a partial second up, so the timer reads 00:00 only at the end', () => {
    expect(formatClock(106_001)).toBe('01:47');
    expect(formatClock(106_000)).toBe('01:46');
    expect(formatClock(1)).toBe('00:01');
  });

  test('shows 00:00 at the end and after it', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(-1)).toBe('00:00');
    expect(formatClock(-5_000)).toBe('00:00');
  });
});

describe('isAlert', () => {
  test('turns the timer to alert at 10 seconds left', () => {
    // PLAY-01 AC 15, L-001: 10,000 ms left is alert, 10,001 ms is not.
    expect(ALERT_REMAINING_MS).toBe(10_000);
    expect(isAlert(10_001)).toBe(false);
    expect(isAlert(10_000)).toBe(true);
    expect(isAlert(3_000)).toBe(true);
    expect(isAlert(0)).toBe(true);
    expect(isAlert(60_000)).toBe(false);
  });
});

describe('countdownNumber', () => {
  /** The board shows at 50 s on the server clock. */
  const STARTS_AT = 50_000;

  test('counts 3, 2 and 1, one per second, until startsAt', () => {
    // COUNT-01 AC 1: 3 s to go shows 3; each whole second changes the number.
    expect(countdownNumber(STARTS_AT - 3_000, STARTS_AT)).toBe(3);
    expect(countdownNumber(STARTS_AT - 2_001, STARTS_AT)).toBe(3);
    expect(countdownNumber(STARTS_AT - 2_000, STARTS_AT)).toBe(2);
    expect(countdownNumber(STARTS_AT - 1_001, STARTS_AT)).toBe(2);
    expect(countdownNumber(STARTS_AT - 1_000, STARTS_AT)).toBe(1);
    expect(countdownNumber(STARTS_AT - 1, STARTS_AT)).toBe(1);
  });

  test('ends the countdown at startsAt', () => {
    expect(countdownNumber(STARTS_AT, STARTS_AT)).toBeNull();
    expect(countdownNumber(STARTS_AT + 500, STARTS_AT)).toBeNull();
  });

  test('stays at 3 while more than 3 seconds are left', () => {
    // A phone whose clock runs early still starts the count at 3.
    expect(countdownNumber(STARTS_AT - 3_500, STARTS_AT)).toBe(3);
  });
});

describe('isTimeUp', () => {
  test('is up from endsAt on', () => {
    // PLAY-01 AC 20, L-001: one millisecond before endsAt the round is still open.
    expect(isTimeUp(59_999, 60_000)).toBe(false);
    expect(isTimeUp(60_000, 60_000)).toBe(true);
    expect(isTimeUp(61_000, 60_000)).toBe(true);
  });
});

describe('remainingShare', () => {
  test('goes from 1 at startsAt to 0 at endsAt', () => {
    // SPEC-01 AC 2: a 120 s round with 30 s gone has three quarters left.
    expect(remainingShare(0, 0, 120_000)).toBe(1);
    expect(remainingShare(30_000, 0, 120_000)).toBe(0.75);
    expect(remainingShare(120_000, 0, 120_000)).toBe(0);
  });

  test('stays between 0 and 1 outside the round', () => {
    expect(remainingShare(-1_000, 0, 120_000)).toBe(1);
    expect(remainingShare(130_000, 0, 120_000)).toBe(0);
    expect(remainingShare(0, 5, 5)).toBe(0);
  });
});
