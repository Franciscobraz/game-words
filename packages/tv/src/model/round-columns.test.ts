import type { PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { roundColumns } from './round-columns.ts';

function player(id: string, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id, nickname: `Jogador ${id}`, color: '#ff7a00', connected: true, spectator: false, score: 0, wins: 0, ...overrides };
}

/** A room with `count` players, ids p1, p2... */
function roomOf(count: number): PlayerInfo[] {
  return Array.from({ length: count }, (_, index) => player(`p${index + 1}`));
}

const ids = (rows: readonly { id: string }[]) => rows.map((row) => row.id);

describe('roundColumns', () => {
  test('says word in the singular for one', () => {
    const { left } = roundColumns(roomOf(3), { p1: 1, p2: 2 }, 'p1');

    expect(left.map((row) => [row.count, row.wordsLabel])).toEqual([
      [1, 'palavra'],
      [2, 'palavras'],
      [0, 'palavras'],
    ]);
  });

  test('leaves the spectators out', () => {
    const duda = player('p4', { spectator: true });

    const { left, right } = roundColumns([player('p1'), duda, player('p2')], {}, 'p1');

    expect(ids(left)).toEqual(['p1', 'p2']);
    expect(right).toEqual([]);
  });

  test('moves the sixth player to the right column', () => {
    const five = roundColumns(roomOf(5), {}, 'p1');
    const six = roundColumns(roomOf(6), {}, 'p1');
    const ten = roundColumns(roomOf(10), {}, 'p1');

    expect(ids(five.left)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    expect(five.right).toEqual([]);
    expect(ids(six.left)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
    expect(ids(six.right)).toEqual(['p6']);
    expect(ids(ten.right)).toEqual(['p6', 'p7', 'p8', 'p9', 'p10']);
  });

  test('a spectator does not take a place in the columns', () => {
    const room = [player('p0', { spectator: true }), ...roomOf(5)];

    const { left, right } = roundColumns(room, {}, 'p1');

    expect(left).toHaveLength(5);
    expect(right).toEqual([]);
  });

  test('marks a disconnected player', () => {
    const caio = player('p3', { connected: false });

    const { left } = roundColumns([player('p1'), caio], {}, 'p1');

    expect(left.map((row) => row.disconnected)).toEqual([false, true]);
  });

  test('tags the host and crowns the leaders', () => {
    const { left } = roundColumns([player('p1', { wins: 1 }), player('p2', { wins: 1 }), player('p3')], {}, 'p2');

    expect(left.map((row) => row.isHost)).toEqual([false, true, false]);
    expect(left.map((row) => row.crowned)).toEqual([true, true, false]);
  });
});
