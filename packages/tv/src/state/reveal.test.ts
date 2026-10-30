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
const IN_RESULTS: RoomView = { ...IN_ROUND, phase: 'results', results: RESULTS };

/** A reveal clock over a room signal and a clock the test moves. */
function setup(initial: RoomView = IN_ROUND) {
  const room = signal(initial);
  let now = ENDS_AT;
  const reveal = createRevealClock({ room, serverNow: () => now });
  return {
    room,
    reveal,
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

    room.value = IN_RESULTS;

    expect(reveal.stageAt(ENDS_AT)).toBe('time-up');
    expect(reveal.stageAt(WORDS_AT - 1)).toBe('time-up');
    expect(reveal.stageAt(WORDS_AT)).toBe('words');
  });

  test('starts the words at the arrival of results that come late', () => {
    const { room, reveal, setNow } = setup();
    setNow(WORDS_AT + 700);

    room.value = IN_RESULTS;

    expect(reveal.plan.value?.wordsStartAt).toBe(WORDS_AT + 700);
  });

  test('takes a podium through the same stages when the last round ends', () => {
    const { room, reveal } = setup();

    room.value = { ...IN_RESULTS, results: { ...RESULTS, last: true } };
    room.value = { ...room.value, phase: 'podium', podium: [] };

    expect(reveal.stageAt(ENDS_AT)).toBe('time-up');
    expect(reveal.stageAt(WORDS_AT)).toBe('words');
    expect(reveal.stageAt(WORDS_AT + 500)).toBe('hold');
    expect(reveal.stageAt(WORDS_AT + 5_500)).toBe('result');
  });

  test('keeps the plan when a reconnect brings the same results again', () => {
    const { room, reveal, setNow } = setup();
    room.value = IN_RESULTS;
    const plan = reveal.plan.value;

    setNow(WORDS_AT + 30_000);
    room.value = { ...IN_RESULTS, results: null };
    room.value = { ...IN_RESULTS, results: { ...RESULTS } };

    expect(reveal.plan.value).toBe(plan);
    expect(reveal.results.value).toBe(RESULTS);
  });

  test('restarts the words in a new store, as after a reload', () => {
    const reloaded = setup();
    reloaded.setNow(WORDS_AT + 30_000);

    reloaded.room.value = IN_RESULTS;

    expect(reloaded.reveal.stageAt(WORDS_AT + 30_000)).toBe('words');
  });

  test('forgets the plan when the next round starts', () => {
    const { room, reveal } = setup();
    room.value = IN_RESULTS;

    room.value = { ...IN_ROUND, round: { ...ROUND, id: 2, index: 1 } };

    expect(reveal.stageAt(WORDS_AT)).toBeNull();
  });

  test('forgets the plan when the room goes back to the lobby', () => {
    const { room, reveal } = setup();
    room.value = IN_RESULTS;

    room.value = { ...INITIAL_VIEW, code: 'KBXT', phase: 'lobby' };

    expect(reveal.stageAt(WORDS_AT)).toBeNull();
  });

  test('plans the same index again after a new match', () => {
    const { room, reveal, setNow } = setup();
    room.value = IN_RESULTS;
    room.value = IN_ROUND;

    setNow(ENDS_AT + 50_000);
    room.value = IN_RESULTS;

    expect(reveal.plan.value?.wordsStartAt).toBe(ENDS_AT + 50_000);
  });

  test('shows the words at once when the TV connected without the round', () => {
    const { room, reveal, setNow } = setup({ ...INITIAL_VIEW, code: 'KBXT', phase: 'results' });
    setNow(5_000);

    room.value = { ...INITIAL_VIEW, code: 'KBXT', phase: 'results', results: RESULTS };

    expect(reveal.stageAt(5_000)).toBe('words');
  });
});
