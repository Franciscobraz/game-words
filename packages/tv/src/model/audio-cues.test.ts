import { describe, expect, test } from 'vitest';
import { type AudioCue, type CueMoment, cuesBetween } from './audio-cues.ts';

const STARTS_AT = 100_000;
const ENDS_AT = STARTS_AT + 120_000;
const WORDS_AT = ENDS_AT + 2_000;
const ROUND = { startsAt: STARTS_AT, endsAt: ENDS_AT };

/** The TV watching the round at `now`. */
function inRound(now: number): CueMoment {
  return { now, phase: 'round', round: ROUND, wordsStartAt: null };
}

/** The TV after the results, at `now`, with the scroll starting at `wordsStartAt`. */
function inResults(now: number, wordsStartAt: number | null = WORDS_AT): CueMoment {
  return { now, phase: 'results', round: ROUND, wordsStartAt };
}

/** The first reading after a page loads: no room yet. */
function opening(now: number): CueMoment {
  return { now, phase: null, round: null, wordsStartAt: null };
}

/** Every cue along `moments`, read in order. */
function cuesAlong(moments: readonly CueMoment[]): AudioCue[] {
  const cues: AudioCue[] = [];
  let before: CueMoment | null = null;
  for (const moment of moments) {
    cues.push(...cuesBetween(before, moment));
    before = moment;
  }
  return cues;
}

/** A reading every `stepMs` from `from` up to `to`, with what the TV knew at each. */
function readings(from: number, to: number, stepMs: number, at: (now: number) => CueMoment): CueMoment[] {
  const moments: CueMoment[] = [];
  for (let now = from; now <= to; now += stepMs) moments.push(at(now));
  return moments;
}

describe('a whole round', () => {
  test.each([1, 100, 137])('plays each cue once, reading the clock every %i ms', (stepMs) => {
    const results = ENDS_AT + 50;
    const cues = cuesAlong(readings(STARTS_AT - 3_000, WORDS_AT + 10_000, stepMs, (now) => (now < results ? inRound(now) : inResults(now))));

    expect(cues).toEqual(['round-start', 'last-seconds', 'time-up', 'words-start']);
  });
});

describe('each cue at its instant', () => {
  test('starts the round at startsAt, not a moment before', () => {
    expect(cuesBetween(inRound(STARTS_AT - 2), inRound(STARTS_AT - 1))).toEqual([]);
    expect(cuesBetween(inRound(STARTS_AT - 1), inRound(STARTS_AT))).toEqual(['round-start']);
    expect(cuesBetween(inRound(STARTS_AT), inRound(STARTS_AT + 1))).toEqual([]);
  });

  test('warns at exactly 10 seconds left', () => {
    const tenSecondsLeft = ENDS_AT - 10_000;

    expect(cuesBetween(inRound(tenSecondsLeft - 2), inRound(tenSecondsLeft - 1))).toEqual([]);
    expect(cuesBetween(inRound(tenSecondsLeft - 1), inRound(tenSecondsLeft))).toEqual(['last-seconds']);
    expect(cuesBetween(inRound(tenSecondsLeft), inRound(tenSecondsLeft + 1))).toEqual([]);
  });

  test('whistles when the time is up', () => {
    expect(cuesBetween(inRound(ENDS_AT - 2), inRound(ENDS_AT - 1))).toEqual([]);
    expect(cuesBetween(inRound(ENDS_AT - 1), inRound(ENDS_AT))).toEqual(['time-up']);
    expect(cuesBetween(inRound(ENDS_AT), inRound(ENDS_AT + 1))).toEqual([]);
  });

  test('whistles when the results get there a moment before the end by the clock', () => {
    expect(cuesBetween(inResults(ENDS_AT - 1), inResults(ENDS_AT))).toEqual(['time-up']);
  });

  test('marks the start of the scroll', () => {
    expect(cuesBetween(inResults(WORDS_AT - 2), inResults(WORDS_AT - 1))).toEqual([]);
    expect(cuesBetween(inResults(WORDS_AT - 1), inResults(WORDS_AT))).toEqual(['words-start']);
    expect(cuesBetween(inResults(WORDS_AT), inResults(WORDS_AT + 1))).toEqual([]);
  });

  test('marks the scroll of results that came late to a TV watching the round', () => {
    const lateArrival = WORDS_AT + 700;

    expect(cuesBetween(inRound(lateArrival - 100), inResults(lateArrival, lateArrival))).toEqual(['words-start']);
  });
});

describe('a TV that was not there', () => {
  test('plays nothing on the first reading', () => {
    expect(cuesBetween(null, inRound(STARTS_AT))).toEqual([]);
    expect(cuesBetween(null, inRound(ENDS_AT))).toEqual([]);
    expect(cuesBetween(null, inResults(WORDS_AT))).toEqual([]);
  });

  test('a reload in the middle of the round replays nothing', () => {
    const middle = STARTS_AT + 60_000;

    const cues = cuesAlong([opening(middle), inRound(middle + 100), inRound(middle + 200)]);

    expect(cues).toEqual([]);
  });

  test('a reload in the countdown still gets the cues ahead', () => {
    const cues = cuesAlong([opening(STARTS_AT - 1_000), inRound(STARTS_AT - 900), inRound(STARTS_AT)]);

    expect(cues).toEqual(['round-start']);
  });

  test('a reload in the middle of the scroll does not replay its start', () => {
    // The welcome comes first and the results after; the restarted scroll begins when they arrive.
    const reloadAt = WORDS_AT + 20_000;
    const arrival = reloadAt + 150;

    const cues = cuesAlong([opening(reloadAt), inResults(reloadAt + 100, null), inResults(arrival + 50, arrival)]);

    expect(cues).toEqual([]);
  });

  test('a reload in the middle of the scroll with welcome and results together does not replay its start', () => {
    const reloadAt = WORDS_AT + 20_000;

    expect(cuesAlong([opening(reloadAt), inResults(reloadAt + 100, reloadAt + 50)])).toEqual([]);
  });

  test('a reconnect in the middle of the round replays nothing', () => {
    const middle = STARTS_AT + 60_000;

    // The welcome brings the same round, and only the clock moved.
    expect(cuesAlong(readings(middle, middle + 5_000, 100, inRound))).toEqual([]);
  });

  test('a reconnect in the middle of the scroll replays nothing', () => {
    // The welcome empties the view for an instant, but the plan stays and its start is already behind.
    const afterStart = WORDS_AT + 20_000;

    const cues = cuesAlong([inResults(afterStart), inResults(afterStart + 100), inResults(afterStart + 200)]);

    expect(cues).toEqual([]);
  });

  test('a reconnect to a new round that already started does not play its start', () => {
    const nextRound = { startsAt: ENDS_AT + 60_000, endsAt: ENDS_AT + 180_000 };
    const middle = nextRound.startsAt + 30_000;

    const cues = cuesBetween(inResults(middle - 100), { now: middle, phase: 'round', round: nextRound, wordsStartAt: null });

    expect(cues).toEqual([]);
  });
});

describe('outside a round', () => {
  test('plays nothing in the lobby', () => {
    const lobby = (now: number): CueMoment => ({ now, phase: 'lobby', round: null, wordsStartAt: null });

    expect(cuesAlong(readings(0, 300_000, 1_000, lobby))).toEqual([]);
  });

  test('plays no round start or warning once the results came', () => {
    expect(cuesBetween(inResults(STARTS_AT - 1, null), inResults(STARTS_AT, null))).toEqual([]);
    expect(cuesBetween(inResults(ENDS_AT - 10_001, null), inResults(ENDS_AT - 10_000, null))).toEqual([]);
  });
});
