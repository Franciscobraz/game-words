import type { PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { lobbyRows, myPlacement, podiumRows, podiumTags, quickScoreboard, rankingLines } from './players.ts';

/** A connected player who is playing, with no points and no wins unless given. */
function player(id: string, nickname: string, fields: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id, nickname, color: '#E53935', connected: true, spectator: false, score: 0, wins: 0, ...fields };
}

describe('lobbyRows', () => {
  test('crowns the players with the most wins and nobody at zero', () => {
    const ana = player('p1', 'Ana', { wins: 2 });
    const beto = player('p2', 'Beto', { wins: 1 });
    const caio = player('p3', 'Caio', { wins: 2 });

    const tied = lobbyRows([ana, beto, caio], 'p1', 'p2');
    const nobody = lobbyRows([player('p1', 'Ana'), player('p2', 'Beto')], 'p1', 'p2');

    expect(tied.map((row) => [row.nickname, row.crowned])).toEqual([
      ['Ana', true],
      ['Beto', false],
      ['Caio', true],
    ]);
    expect(nobody.map((row) => row.crowned)).toEqual([false, false]);
  });

  test('tags the host and the player themselves', () => {
    const players = [player('p1', 'Ana'), player('p2', 'Beto'), player('p3', 'Caio')];

    const asBeto = lobbyRows(players, 'p1', 'p2');
    const asHost = lobbyRows(players, 'p1', 'p1');

    expect(asBeto.map((row) => row.tags)).toEqual([['host'], ['you'], []]);
    expect(asHost[0]!.tags).toEqual(['host', 'you']);
  });

  test('dims disconnected players', () => {
    const players = [player('p1', 'Ana'), player('p3', 'Caio', { connected: false })];

    const rows = lobbyRows(players, 'p1', null);

    expect(rows[1]).toMatchObject({ nickname: 'Caio', dimmed: true, tags: ['disconnected'] });
    expect(rows[0]!.dimmed).toBe(false);
  });

  test('tags spectators', () => {
    const duda = player('p4', 'Duda', { spectator: true });
    const players = [player('p1', 'Ana'), duda, player('p2', 'Beto')];

    const rows = lobbyRows(players, 'p1', null);

    expect(rows.map((row) => row.nickname)).toEqual(['Ana', 'Beto', 'Duda']);
    expect(rows[2]!.tags).toEqual(['spectator']);
  });
});

describe('quickScoreboard', () => {
  test('orders the quick scoreboard and puts spectators last', () => {
    const players = [
      player('p1', 'Ana', { score: 12 }),
      player('p4', 'Duda', { spectator: true }),
      player('p2', 'Beto', { score: 20 }),
      player('p3', 'Caio', { score: 5 }),
      player('p5', 'Edu', { spectator: true }),
    ];

    const rows = quickScoreboard(players);

    // Each spectator takes the next place after the players: Duda 4º, as in phone-round-result.jpg.
    expect(rows.map((row) => [row.nickname, row.score, row.place, row.spectator])).toEqual([
      ['Beto', 20, 1, false],
      ['Ana', 12, 2, false],
      ['Caio', 5, 3, false],
      ['Duda', 0, 4, true],
      ['Edu', 0, 5, true],
    ]);
  });

  test('shares the place of a tie and keeps the joining order', () => {
    const players = [player('p1', 'Ana', { score: 9 }), player('p2', 'Beto', { score: 15 }), player('p3', 'Caio', { score: 9 })];

    const rows = quickScoreboard(players);

    expect(rows.map((row) => [row.nickname, row.place])).toEqual([
      ['Beto', 1],
      ['Ana', 2],
      ['Caio', 2],
    ]);
  });
});

describe('podiumRows', () => {
  test('orders the podium and puts spectators last with zero', () => {
    const players = [
      player('p1', 'Ana', { score: 30, wins: 3 }),
      player('p2', 'Beto', { score: 41, wins: 1 }),
      player('p4', 'Duda', { spectator: true, score: 7 }),
      player('p3', 'Caio', { score: 30 }),
    ];
    const ranking = [
      { playerId: 'p2', score: 41 },
      { playerId: 'p4', score: 7 },
      { playerId: 'p1', score: 30 },
      { playerId: 'p3', score: 30 },
    ];

    const rows = podiumRows(ranking, players);

    // Duda, the spectator, takes the place after the three players, as the "4" of phone-podium.jpg.
    expect(rows.map((row) => [row.nickname, row.place, row.score, row.wins, row.spectator])).toEqual([
      ['Beto', 1, 41, 1, false],
      ['Ana', 2, 30, 3, false],
      ['Caio', 2, 30, 0, false],
      ['Duda', 4, 0, 0, true],
    ]);
    expect(rows.find((row) => row.crowned)?.nickname).toBe('Ana');
  });
});

describe('myPlacement', () => {
  const players = [
    player('p1', 'Ana', { wins: 2 }),
    player('p2', 'Beto', { wins: 1 }),
    player('p3', 'Caio'),
    player('p4', 'Duda', { spectator: true }),
  ];
  const ranking = [
    { playerId: 'p1', score: 52 },
    { playerId: 'p2', score: 52 },
    { playerId: 'p3', score: 18 },
    { playerId: 'p4', score: 0 },
  ];

  test("finds the player's place, total and session wins", () => {
    const rows = podiumRows(ranking, players);

    expect(myPlacement(rows, 'p2')).toEqual({ place: 1, total: 52, wins: 1 });
    expect(myPlacement(rows, 'p1')).toEqual({ place: 1, total: 52, wins: 2 });
    expect(myPlacement(rows, 'p3')).toEqual({ place: 3, total: 18, wins: 0 });
  });

  test('has no placement for a spectator or a phone not in the ranking', () => {
    const rows = podiumRows(ranking, players);

    expect(myPlacement(rows, 'p4')).toBeNull();
    expect(myPlacement(rows, null)).toBeNull();
  });
});

describe('podiumTags', () => {
  test('tags the host, the player and the disconnected, never the spectator', () => {
    // POD-01 AC 7, phone-podium.jpg: Ana reads "VOCÊ" and "ANFITRIÃO(Ã)", Caio is disconnected, Duda only "Espectador(a)".
    const players = [
      player('p1', 'Ana'),
      player('p3', 'Caio', { connected: false }),
      player('p4', 'Duda', { spectator: true }),
    ];

    expect(podiumTags(players, 'p1', 'p1', 'p1')).toEqual(['host', 'you']);
    expect(podiumTags(players, 'p3', 'p1', 'p1')).toEqual(['disconnected']);
    expect(podiumTags(players, 'p4', 'p1', 'p1')).toEqual([]);
    expect(podiumTags(players, 'gone', 'p1', 'p1')).toEqual([]);
  });
});

describe('rankingLines', () => {
  test('marks a disconnected player beside the name instead of a pill', () => {
    // phone-podium.jpg: Caio reads "(desconectado)" in italics; Ana keeps her pills; Duda has none.
    const players = [
      player('p1', 'Ana', { score: 46 }),
      player('p3', 'Caio', { score: 18, connected: false }),
      player('p4', 'Duda', { spectator: true }),
    ];
    const rows = podiumRows(
      [
        { playerId: 'p1', score: 46 },
        { playerId: 'p3', score: 18 },
        { playerId: 'p4', score: 0 },
      ],
      players,
    );

    const lines = rankingLines(rows, players, 'p1', 'p1');

    expect(lines.map((line) => [line.row.nickname, line.tags, line.disconnected])).toEqual([
      ['Ana', ['host', 'you'], false],
      ['Caio', [], true],
      ['Duda', [], false],
    ]);
  });
});
