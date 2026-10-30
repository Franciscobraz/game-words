import type { RoundResultsMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { foundWordCount, resultStartAt, revealPlan, revealStage, scrollDurationMs } from './reveal.ts';

const ENDS_AT = 100_000;

/** The results of a round with the words `shared` and each player's `unique` words. */
function resultsWith(shared: readonly string[], ...unique: readonly (readonly string[])[]): RoundResultsMessage {
  const toWord = (word: string) => ({ word, points: 1 });
  return {
    type: 'round-results',
    index: 0,
    shared: shared.map((word) => ({ ...toWord(word), foundBy: ['ana', 'beto'] })),
    players: unique.map((words, index) => ({ playerId: `p${index}`, unique: words.map(toWord), roundPoints: 0, score: 0 })),
    longest: null,
    possibleWords: 100,
    last: false,
  };
}

describe('scrollDurationMs', () => {
  test('scrolls two words per second', () => {
    expect(scrollDurationMs(10)).toBe(5_000);
    expect(scrollDurationMs(1)).toBe(500);
  });

  test('never scrolls for more than sixty seconds', () => {
    expect(scrollDurationMs(119)).toBe(59_500);
    expect(scrollDurationMs(120)).toBe(60_000);
    expect(scrollDurationMs(121)).toBe(60_000);
    expect(scrollDurationMs(500)).toBe(60_000);
  });
});

describe('foundWordCount', () => {
  test('counts the shared words and the unique words of every player', () => {
    expect(foundWordCount(resultsWith(['casa', 'cera'], ['nua'], ['tia', 'rins']))).toBe(5);
  });
});

describe('revealPlan', () => {
  test('keeps "Tempo!" for two seconds when the results arrive early', () => {
    expect(revealPlan(resultsWith([]), ENDS_AT, ENDS_AT + 10).wordsStartAt).toBe(ENDS_AT + 2_000);
  });

  test('starts the words when the results arrive after the two seconds', () => {
    expect(revealPlan(resultsWith([]), ENDS_AT, ENDS_AT + 3_000).wordsStartAt).toBe(ENDS_AT + 3_000);
  });

  test('starts the words at once when the TV connected without the round', () => {
    expect(revealPlan(resultsWith([]), null, 500).wordsStartAt).toBe(500);
  });

  test('takes the scroll from the words of the round', () => {
    expect(revealPlan(resultsWith(['casa'], ['nua', 'tia', 'rins']), ENDS_AT, ENDS_AT).scrollMs).toBe(2_000);
  });
});

describe('revealStage', () => {
  test('starts the words two seconds after the end', () => {
    const plan = revealPlan(resultsWith(['casa']), ENDS_AT, ENDS_AT);

    expect(revealStage(ENDS_AT, plan)).toBe('time-up');
    expect(revealStage(ENDS_AT + 1_999, plan)).toBe('time-up');
    expect(revealStage(ENDS_AT + 2_000, plan)).toBe('words');
  });

  test('holds for five seconds after the last word', () => {
    const plan = { wordsStartAt: 10_000, scrollMs: 5_000 };

    expect(revealStage(14_999, plan)).toBe('words');
    expect(revealStage(15_000, plan)).toBe('hold');
    expect(revealStage(19_999, plan)).toBe('hold');
    expect(revealStage(20_000, plan)).toBe('result');
    expect(resultStartAt(plan)).toBe(20_000);
  });

  test('waits five seconds when no word was found', () => {
    const plan = revealPlan(resultsWith([]), ENDS_AT, ENDS_AT);
    expect(plan.scrollMs).toBe(0);

    expect(revealStage(ENDS_AT + 2_000, plan)).toBe('hold');
    expect(revealStage(ENDS_AT + 6_999, plan)).toBe('hold');
    expect(revealStage(ENDS_AT + 7_000, plan)).toBe('result');
  });
});
