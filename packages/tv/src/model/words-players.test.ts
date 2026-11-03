import type { PlayerInfo, RoundResultsMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { wordsPlayers } from './words-players.ts';

function player(id: string, nickname: string, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id, nickname, color: '#FF7A00', connected: true, spectator: false, score: 0, words: 0, wins: 0, ...overrides };
}

// Joined in this order.
const ANA = player('ana', 'Ana');
const BETO = player('beto', 'Beto', { color: '#00C2FF' });
const CAIO = player('caio', 'Caio', { color: '#10D078' });
const LATE = player('late', 'Lia');

/**
 * The list on the screen: ASA (Ana, Beto, 1), CASA (Beto, Caio, 2), then the unique words TIA (Caio, 4) and QUERO
 * (Beto, 6). Round points: Ana 1, Beto 9, Caio 6.
 */
const RESULTS: RoundResultsMessage = {
  type: 'round-results',
  index: 0,
  shared: [
    { word: 'casa', points: 2, foundBy: ['beto', 'caio'] },
    { word: 'asa', points: 1, foundBy: ['ana', 'beto'] },
  ],
  players: [
    { playerId: 'beto', unique: [{ word: 'quero', points: 6 }], roundPoints: 9, roundWords: 3, score: 9, words: 3 },
    { playerId: 'caio', unique: [{ word: 'tia', points: 4 }], roundPoints: 6, roundWords: 2, score: 6, words: 2 },
    { playerId: 'ana', unique: [], roundPoints: 1, roundWords: 1, score: 1, words: 1 },
  ],
  longest: null,
  possibleWords: 50,
  last: false,
};

const PLAYERS = [ANA, BETO, CAIO, LATE];

/** The cards as `id: points @ place`, in the order the panel shows them. */
function panel(cards: ReturnType<typeof wordsPlayers>): string[] {
  return [...cards].sort((a, b) => a.place - b.place).map((card) => `${card.id}: ${card.points} @ ${card.place}`);
}

describe('wordsPlayers', () => {
  test('starts every player of the round at 0 points with all their words', () => {
    const cards = wordsPlayers(RESULTS, PLAYERS, { highlight: null, mode: 'auto' });

    expect(cards.map((card) => card.id)).toEqual(['ana', 'beto', 'caio']);
    expect(cards.map((card) => card.points)).toEqual([0, 0, 0]);
    expect(cards.map((card) => card.wordsText)).toEqual(['1 palavra', '3 palavras', '2 palavras']);
    expect(panel(cards)).toEqual(['ana: 0 @ 0', 'beto: 0 @ 1', 'caio: 0 @ 2']);
  });

  test('adds the highlighted word to whoever found it', () => {
    const atAsa = wordsPlayers(RESULTS, PLAYERS, { highlight: 0, mode: 'auto' });
    const atCasa = wordsPlayers(RESULTS, PLAYERS, { highlight: 1, mode: 'auto' });
    const atTia = wordsPlayers(RESULTS, PLAYERS, { highlight: 2, mode: 'auto' });

    expect(atAsa.map((card) => [card.id, card.points, card.scored])).toEqual([
      ['ana', 1, true],
      ['beto', 1, true],
      ['caio', 0, false],
    ]);
    expect(atCasa.map((card) => [card.id, card.points, card.scored])).toEqual([
      ['ana', 1, false],
      ['beto', 3, true],
      ['caio', 2, true],
    ]);
    expect(atTia.map((card) => [card.id, card.points, card.scored])).toEqual([
      ['ana', 1, false],
      ['beto', 3, false],
      ['caio', 6, true],
    ]);
  });

  test('shows the full round points under manual control', () => {
    const cards = wordsPlayers(RESULTS, PLAYERS, { highlight: null, mode: 'manual' });

    expect(cards.map((card) => [card.id, card.points, card.scored])).toEqual([
      ['ana', 1, false],
      ['beto', 9, false],
      ['caio', 6, false],
    ]);
  });

  test('ends at the round points of the result', () => {
    const cards = wordsPlayers(RESULTS, PLAYERS, { highlight: 3, mode: 'auto' });

    for (const card of cards) {
      expect(card.points, card.id).toBe(RESULTS.players.find(({ playerId }) => playerId === card.id)!.roundPoints);
    }
  });

  test('orders the players by points, ties by joining order', () => {
    expect(panel(wordsPlayers(RESULTS, PLAYERS, { highlight: 0, mode: 'auto' }))).toEqual(['ana: 1 @ 0', 'beto: 1 @ 1', 'caio: 0 @ 2']);
    expect(panel(wordsPlayers(RESULTS, PLAYERS, { highlight: 1, mode: 'auto' }))).toEqual(['beto: 3 @ 0', 'caio: 2 @ 1', 'ana: 1 @ 2']);
    expect(panel(wordsPlayers(RESULTS, PLAYERS, { highlight: 2, mode: 'auto' }))).toEqual(['caio: 6 @ 0', 'beto: 3 @ 1', 'ana: 1 @ 2']);
    expect(panel(wordsPlayers(RESULTS, PLAYERS, { highlight: 3, mode: 'auto' }))).toEqual(['beto: 9 @ 0', 'caio: 6 @ 1', 'ana: 1 @ 2']);
  });

  test('tags the disconnected and leaves out who did not play', () => {
    const cards = wordsPlayers(RESULTS, [ANA, { ...BETO, connected: false }, CAIO, LATE], { highlight: null, mode: 'auto' });

    expect(cards.map((card) => [card.id, card.connected])).toEqual([
      ['ana', true],
      ['beto', false],
      ['caio', true],
    ]);
  });

  test('marks the first two places', () => {
    const atCasa = wordsPlayers(RESULTS, PLAYERS, { highlight: 1, mode: 'auto' });

    expect(atCasa.map((card) => [card.id, card.leader, card.pointsInColor])).toEqual([
      ['ana', false, false],
      ['beto', true, true],
      ['caio', false, true],
    ]);
    const atStart = wordsPlayers(RESULTS, PLAYERS, { highlight: null, mode: 'auto' });
    expect(atStart.some((card) => card.leader || card.pointsInColor)).toBe(false);
  });

  test('writes words and points in full, singular at one', () => {
    const results: RoundResultsMessage = {
      ...RESULTS,
      shared: [],
      players: [
        { playerId: 'ana', unique: [{ word: 'asa', points: 1 }], roundPoints: 1, roundWords: 1, score: 1, words: 1 },
        { playerId: 'beto', unique: [], roundPoints: 0, roundWords: 0, score: 0, words: 0 },
        { playerId: 'caio', unique: [], roundPoints: 20, roundWords: 14, score: 20, words: 14 },
      ],
    };

    const cards = wordsPlayers(results, PLAYERS, { highlight: null, mode: 'manual' });

    expect(cards.map((card) => [card.wordsText, `${card.points} ${card.unit}`])).toEqual([
      ['1 palavra', '1 pt'],
      ['0 palavras', '0 pts'],
      ['14 palavras', '20 pts'],
    ]);
  });
});
