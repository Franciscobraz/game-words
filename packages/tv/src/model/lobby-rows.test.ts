import type { PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { STRINGS } from '../strings/pt-BR.ts';
import { lobbyFooter, type LobbyPlayerSlot, lobbySlots } from './lobby-rows.ts';

function player(id: string, nickname: string, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id, nickname, color: '#ff7a00', connected: true, spectator: false, score: 0, wins: 0, ...overrides };
}

const ana = player('p1', 'Ana', { wins: 2 });
const beto = player('p2', 'Beto', { wins: 1 });

function playerSlots(players: readonly PlayerInfo[], hostId: string | null): LobbyPlayerSlot[] {
  return lobbySlots(players, hostId).slots.filter((slot): slot is LobbyPlayerSlot => slot.kind === 'player');
}

/** A room with `count` players, each with a nickname of its own. */
function roomOf(count: number): PlayerInfo[] {
  return Array.from({ length: count }, (_, index) => player(`p${index + 1}`, `Jogador ${index + 1}`));
}

describe('lobbySlots', () => {
  test('lists the players with the count', () => {
    const lobby = lobbySlots([ana, beto], 'p1');

    expect(lobby.count).toBe('2 / 10');
    expect(playerSlots([ana, beto], 'p1').map((slot) => [slot.nickname, slot.color, slot.wins])).toEqual([
      ['Ana', '#ff7a00', 2],
      ['Beto', '#ff7a00', 1],
    ]);
  });

  test('marks a disconnected player', () => {
    const caio = player('p3', 'Caio', { connected: false });

    const [caioSlot, anaSlot] = playerSlots([caio, ana], 'p1');

    expect(caioSlot?.status).toBe('disconnected');
    expect(anaSlot?.status).toBeNull();
  });

  test('marks a spectator', () => {
    const duda = player('p4', 'Duda', { spectator: true });

    expect(playerSlots([duda], 'p1')[0]?.status).toBe('spectator');
  });

  test('a disconnected spectator reads as disconnected', () => {
    const duda = player('p4', 'Duda', { spectator: true, connected: false });

    expect(playerSlots([duda], 'p1')[0]?.status).toBe('disconnected');
  });

  test('writes the wins, leaving them out only of a line with a status and no wins', () => {
    const noWins = player('p5', 'Eva');
    const caio = player('p3', 'Caio', { connected: false });
    const caioWithWin = player('p6', 'Caio', { connected: false, wins: 1 });

    const texts = playerSlots([ana, beto, noWins, caio, caioWithWin], 'p1').map((slot) => slot.winsText);

    expect(texts).toEqual(['2 vitórias', '1 vitória', '0 vitórias', null, '1 vitória']);
  });

  test('tags the host and crowns the leaders', () => {
    const caio = player('p3', 'Caio', { wins: 2 });

    const slots = playerSlots([ana, beto, caio], 'p1');

    expect(slots.map((slot) => slot.isHost)).toEqual([true, false, false]);
    expect(slots.map((slot) => slot.crowned)).toEqual([true, false, true]);
  });

  test('crowns nobody while nobody has won', () => {
    const slots = playerSlots(roomOf(2), 'p1');

    expect(slots.map((slot) => slot.crowned)).toEqual([false, false]);
  });

  test('fills the free slots up to ten', () => {
    for (let count = 0; count <= 10; count++) {
      const { slots } = lobbySlots(roomOf(count), 'p1');

      const free = slots.flatMap((slot) => (slot.kind === 'free' ? [slot.number] : []));
      expect(slots).toHaveLength(10);
      expect(free).toEqual(Array.from({ length: 10 - count }, (_, index) => count + index + 1));
    }
  });
});

describe('lobbyFooter', () => {
  test('waits for the host by name', () => {
    expect(lobbyFooter([ana, beto], 'p2')).toBe('Aguardando Beto iniciar a partida…');
  });

  test('says the first to join hosts in an empty room', () => {
    expect(lobbyFooter([], null)).toBe(STRINGS.firstJoinerHosts);
  });
});
