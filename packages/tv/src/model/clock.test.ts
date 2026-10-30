import { describe, expect, test } from 'vitest';
import { countdownNumber, formatClock, isAlert, isTimeUp } from './clock.ts';

describe('formatClock', () => {
  test('formats the clock as minutes and seconds', () => {
    expect(formatClock(104_000)).toBe('1:44');
    expect(formatClock(10_000)).toBe('0:10');
    expect(formatClock(0)).toBe('0:00');
  });

  test('counts a partial second as a whole one', () => {
    expect(formatClock(103_001)).toBe('1:44');
    expect(formatClock(1)).toBe('0:01');
  });

  test('stays at zero after the end', () => {
    expect(formatClock(-5_000)).toBe('0:00');
  });
});

describe('isAlert', () => {
  test('alerts from ten seconds down', () => {
    expect(isAlert(10_001)).toBe(false);
    expect(isAlert(10_000)).toBe(true);
    expect(isAlert(1)).toBe(true);
  });
});

describe('countdownNumber', () => {
  const STARTS_AT = 50_000;

  test('counts down to the start', () => {
    expect(countdownNumber(STARTS_AT - 3_000, STARTS_AT)).toBe(3);
    expect(countdownNumber(STARTS_AT - 2_001, STARTS_AT)).toBe(3);
    expect(countdownNumber(STARTS_AT - 2_000, STARTS_AT)).toBe(2);
    expect(countdownNumber(STARTS_AT - 1_000, STARTS_AT)).toBe(1);
    expect(countdownNumber(STARTS_AT - 1, STARTS_AT)).toBe(1);
  });

  test('stops at the start', () => {
    expect(countdownNumber(STARTS_AT, STARTS_AT)).toBeNull();
    expect(countdownNumber(STARTS_AT + 1, STARTS_AT)).toBeNull();
  });

  test('never shows more than three', () => {
    expect(countdownNumber(STARTS_AT - 3_500, STARTS_AT)).toBe(3);
  });
});

describe('isTimeUp', () => {
  test('is up exactly at the end', () => {
    expect(isTimeUp(999, 1_000)).toBe(false);
    expect(isTimeUp(1_000, 1_000)).toBe(true);
  });
});
