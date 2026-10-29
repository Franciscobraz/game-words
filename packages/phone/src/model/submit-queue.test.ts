import { RATE_LIMIT_PATHS, RATE_WINDOW_MS } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { recentSends, SUBMIT_DEBOUNCE_MS, submitDelay, takeBatch, windowFreesIn } from './submit-queue.ts';

/** The round ends at 100 s on the server clock. */
const ENDS_AT = 100_000;

/** Paths 0-1, 1-2, ... as distinct swipes. */
function paths(count: number): number[][] {
  return Array.from({ length: count }, (_, i) => [i, i + 1]);
}

describe('submitDelay', () => {
  test('waits 500 ms or sends at once in the last 3 seconds', () => {
    // PLAY-01 AC 12, L-001: 3,001 ms left waits 500 ms; 3,000 ms left sends at once.
    expect(SUBMIT_DEBOUNCE_MS).toBe(500);
    expect(submitDelay(ENDS_AT - 3_001, ENDS_AT)).toBe(500);
    expect(submitDelay(ENDS_AT - 3_000, ENDS_AT)).toBe(0);

    // Early in the round, the 500 ms wait; at the end and after it, at once.
    expect(submitDelay(ENDS_AT - 60_000, ENDS_AT)).toBe(500);
    expect(submitDelay(ENDS_AT - 1, ENDS_AT)).toBe(0);
    expect(submitDelay(ENDS_AT, ENDS_AT)).toBe(0);
  });
});

describe('takeBatch', () => {
  test('sends at most ten paths in a one second window and keeps the rest waiting', () => {
    // PLAY-01 AC 12 with the server's limit (ROUND-01 AC 6), L-001: the 10th path goes, the 11th waits.
    expect(RATE_LIMIT_PATHS).toBe(10);
    const eleven = paths(11);

    const first = takeBatch(eleven, 0);
    expect(first.batch).toEqual(eleven.slice(0, 10));
    expect(first.rest).toEqual([eleven[10]]);

    // With 9 already sent in the window, only one more goes.
    const second = takeBatch(paths(3), 9);
    expect(second.batch).toEqual([[0, 1]]);
    expect(second.rest).toEqual([
      [1, 2],
      [2, 3],
    ]);

    // With 10 already sent, nothing goes.
    const third = takeBatch(paths(2), 10);
    expect(third.batch).toEqual([]);
    expect(third.rest).toEqual(paths(2));
  });

  test('sends everything waiting when the window has room', () => {
    expect(takeBatch(paths(4), 2)).toEqual({ batch: paths(4), rest: [] });
    expect(takeBatch([], 0)).toEqual({ batch: [], rest: [] });
  });
});

describe('the one second window', () => {
  test('counts the sends of the last second, as the server does', () => {
    // A send at 1,000 ms still counts at 1,999 ms and leaves the window at 2,000 ms (L-001).
    const sentAt = [1_000, 1_500];
    expect(recentSends(sentAt, 1_999)).toEqual([1_000, 1_500]);
    expect(recentSends(sentAt, 2_000)).toEqual([1_500]);
    expect(recentSends(sentAt, 2_500)).toEqual([]);
  });

  test('says how long until the oldest send leaves the window', () => {
    expect(windowFreesIn([1_000, 1_500], 1_200)).toBe(RATE_WINDOW_MS - 200);
    expect(windowFreesIn([1_000], 1_999)).toBe(1);
    expect(windowFreesIn([], 1_999)).toBe(0);
  });
});
