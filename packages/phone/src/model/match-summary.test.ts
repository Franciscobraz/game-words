import { describe, expect, test } from 'vitest';
import { addRound, matchSummary, type RoundRecord } from './match-summary.ts';
import type { WordRow } from './results.ts';

/** A word of the player's result list. */
function row(word: string, points: number, kind: WordRow['kind'] = 'shared', spellings: string[] = []): WordRow {
  return { word, spellings, kind, points, basePoints: kind === 'unique' ? points / 2 : points };
}

/** Round `index` of the match as this phone saw it. */
function round(index: number, words: WordRow[]): RoundRecord {
  return { index, words };
}

describe('matchSummary', () => {
  test("counts the player's words across rounds", () => {
    // POD-01 AC 4, AD-007: 3 words in round 1 and 2 in round 2 make "SEU RENDIMENTO" 5.
    const history = [round(0, [row('casa', 2), row('lua', 1), row('quero', 3)]), round(1, [row('mesa', 2), row('sol', 1)])];

    expect(matchSummary(history).wordCount).toBe(5);
  });

  test('keeps the longest word with spellings, points and length', () => {
    // POD-01 AC 5, AD-007: CORACOES, unique in round 2, is the longest: "(corações)", its 12 points and 8 letters.
    const coracoes = row('coracoes', 12, 'unique', ['corações']);
    const history = [round(0, [row('casa', 2), row('quero', 3)]), round(1, [row('lua', 1), coracoes])];

    expect(matchSummary(history).longest).toEqual({ word: 'coracoes', spellings: ['corações'], points: 12, letters: 8 });
  });

  test('breaks a tie in length with the first word in alphabetical order', () => {
    // DESIGN §4.3: of MESA, CASA and LOJA, all with 4 letters, CASA is kept, whichever round found it.
    const history = [round(0, [row('mesa', 2)]), round(1, [row('loja', 4, 'unique'), row('casa', 2)])];

    expect(matchSummary(history).longest?.word).toBe('casa');
  });

  test('has no words and no longest word before a round ends', () => {
    expect(matchSummary([])).toEqual({ wordCount: 0, longest: null });
    expect(matchSummary([round(0, [])])).toEqual({ wordCount: 0, longest: null });
  });
});

describe('addRound', () => {
  test('adds each round once, replacing a round the phone got again', () => {
    // A reconnect in the results gets the same `round-results` again; the words must not count twice.
    const first = addRound([], round(0, [row('casa', 2)]));
    const second = addRound(first, round(1, [row('lua', 1)]));
    const again = addRound(second, round(1, [row('lua', 1)]));

    expect(again).toEqual([round(0, [row('casa', 2)]), round(1, [row('lua', 1)])]);
    expect(matchSummary(again).wordCount).toBe(2);
  });
});
