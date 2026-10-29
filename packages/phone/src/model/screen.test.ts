import type { PlayerInfo, RoundResultsMessage, Settings } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { INITIAL_VIEW, type RoomView } from './room-view.ts';
import { screenFor } from './screen.ts';

const SETTINGS: Settings = {
  size: 4,
  seconds: 120,
  rounds: 3,
  minLength: 3,
  filterProfanity: true,
  fastMode: false,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

const ANA: PlayerInfo = { id: 'p-ana', nickname: 'Ana', color: '#FF7A00', connected: true, spectator: false, score: 0, wins: 0 };
const BETO: PlayerInfo = { id: 'p-beto', nickname: 'Beto', color: '#00B869', connected: true, spectator: false, score: 0, wins: 0 };
const DUDA: PlayerInfo = { id: 'p-duda', nickname: 'Duda', color: '#3D8BFF', connected: true, spectator: true, score: 0, wins: 0 };

const STARTS_AT = 50_000;
const ROUND = { id: 1, index: 0, board: [['c', 'a'], ['s', 'a']], startsAt: STARTS_AT, endsAt: STARTS_AT + 120_000 };
const RESULTS: RoundResultsMessage = { type: 'round-results', index: 0, shared: [], players: [], longest: null, last: false };

/** Beto's view of room KBXT, where Ana hosts and Duda watches. */
function view(extra: Partial<RoomView> = {}): RoomView {
  return {
    ...INITIAL_VIEW,
    code: 'KBXT',
    phase: 'lobby',
    settings: SETTINGS,
    players: [ANA, BETO, DUDA],
    hostId: ANA.id,
    myId: BETO.id,
    ...extra,
  };
}

const BEFORE_START = STARTS_AT - 1;

describe('screenFor', () => {
  test('code-entry without a room code', () => {
    expect(screenFor(INITIAL_VIEW, 0)).toBe('code-entry');
  });

  test('code-entry when the room does not exist', () => {
    expect(screenFor({ ...INITIAL_VIEW, code: 'ZZZZ', joinError: 'room-not-found' }, 0)).toBe('code-entry');
  });

  test('connecting between opening the room and its welcome', () => {
    expect(screenFor({ ...INITIAL_VIEW, code: 'KBXT' }, 0)).toBe('connecting');
  });

  test('join for a phone that is not in the room yet', () => {
    expect(screenFor(view({ myId: null }), 0)).toBe('join');
  });

  test('join for a newcomer during a round', () => {
    expect(screenFor(view({ myId: null, phase: 'round', round: ROUND }), STARTS_AT)).toBe('join');
  });

  test('lobby for a player who is not the host', () => {
    expect(screenFor(view(), 0)).toBe('lobby');
  });

  test('host-lobby for the host', () => {
    expect(screenFor(view({ hostId: BETO.id }), 0)).toBe('host-lobby');
  });

  test('keeps the countdown screen until startsAt on the server clock', () => {
    const round = view({ phase: 'round', round: ROUND });

    expect(screenFor(round, BEFORE_START)).toBe('countdown');
    expect(screenFor(round, STARTS_AT)).toBe('board');
  });

  test('board for an active player once the round opens', () => {
    expect(screenFor(view({ phase: 'round', round: ROUND }), STARTS_AT + 60_000)).toBe('board');
  });

  test('spectator for a spectator once the round opens', () => {
    expect(screenFor(view({ phase: 'round', round: ROUND, myId: DUDA.id }), STARTS_AT)).toBe('spectator');
  });

  test('countdown for a spectator too, so no letter shows before startsAt', () => {
    expect(screenFor(view({ phase: 'round', round: ROUND, myId: DUDA.id }), BEFORE_START)).toBe('countdown');
  });

  test('round-result in the results', () => {
    expect(screenFor(view({ phase: 'results', round: ROUND, results: RESULTS }), 0)).toBe('round-result');
  });

  test('podium in the podium', () => {
    expect(screenFor(view({ phase: 'podium', podium: [] }), 0)).toBe('podium');
  });

  test('kicked when removed from the room', () => {
    expect(screenFor(view({ closeReason: 'kicked' }), 0)).toBe('kicked');
  });

  test.each(['closed-by-host', 'idle', 'tv-gone'] as const)('room-closed when closed with %s', (reason) => {
    expect(screenFor(view({ closeReason: reason, phase: 'round', round: ROUND }), STARTS_AT)).toBe('room-closed');
  });

  test('replaced when the game opened in another tab', () => {
    expect(screenFor(view({ closeReason: 'replaced' }), 0)).toBe('replaced');
  });
});
