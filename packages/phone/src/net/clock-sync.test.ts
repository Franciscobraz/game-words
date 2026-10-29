import { expect, test } from 'vitest';
import { addTimeSample, type ClockSample, serverNow } from './clock-sync.ts';

test('keeps the offset of the lowest round trip', () => {
  // Server clock 5,000 ms ahead. Sample 1 takes 300 ms with a slow way back,
  // sample 2 takes 40 ms evenly, sample 3 takes 200 ms with a slow way out.
  const answers = [
    { answer: { clientTime: 1_000, serverTime: 6_050 }, receivedAt: 1_300 },
    { answer: { clientTime: 2_000, serverTime: 7_020 }, receivedAt: 2_040 },
    { answer: { clientTime: 3_000, serverTime: 8_180 }, receivedAt: 3_200 },
  ];

  let best: ClockSample | null = null;
  for (const { answer, receivedAt } of answers) best = addTimeSample(best, answer, receivedAt);

  expect(best).toEqual({ offsetMs: 5_000, roundTripMs: 40 });
});

test('takes the first answer when there is no estimate yet', () => {
  const best = addTimeSample(null, { clientTime: 1_000, serverTime: 6_100 }, 1_200);

  expect(best).toEqual({ offsetMs: 5_000, roundTripMs: 200 });
});

test('reads the server clock with the offset, or the local clock before any answer', () => {
  expect(serverNow({ offsetMs: 5_000, roundTripMs: 40 }, 10_000)).toBe(15_000);
  expect(serverNow({ offsetMs: -250, roundTripMs: 40 }, 10_000)).toBe(9_750);
  expect(serverNow(null, 10_000)).toBe(10_000);
});
