import type { RoundInfo, RoundResultsMessage } from '@bwords/core';
import { signal } from '@preact/signals';
import { describe, expect, test } from 'vitest';
import type { RevealPlan } from '../model/reveal.ts';
import { INITIAL_VIEW, type RoomView } from '../model/room-view.ts';
import { autoHeading, autoOffset, type ScrollLayout, stepOffset } from '../model/word-scroll.ts';
import { createWordScrollStore } from './word-scroll.ts';

const WORDS_AT = 200_000;
const ROW_PX = 60;
const WORD_COUNT = 30;

const ROUND: RoundInfo = { id: 1, index: 0, board: [['a']], startsAt: 0, endsAt: WORDS_AT - 2_000 };

/** A round with `count` shared words, each found by Ana and Beto. */
function resultsWith(count: number, index = 0): RoundResultsMessage {
  const shared = Array.from({ length: count }, (_, word) => ({ word: `w${word}`, points: 1, foundBy: ['ana', 'beto'] }));
  return { type: 'round-results', index, shared, players: [], longest: null, possibleWords: 100, last: false };
}

const LAYOUT: ScrollLayout = {
  panelPx: 600,
  listPx: WORD_COUNT * ROW_PX,
  words: Array.from({ length: WORD_COUNT }, (_, index) => ({ topPx: index * ROW_PX, heightPx: ROW_PX })),
};

const ON_WORDS: RoomView = { ...INITIAL_VIEW, code: 'KBXT', phase: 'words', round: ROUND, results: resultsWith(WORD_COUNT) };

/** The store over a room on the words, its list opening at WORDS_AT, and a clock the test moves. */
function setup() {
  const room = signal(ON_WORDS);
  const results = signal<RoundResultsMessage | null>(ON_WORDS.results);
  const plan = signal<RevealPlan | null>({ wordsStartAt: WORDS_AT, resultShownAt: null });
  let now = WORDS_AT - 1_000;
  let checks = 0;
  const words = createWordScrollStore({
    room,
    plan,
    results,
    serverNow: () => now,
    playCheck: () => {
      checks += 1;
    },
  });
  words.setLayout(LAYOUT);
  return {
    room,
    results,
    plan,
    words,
    checks: () => checks,
    at(ms: number) {
      now = ms;
      words.tick(ms);
    },
  };
}

describe('createWordScrollStore', () => {
  test('moves the list by itself from the clock', () => {
    const { words, at } = setup();

    at(WORDS_AT + 10_000);

    expect(words.mode.value).toBe('auto');
    expect(words.highlight.value).toBe(10);
    expect(words.offset.value).toBe(autoOffset(LAYOUT, 10_000));
  });

  test('plays a check each time a word becomes highlighted', () => {
    const { checks, at } = setup();
    at(WORDS_AT - 1);
    expect(checks()).toBe(0);

    at(WORDS_AT);
    expect(checks()).toBe(1);
    at(WORDS_AT + 500);
    at(WORDS_AT + 999);
    expect(checks()).toBe(1);
    at(WORDS_AT + 1_000);
    expect(checks()).toBe(2);
    at(WORDS_AT + 2_000);
    at(WORDS_AT + 3_000);

    expect(checks()).toBe(4);
  });

  test('drops the highlight and the check after the host\'s first step', () => {
    const { words, checks, at } = setup();
    at(WORDS_AT + 10_000);
    const checksBefore = checks();

    words.step('down');

    expect(words.mode.value).toBe('manual');
    expect(words.highlight.value).toBeNull();
    expect(words.offset.value).toBe(stepOffset(LAYOUT, autoOffset(LAYOUT, 10_000), 'down'));
    at(WORDS_AT + 11_000);
    at(WORDS_AT + 25_000);
    expect(words.highlight.value).toBeNull();
    expect(checks()).toBe(checksBefore);
  });

  test("heads for the next word in the automatic mode and for the host's place under the host", () => {
    const { words, at } = setup();
    at(WORDS_AT + 10_400);
    expect(words.heading.value).toBe(autoHeading(LAYOUT, 10_400));

    words.step('down');

    expect(words.heading.value).toBe(words.offset.value);
  });

  test('steps from where the host left the list', () => {
    const { words, at } = setup();
    at(WORDS_AT + 10_000);
    words.step('down');
    const afterDown = words.offset.value;

    at(WORDS_AT + 20_000);
    words.step('up');

    expect(words.offset.value).toBe(stepOffset(LAYOUT, afterDown, 'up'));
  });

  test('starts every list in the automatic mode', () => {
    const { room, results, plan, words, at } = setup();
    at(WORDS_AT + 5_000);
    words.step('down');
    room.value = { ...ON_WORDS, phase: 'results' };
    expect(words.mode.value).toBe('auto');

    const nextWordsAt = WORDS_AT + 300_000;
    room.value = { ...ON_WORDS, phase: 'round', round: { ...ROUND, id: 2, index: 1 }, results: null };
    plan.value = null;
    room.value = { ...ON_WORDS, round: { ...ROUND, id: 2, index: 1 }, results: resultsWith(WORD_COUNT, 1) };
    results.value = resultsWith(WORD_COUNT, 1);
    plan.value = { wordsStartAt: nextWordsAt, resultShownAt: null };
    words.setLayout(LAYOUT);
    at(nextWordsAt + 3_000);

    expect(words.mode.value).toBe('auto');
    expect(words.highlight.value).toBe(3);
    expect(words.offset.value).toBe(autoOffset(LAYOUT, 3_000));
  });

  test('ignores a step when no list is on the screen', () => {
    const { room, words } = setup();
    room.value = { ...ON_WORDS, phase: 'results' };

    words.step('down');

    expect(words.mode.value).toBe('auto');
  });
});
