import type { RoundResultsMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { foundWordCount, revealPlan, revealStage } from './reveal.ts';

const ENDS_AT = 100_000;

/** The results of a round with the words `shared` and each player's `unique` words. */
function resultsWith(shared: readonly string[], ...unique: readonly (readonly string[])[]): RoundResultsMessage {
  const toWord = (word: string) => ({ word, points: 1 });
  return {
    type: 'round-results',
    index: 0,
    shared: shared.map((word) => ({ ...toWord(word), foundBy: ['ana', 'beto'] })),
    players: unique.map((words, index) => ({ playerId: `p${index}`, unique: words.map(toWord), roundPoints: 0, roundWords: 0, score: 0, words: 0 })),
    longest: null,
    possibleWords: 100,
    last: false,
  };
}

describe('foundWordCount', () => {
  test('counts the shared words and the unique words of every player', () => {
    expect(foundWordCount(resultsWith(['casa', 'cera'], ['nua'], ['tia', 'rins']))).toBe(5);
  });
});

describe('revealPlan', () => {
  test('keeps "Tempo!" for two seconds when the results arrive early', () => {
    expect(revealPlan(ENDS_AT, ENDS_AT + 10).wordsStartAt).toBe(ENDS_AT + 2_000);
  });

  test('starts the words when the results arrive after the two seconds', () => {
    expect(revealPlan(ENDS_AT, ENDS_AT + 3_000).wordsStartAt).toBe(ENDS_AT + 3_000);
  });

  test('starts the words at once when the TV connected without the round', () => {
    expect(revealPlan(null, 500).wordsStartAt).toBe(500);
  });

  test('has no result opened yet', () => {
    expect(revealPlan(ENDS_AT, ENDS_AT).resultShownAt).toBeNull();
  });
});

describe('revealStage', () => {
  test('starts the words two seconds after the end', () => {
    const plan = revealPlan(ENDS_AT, ENDS_AT);

    expect(revealStage(ENDS_AT, plan, 'words')).toBe('time-up');
    expect(revealStage(ENDS_AT + 1_999, plan, 'words')).toBe('time-up');
    expect(revealStage(ENDS_AT + 2_000, plan, 'words')).toBe('words');
  });

  test('keeps the words for as long as the room is on them', () => {
    const plan = revealPlan(ENDS_AT, ENDS_AT);

    expect(revealStage(ENDS_AT + 3_600_000, plan, 'words')).toBe('words');
  });

  test('shows the result in the results and on the podium', () => {
    const plan = revealPlan(ENDS_AT, ENDS_AT);

    expect(revealStage(ENDS_AT + 2_000, plan, 'results')).toBe('result');
    expect(revealStage(ENDS_AT + 2_000, plan, 'podium')).toBe('result');
  });
});
