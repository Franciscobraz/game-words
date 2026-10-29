import type { PlayerResult, RoundResultsMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import type { FoundWord } from './room-view.ts';
import { myRoundSummary, myWordRows, spellingsLabel, wordLabel } from './results.ts';

/** A player's line of `round-results`. */
function line(playerId: string, roundPoints: number, score: number, unique: PlayerResult['unique'] = []): PlayerResult {
  return { playerId, unique, roundPoints, score };
}

/** The end of round 1 of 3: players from the lowest to the highest score, as the server sends them. */
function results(players: PlayerResult[], shared: RoundResultsMessage['shared'] = []): RoundResultsMessage {
  return { type: 'round-results', index: 0, shared, players, longest: null, last: false };
}

/** A word the server accepted from this phone. */
function accepted(word: string): FoundWord {
  return { word, points: Math.max(0, word.length - 2), confirmed: true };
}

describe('myRoundSummary', () => {
  test('summarizes round points, total and position', () => {
    // RES-01 AC 2: Beto scored 9 this round, 25 in all, behind Ana's 32: "Você está em 2º lugar".
    const message = results([line('p3', 4, 16), line('p2', 9, 25), line('p1', 18, 32)]);

    const beto = myRoundSummary(message, 'p2');
    const ana = myRoundSummary(message, 'p1');

    expect(beto).toEqual({ roundPoints: 9, total: 25, place: 2 });
    expect(ana).toEqual({ roundPoints: 18, total: 32, place: 1 });
  });

  test('shares the place on a tied total', () => {
    const message = results([line('p3', 2, 10), line('p2', 5, 20), line('p1', 7, 20)]);

    expect(myRoundSummary(message, 'p2')!.place).toBe(1);
    expect(myRoundSummary(message, 'p1')!.place).toBe(1);
    expect(myRoundSummary(message, 'p3')!.place).toBe(3);
  });

  test('has no summary for a phone outside the round, as a spectator', () => {
    // RES-01 AC 10: the spectator is not in the results, so the screen shows the next-round message instead.
    const message = results([line('p1', 18, 32)]);

    expect(myRoundSummary(message, 'p4')).toBeNull();
    expect(myRoundSummary(message, null)).toBeNull();
  });
});

describe('myWordRows', () => {
  test('shows spellings in parentheses when the server sends them', () => {
    // RES-01 AC 3: "CORACOES (corações)"; FACA with two spellings reads "(faca, faça)"; CASA has none, so only the word.
    const coracoes = { word: 'coracoes', points: 12, spellings: ['corações'] };
    const faca = { word: 'faca', points: 4, spellings: ['faca', 'faça'] };
    const message = results([line('p2', 18, 18, [faca, coracoes])], [{ word: 'casa', points: 2 }]);

    const rows = myWordRows([accepted('coracoes'), accepted('faca'), accepted('casa')], message, 'p2');

    const labels = rows.map((row) => [wordLabel(row.word), spellingsLabel(row.spellings)]);
    expect(labels).toEqual([
      ['CORACOES', '(corações)'],
      ['FACA', '(faca, faça)'],
      ['CASA', null],
    ]);
  });

  test('marks unique words with double points and the base', () => {
    // RES-01 AC 4: CORACOES (8 letters, base 6) only Ana found: "ÚNICA ×2 (+12 pts)", 12 points and "base +6".
    const message = results([line('p1', 12, 12, [{ word: 'coracoes', points: 12, spellings: ['corações'] }])]);

    const rows = myWordRows([accepted('coracoes')], message, 'p1');

    expect(rows).toEqual([{ word: 'coracoes', spellings: ['corações'], kind: 'unique', points: 12, basePoints: 6 }]);
  });

  test('marks shared words as em comum', () => {
    // RES-01 AC 5, AD-008: LUA and CASA were found by Ana and Beto, so they show "em comum" with their simple points.
    const message = results(
      [line('p2', 3, 3), line('p1', 3, 3)],
      [
        { word: 'lua', points: 1 },
        { word: 'casa', points: 2 },
      ],
    );

    const rows = myWordRows([accepted('lua'), accepted('casa')], message, 'p1');

    expect(rows).toEqual([
      { word: 'casa', spellings: [], kind: 'shared', points: 2, basePoints: 2 },
      { word: 'lua', spellings: [], kind: 'shared', points: 1, basePoints: 1 },
    ]);
  });

  test('lists only the shared words this phone found and the server accepted', () => {
    // QUERO was shared by others; MAR was still waiting when the round closed, so the server never took it.
    const message = results(
      [line('p2', 1, 1), line('p1', 1, 1)],
      [
        { word: 'lua', points: 1 },
        { word: 'quero', points: 3 },
        { word: 'mar', points: 1 },
      ],
    );
    const waiting: FoundWord = { word: 'mar', points: 1, confirmed: false };

    const rows = myWordRows([waiting, accepted('lua')], message, 'p1');

    expect(rows.map((row) => row.word)).toEqual(['lua']);
  });

  test('puts the highest points first, then in alphabetical order', () => {
    const message = results(
      [line('p1', 21, 21, [{ word: 'coracoes', points: 12 }])],
      [
        { word: 'lua', points: 1 },
        { word: 'casa', points: 2 },
        { word: 'mesa', points: 2 },
        { word: 'quero', points: 3 },
      ],
    );
    const found = ['lua', 'mesa', 'casa', 'quero', 'coracoes'].map(accepted);

    const rows = myWordRows(found, message, 'p1');

    expect(rows.map((row) => row.word)).toEqual(['coracoes', 'quero', 'casa', 'mesa', 'lua']);
  });

  test('has no words for a spectator', () => {
    const message = results([line('p1', 2, 2, [{ word: 'casa', points: 4 }])]);

    expect(myWordRows([], message, 'p4')).toEqual([]);
  });
});
