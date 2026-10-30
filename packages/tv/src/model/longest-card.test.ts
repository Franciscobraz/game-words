import type { LongestResult, PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { longestCard } from './longest-card.ts';

function player(id: string, nickname: string): PlayerInfo {
  return { id, nickname, color: '#FF7A00', connected: true, spectator: false, score: 0, wins: 0 };
}

const PLAYERS = [player('p1', 'Ana'), player('p2', 'Beto'), player('p3', 'Caio')];

function longest(foundBy: string[], overrides: Partial<LongestResult> = {}): LongestResult {
  return { word: 'ternos', points: 4, path: [0], foundBy, ...overrides };
}

describe('longestCard', () => {
  test('says who found the word, with the word in upper case and its spellings', () => {
    const card = longestCard(longest(['p1'], { word: 'seria', spellings: ['seria', 'séria'] }), PLAYERS);

    expect(card).toEqual({ word: 'SERIA', spellings: ['seria', 'séria'], finders: 'Ana encontrou!' });
  });

  test('names everyone who found the word', () => {
    expect(longestCard(longest(['p1', 'p2']), PLAYERS).finders).toBe('Ana e Beto encontraram!');
    expect(longestCard(longest(['p1', 'p2', 'p3']), PLAYERS).finders).toBe('Ana, Beto e Caio encontraram!');
  });

  test('says when nobody found the word', () => {
    expect(longestCard(longest([]), PLAYERS).finders).toBe('Ninguém encontrou');
  });
});
