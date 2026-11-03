import type { RoundInfo, RoundResultsMessage } from '@bwords/core';
import { signal } from '@preact/signals';
import { describe, expect, test } from 'vitest';
import { INITIAL_VIEW, type RoomView } from '../model/room-view.ts';
import { createRevealClock } from './reveal.ts';

const ENDS_AT = 100_000;
const WORDS_AT = ENDS_AT + 2_000;

const ROUND: RoundInfo = { id: 1, index: 0, board: [['a']], startsAt: 0, endsAt: ENDS_AT };

const RESULTS: RoundResultsMessage = {
  type: 'round-results',
  index: 0,
  shared: [{ word: 'casa', points: 2, foundBy: ['ana', 'beto'] }],
  players: [],
  longest: null,
  possibleWords: 10,
  last: false,
};

const IN_ROUND: RoomView = { ...INITIAL_VIEW, code: 'KBXT', phase: 'round', round: ROUND };
const IN_WORDS: RoomView = { ...IN_ROUND, phase: 'words', results: RESULTS };

/** A reveal clock over a room signal and a clock the test moves; the clock reads the server unless told otherwise. */
function setup(initial: RoomView = IN_ROUND, synced = true) {
  const room = signal(initial);
  const clockSynced = signal(synced);
  let now = ENDS_AT;
  const reveal = createRevealClock({ room, serverNow: () => now, clockSynced });
  return {
    room,
    reveal,
    clockSynced,
    setNow(value: number) {
      now = value;
    },
  };
}

describe('createRevealClock', () => {
  test('has no stage during the round', () => {
    const { reveal } = setup();

    expect(reveal.stageAt(ENDS_AT + 1_000)).toBeNull();
  });

  test('keeps "Tempo!" for two seconds when the results arrive at the end of the round', () => {
    const { room, reveal } = setup();

    room.value = IN_WORDS;

    expect(reveal.stageAt(ENDS_AT)).toBe('time-up');
    expect(reveal.stageAt(WORDS_AT - 1)).toBe('time-up');
    expect(reveal.stageAt(WORDS_AT)).toBe('words');
  });

  test('starts the words at the arrival of results that come late', () => {
    const { room, reveal, setNow } = setup();
    setNow(WORDS_AT + 700);

    room.value = IN_WORDS;

    expect(reveal.plan.value?.wordsStartAt).toBe(WORDS_AT + 700);
  });

  test('takes a podium through the same stages when the last round ends', () => {
    const { room, reveal } = setup();

    room.value = { ...IN_WORDS, results: { ...RESULTS, last: true } };
    expect(reveal.stageAt(ENDS_AT)).toBe('time-up');
    expect(reveal.stageAt(WORDS_AT)).toBe('words');
    room.value = { ...room.value, phase: 'podium', podium: [] };

    expect(reveal.stageAt(WORDS_AT + 500)).toBe('result');
  });

  test('never opens the result while the room is on the words', () => {
    const { room, reveal } = setup();
    room.value = IN_WORDS;

    expect(reveal.stageAt(WORDS_AT + 60_000)).toBe('words');
    expect(reveal.stageAt(WORDS_AT + 3_600_000)).toBe('words');

    room.value = { ...IN_WORDS, phase: 'results' };

    expect(reveal.stageAt(WORDS_AT + 3_600_000)).toBe('result');
  });

  test('notes the instant the result opens, for the lit tiles', () => {
    const { room, reveal, setNow } = setup();
    room.value = IN_WORDS;
    expect(reveal.plan.value?.resultShownAt).toBeNull();

    setNow(WORDS_AT + 40_000);
    room.value = { ...IN_WORDS, phase: 'results' };

    expect(reveal.plan.value).toEqual({ wordsStartAt: WORDS_AT, resultShownAt: WORDS_AT + 40_000 });
  });

  test('keeps the plan when a reconnect brings the same results again', () => {
    const { room, reveal, setNow } = setup();
    room.value = IN_WORDS;
    const plan = reveal.plan.value;

    setNow(WORDS_AT + 30_000);
    room.value = { ...IN_WORDS, results: null };
    room.value = { ...IN_WORDS, results: { ...RESULTS } };

    expect(reveal.plan.value).toBe(plan);
    expect(reveal.results.value).toBe(RESULTS);
  });

  test('plans again when a reconnect finds another match ended at the same index', () => {
    const { room, reveal, setNow } = setup();
    room.value = IN_WORDS;
    const otherMatchEndsAt = ENDS_AT + 300_000;
    const otherRound: RoundInfo = { ...ROUND, id: 7, endsAt: otherMatchEndsAt };
    const otherResults: RoundResultsMessage = { ...RESULTS, shared: [{ word: 'bola', points: 2, foundBy: ['caio'] }] };

    setNow(otherMatchEndsAt);
    room.value = { ...IN_WORDS, round: otherRound, results: null };
    room.value = { ...IN_WORDS, round: otherRound, results: otherResults };

    expect(reveal.results.value).toBe(otherResults);
    expect(reveal.plan.value?.wordsStartAt).toBe(otherMatchEndsAt + 2_000);
  });

  test('restarts the words in a new store, as after a reload', () => {
    const reloaded = setup();
    reloaded.setNow(WORDS_AT + 30_000);

    reloaded.room.value = IN_WORDS;

    expect(reloaded.reveal.stageAt(WORDS_AT + 30_000)).toBe('words');
  });

  test('restarts the words at the server time after a reload, with the TV clock two minutes off', () => {
    const serverArrival = WORDS_AT + 30_000;
    for (const skewMs of [120_000, -120_000]) {
      const reloaded = setup(IN_ROUND, false);
      reloaded.setNow(serverArrival + skewMs);

      reloaded.room.value = IN_WORDS;
      expect(reloaded.reveal.plan.value, `${skewMs} ms`).toBeNull();
      expect(reloaded.reveal.results.value, `${skewMs} ms`).toBe(RESULTS);
      reloaded.setNow(serverArrival);
      reloaded.clockSynced.value = true;

      expect(reloaded.reveal.plan.value?.wordsStartAt, `${skewMs} ms`).toBe(serverArrival);
      expect(reloaded.reveal.stageAt(serverArrival), `${skewMs} ms`).toBe('words');
    }
  });

  test('forgets the plan when the next round starts', () => {
    const { room, reveal } = setup();
    room.value = IN_WORDS;

    room.value = { ...IN_ROUND, round: { ...ROUND, id: 2, index: 1 } };

    expect(reveal.stageAt(WORDS_AT)).toBeNull();
  });

  test('forgets the plan when the room goes back to the lobby', () => {
    const { room, reveal } = setup();
    room.value = IN_WORDS;

    room.value = { ...INITIAL_VIEW, code: 'KBXT', phase: 'lobby' };

    expect(reveal.stageAt(WORDS_AT)).toBeNull();
  });

  test('plans the same index again after a new match', () => {
    const { room, reveal, setNow } = setup();
    room.value = IN_WORDS;
    room.value = IN_ROUND;

    setNow(ENDS_AT + 50_000);
    room.value = IN_WORDS;

    expect(reveal.plan.value?.wordsStartAt).toBe(ENDS_AT + 50_000);
  });

  test('shows the words at once when the TV connected without the round', () => {
    const { room, reveal, setNow } = setup({ ...INITIAL_VIEW, code: 'KBXT', phase: 'words' });
    setNow(5_000);

    room.value = { ...INITIAL_VIEW, code: 'KBXT', phase: 'words', results: RESULTS };

    expect(reveal.stageAt(5_000)).toBe('words');
  });
});
