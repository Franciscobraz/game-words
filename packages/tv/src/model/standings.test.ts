import type { PlayerInfo, PlayerResult, RoundResultsMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { standings as rank } from './standings.ts';

function player(nickname: string, score: number, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id: nickname.toLowerCase(), nickname, color: '#FF7A00', connected: true, spectator: false, score, words: 0, wins: 0, ...overrides };
}

function result(nickname: string, roundPoints: number, roundWords: number): PlayerResult {
  return { playerId: nickname.toLowerCase(), unique: [], roundPoints, roundWords, score: 0, words: 0 };
}

type Results = Pick<RoundResultsMessage, 'players' | 'last'>;

/** The last round's results, where every player who is not a spectator played: the match sums decide. */
function afterTheLastRound(players: readonly PlayerInfo[]): Results {
  return { last: true, players: players.filter((p) => !p.spectator).map((p) => result(p.nickname, 0, 0)) };
}

/** The standings after the last round, for the rules that do not depend on the kind of result. */
function standings(players: readonly PlayerInfo[]): ReturnType<typeof rank> {
  return rank(players, afterTheLastRound(players));
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

  test('shows the round words and points between rounds', () => {
    const players = [player('Ana', 40, { words: 20 }), player('Beto', 30, { words: 15 })];
    const results: Results = { last: false, players: [result('Ana', 34, 14), result('Beto', 25, 11)] };

    const { top } = rank(players, results);

    expect(top.map(({ nickname, words, score }) => [nickname, words, score])).toEqual([
      ['Ana', 14, 34],
      ['Beto', 11, 25],
    ]);
  });

  test('shows the match sums after the last round', () => {
    const players = [player('Ana', 40, { words: 20 }), player('Beto', 30, { words: 15 })];
    const results: Results = { last: true, players: [result('Ana', 1, 1), result('Beto', 2, 2)] };

    const { top } = rank(players, results);

    expect(top.map(({ nickname, words, score }) => [nickname, words, score])).toEqual([
      ['Ana', 20, 40],
      ['Beto', 15, 30],
    ]);
  });

  test('orders and places by the round points between rounds', () => {
    // Joined in this order; the match leader (Ana) scored least in this round, and Beto and Caio tie on the round.
    const players = [player('Ana', 50), player('Beto', 12), player('Caio', 20), player('Duda', 30)];
    const results: Results = {
      last: false,
      players: [result('Ana', 2, 1), result('Beto', 9, 4), result('Caio', 9, 3), result('Duda', 5, 2)],
    };

    const { top, rest } = rank(players, results);

    expect([...top, ...rest].map(({ nickname, place, score }) => [nickname, place, score])).toEqual([
      ['Beto', 1, 9],
      ['Caio', 1, 9],
      ['Duda', 3, 5],
      ['Ana', 4, 2],
    ]);
    expect([...top, ...rest].map(({ crowned }) => crowned)).toEqual([true, true, false, false]);
  });

  test('orders and places by the match after the last round', () => {
    // Beto won the last round, but Ana leads the match.
    const players = [player('Ana', 50, { words: 20 }), player('Beto', 30, { words: 12 }), player('Caio', 30, { words: 9 })];
    const results: Results = { last: true, players: [result('Ana', 1, 1), result('Beto', 20, 8), result('Caio', 3, 2)] };

    const { top } = rank(players, results);

    expect(top.map(({ nickname, place, score }) => [nickname, place, score])).toEqual([
      ['Ana', 1, 50],
      ['Beto', 2, 30],
      ['Caio', 2, 30],
    ]);
  });

  test('puts a late joiner last with 0 in the round and their sum after the last round', () => {
    // Lia joined during this round: she played an earlier round of the match but not this one.
    const players = [player('Lia', 40, { words: 18, spectator: true }), player('Ana', 10, { words: 5 }), player('Beto', 8, { words: 4 })];
    const round = [result('Ana', 3, 2), result('Beto', 6, 3)];

    const between = rank(players, { last: false, players: round });
    const after = rank(players, { last: true, players: round });

    expect(between.top.map(({ nickname, place, words, score }) => [nickname, place, words, score])).toEqual([
      ['Beto', 1, 3, 6],
      ['Ana', 2, 2, 3],
      ['Lia', 3, 0, 0],
    ]);
    expect(after.top.map(({ nickname, place, words, score }) => [nickname, place, words, score])).toEqual([
      ['Ana', 1, 5, 10],
      ['Beto', 2, 4, 8],
      ['Lia', 3, 18, 40],
    ]);
  });
});
