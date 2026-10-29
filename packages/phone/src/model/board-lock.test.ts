import type { PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { isBoardOpen } from './board-lock.ts';
import { INITIAL_VIEW, type RoomView } from './room-view.ts';

const STARTS_AT = 10_000;
const ENDS_AT = 70_000;

function player(id: string, spectator = false): PlayerInfo {
  return { id, nickname: id, color: '#ff5e5e', connected: true, spectator, score: 0, wins: 0 };
}

/** Beto plays an open round of KBXT. */
const OPEN_ROUND: RoomView = {
  ...INITIAL_VIEW,
  code: 'KBXT',
  phase: 'round',
  myId: 'beto',
  players: [player('ana'), player('beto')],
  hostId: 'ana',
  round: { id: 1, index: 0, board: [], startsAt: STARTS_AT, endsAt: ENDS_AT },
};

describe('isBoardOpen', () => {
  test('opens the board from startsAt until endsAt', () => {
    // L-001: closed 1 ms before startsAt, open at it, open 1 ms before endsAt, locked at it (PLAY-01 AC 20).
    expect(isBoardOpen(OPEN_ROUND, 'open', STARTS_AT - 1)).toBe(false);
    expect(isBoardOpen(OPEN_ROUND, 'open', STARTS_AT)).toBe(true);
    expect(isBoardOpen(OPEN_ROUND, 'open', ENDS_AT - 1)).toBe(true);
    expect(isBoardOpen(OPEN_ROUND, 'open', ENDS_AT)).toBe(false);
  });

  test('locks the board while the connection is not open', () => {
    // RECON-01 AC 2.
    expect(isBoardOpen(OPEN_ROUND, 'reconnecting', STARTS_AT)).toBe(false);
    expect(isBoardOpen(OPEN_ROUND, 'offline', STARTS_AT)).toBe(false);
    expect(isBoardOpen(OPEN_ROUND, 'connecting', STARTS_AT)).toBe(false);
    expect(isBoardOpen(OPEN_ROUND, 'closed', STARTS_AT)).toBe(false);
  });

  test('locks the board for a spectator and for a phone that has not joined', () => {
    // SPEC-01 AC 1.
    const spectating: RoomView = { ...OPEN_ROUND, players: [player('ana'), player('beto', true)] };
    expect(isBoardOpen(spectating, 'open', STARTS_AT)).toBe(false);
    expect(isBoardOpen({ ...OPEN_ROUND, myId: null }, 'open', STARTS_AT)).toBe(false);
  });

  test('locks the board outside the round', () => {
    expect(isBoardOpen({ ...OPEN_ROUND, phase: 'results' }, 'open', STARTS_AT)).toBe(false);
    expect(isBoardOpen({ ...OPEN_ROUND, round: null }, 'open', STARTS_AT)).toBe(false);
  });
});
