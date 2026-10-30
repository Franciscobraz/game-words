import type { PlayerInfo, ResultWord, RoundResultsMessage, SharedWord } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { wordRows, type WordRow } from './word-rows.ts';

function player(id: string, nickname: string): PlayerInfo {
  return { id, nickname, color: '#FF7A00', connected: true, spectator: false, score: 0, wins: 0 };
}

const ANA = player('ana', 'Ana');
const BETO = player('beto', 'Beto');
const CAIO = player('caio', 'Caio');
const PLAYERS = [ANA, BETO, CAIO];

function sharedWord(word: string, foundBy: string[] = ['ana', 'beto']): SharedWord {
  return { word, points: 1, foundBy };
}

function uniqueWord(word: string): ResultWord {
  return { word, points: 2 };
}

function resultsWith(shared: SharedWord[], unique: Record<string, ResultWord[]>): RoundResultsMessage {
  return {
    type: 'round-results',
    index: 0,
    shared,
    players: Object.entries(unique).map(([playerId, words]) => ({ playerId, unique: words, roundPoints: 0, score: 0 })),
    longest: null,
    possibleWords: 100,
    last: false,
  };
}

/** Each line as text: the group's name or the word. */
function lineTexts(rows: readonly WordRow[]): string[] {
  return rows.map((row) => (row.kind === 'title' ? `#${row.group}` : row.word));
}

describe('wordRows', () => {
  test('lists shared words before unique words', () => {
    const results = resultsWith([sharedWord('casa')], { ana: [uniqueWord('sol')] });

    expect(lineTexts(wordRows(results, PLAYERS))).toEqual(['#shared', 'CASA', '#unique', 'SOL']);
  });

  test('leaves out the title of an empty group', () => {
    expect(lineTexts(wordRows(resultsWith([], { ana: [uniqueWord('sol')] }), PLAYERS))).toEqual(['#unique', 'SOL']);
    expect(lineTexts(wordRows(resultsWith([sharedWord('sol')], { ana: [] }), PLAYERS))).toEqual(['#shared', 'SOL']);
  });

  test('has no lines when nobody found a word', () => {
    expect(wordRows(resultsWith([], { ana: [], beto: [] }), PLAYERS)).toEqual([]);
  });

  test('orders each group by length and then by letter', () => {
    const results = resultsWith([sharedWord('quero'), sharedWord('cera'), sharedWord('ser'), sharedWord('casa')], {
      ana: [uniqueWord('seria'), uniqueWord('tia')],
      beto: [uniqueWord('rins'), uniqueWord('nua')],
    });

    expect(lineTexts(wordRows(results, PLAYERS))).toEqual([
      '#shared',
      'SER',
      'CASA',
      'CERA',
      'QUERO',
      '#unique',
      'NUA',
      'TIA',
      'RINS',
      'SERIA',
    ]);
  });

  test('fills each row with spellings finders and points', () => {
    const results = resultsWith([{ word: 'seria', points: 3, spellings: ['seria', 'séria'], foundBy: ['ana', 'caio'] }], {
      beto: [{ word: 'rins', points: 4 }],
    });

    const [, shared, , unique] = wordRows(results, PLAYERS);

    expect(shared).toEqual({ kind: 'word', word: 'SERIA', spellings: ['seria', 'séria'], finders: [ANA, CAIO], points: 3, striped: true });
    expect(unique).toEqual({ kind: 'word', word: 'RINS', spellings: [], finders: [BETO], points: 4, striped: true });
  });

  test('writes a word in upper case without accents', () => {
    const [, row] = wordRows(resultsWith([sharedWord('sêmen')], {}), PLAYERS);

    expect(row).toMatchObject({ word: 'SEMEN' });
  });

  test('stripes every other word of each group', () => {
    const results = resultsWith([sharedWord('a'), sharedWord('b')], { ana: [uniqueWord('c')] });

    const striped = wordRows(results, PLAYERS).flatMap((row) => (row.kind === 'word' ? [row.striped] : []));

    expect(striped).toEqual([true, false, true]);
  });

  test('keeps the words of a kicked player', () => {
    const results = resultsWith([sharedWord('casa', ['ana', 'caio'])], { caio: [uniqueWord('tia')] });

    const rows = wordRows(results, [ANA, BETO]);

    expect(lineTexts(rows)).toEqual(['#shared', 'CASA', '#unique', 'TIA']);
    expect(rows[1]).toMatchObject({ finders: [ANA], points: 1 });
    expect(rows[3]).toMatchObject({ finders: [], points: 2 });
  });
});
