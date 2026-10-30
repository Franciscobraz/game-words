import type { PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { standings } from './standings.ts';

function player(nickname: string, score: number, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id: nickname.toLowerCase(), nickname, color: '#FF7A00', connected: true, spectator: false, score, wins: 0, ...overrides };
}

describe('standings', () => {
  test('puts up to three players on top', () => {
    const { top } = standings([player('Caio', 16), player('Ana', 34), player('Duda', 14), player('Beto', 25)]);

    expect(top.map(({ nickname, place, score }) => [nickname, place, score])).toEqual([
      ['Ana', 1, 34],
      ['Beto', 2, 25],
      ['Caio', 3, 16],
    ]);
  });

  test('lists the others from the fourth player', () => {
    const three = standings([player('Ana', 3), player('Beto', 2), player('Caio', 1)]);
    expect(three.top).toHaveLength(3);
    expect(three.rest).toEqual([]);

    const four = standings([player('Ana', 4), player('Beto', 3), player('Caio', 2), player('Duda', 1)]);
    expect(four.top).toHaveLength(3);
    expect(four.rest.map(({ nickname, place }) => [nickname, place])).toEqual([['Duda', 4]]);
  });

  test('shares places on a tie and keeps late players last', () => {
    const { top, rest } = standings([
      player('Late', 50, { spectator: true }),
      player('Ana', 10),
      player('Beto', 10),
      player('Caio', 5),
      player('Duda', 5),
    ]);

    expect(top.map(({ nickname, place }) => [nickname, place])).toEqual([
      ['Ana', 1],
      ['Beto', 1],
      ['Caio', 3],
    ]);
    expect(rest.map(({ nickname, place, score }) => [nickname, place, score])).toEqual([
      ['Duda', 3, 5],
      ['Late', 5, 50],
    ]);
  });

  test('shows a single player alone on top', () => {
    const { top, rest } = standings([player('Ana', 7)]);

    expect(top.map(({ nickname }) => nickname)).toEqual(['Ana']);
    expect(rest).toEqual([]);
  });

  test('marks who is disconnected', () => {
    const { top } = standings([player('Ana', 2), player('Caio', 1, { connected: false })]);

    expect(top.map(({ disconnected }) => disconnected)).toEqual([false, true]);
  });

  test('crowns every leader and nobody while the score is zero', () => {
    const tied = standings([player('Ana', 5), player('Beto', 5), player('Caio', 1)]);
    expect(tied.top.map(({ crowned }) => crowned)).toEqual([true, true, false]);

    const none = standings([player('Ana', 0), player('Beto', 0)]);
    expect(none.top.map(({ crowned }) => crowned)).toEqual([false, false]);
  });
});
