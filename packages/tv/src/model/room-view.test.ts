import type { PlayerInfo, RoundInfo, RoundResultsMessage, ServerMessage, Settings } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { applyServerMessage, INITIAL_VIEW, type RoomView } from './room-view.ts';

const SETTINGS: Settings = {
  size: 4,
  seconds: 120,
  rounds: 3,
  minLength: 3,
  filterProfanity: true,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

const ANA: PlayerInfo = { id: 'p-ana', nickname: 'Ana', color: '#ff7a00', connected: true, spectator: false, score: 12, wins: 1 };
const BETO: PlayerInfo = { id: 'p-beto', nickname: 'Beto', color: '#00c1fd', connected: false, spectator: false, score: 5, wins: 0 };

const ROUND: RoundInfo = {
  id: 7,
  index: 1,
  board: [
    ['A', 'B'],
    ['C', 'D'],
  ],
  startsAt: 10_000,
  endsAt: 130_000,
};

const RESULTS: RoundResultsMessage = {
  type: 'round-results',
  index: 1,
  shared: [{ word: 'casa', points: 2, foundBy: ['p-ana', 'p-beto'] }],
  players: [],
  longest: null,
  possibleWords: 369,
  last: false,
};

/** A room in the middle of a round: what a message finds when it arrives. */
const MID_ROUND: RoomView = {
  ...INITIAL_VIEW,
  code: 'KBXT',
  phase: 'round',
  settings: SETTINGS,
  players: [ANA, BETO],
  hostId: ANA.id,
  round: ROUND,
  counts: { [ANA.id]: 3 },
};

describe('applyServerMessage', () => {
  test('welcome rebuilds the view from the server state', () => {
    const stale: RoomView = { ...MID_ROUND, results: RESULTS, podium: [], closeReason: 'idle' };

    const view = applyServerMessage(stale, {
      type: 'welcome',
      role: 'tv',
      code: 'WXYZ',
      phase: 'round',
      settings: { ...SETTINGS, rounds: 1 },
      players: [BETO],
      hostId: BETO.id,
      round: ROUND,
    });

    expect(view).toEqual({
      code: 'WXYZ',
      phase: 'round',
      settings: { ...SETTINGS, rounds: 1 },
      players: [BETO],
      hostId: BETO.id,
      round: ROUND,
      counts: {},
      results: null,
      podium: null,
      closeReason: null,
    });
  });

  test('players replaces the list and the host', () => {
    const view = applyServerMessage(MID_ROUND, { type: 'players', players: [BETO], hostId: BETO.id });

    expect(view).toEqual({ ...MID_ROUND, players: [BETO], hostId: BETO.id });
  });

  test('settings replaces the settings', () => {
    const changed: Settings = { ...SETTINGS, size: 6, muted: true };

    const view = applyServerMessage(MID_ROUND, { type: 'settings', settings: changed });

    expect(view).toEqual({ ...MID_ROUND, settings: changed });
  });

  test('round-start opens the round without the counts and results of the one before', () => {
    const before: RoomView = { ...MID_ROUND, phase: 'results', results: RESULTS, podium: [{ playerId: ANA.id, score: 12 }] };
    const next: RoundInfo = { ...ROUND, id: 8, index: 2 };

    const view = applyServerMessage(before, { type: 'round-start', ...next });

    expect(view).toEqual({ ...MID_ROUND, phase: 'round', round: next, counts: {}, results: null, podium: null });
  });

  test('counts replaces the number of words of each player', () => {
    const view = applyServerMessage(MID_ROUND, {
      type: 'counts',
      counts: [
        { playerId: ANA.id, count: 4 },
        { playerId: BETO.id, count: 1 },
      ],
    });

    expect(view.counts).toEqual({ [ANA.id]: 4, [BETO.id]: 1 });
  });

  test('round-results moves to the results and keeps the message', () => {
    const view = applyServerMessage(MID_ROUND, RESULTS);

    expect(view).toEqual({ ...MID_ROUND, phase: 'results', results: RESULTS });
  });

  test('podium moves to the podium and keeps the results of the last round', () => {
    const lastResults: RoomView = { ...MID_ROUND, phase: 'results', results: { ...RESULTS, last: true } };
    const ranking = [
      { playerId: ANA.id, score: 12 },
      { playerId: BETO.id, score: 5 },
    ];

    const view = applyServerMessage(lastResults, { type: 'podium', ranking });

    expect(view).toEqual({ ...lastResults, phase: 'podium', podium: ranking });
  });

  test('closed keeps the reason and the current screen state', () => {
    const view = applyServerMessage(MID_ROUND, { type: 'closed', reason: 'replaced' });

    expect(view).toEqual({ ...MID_ROUND, closeReason: 'replaced' });
  });

  test.each<[string, ServerMessage]>([
    ['joined', { type: 'joined', playerId: 'p-ana', token: 'secret' }],
    ['submit-result', { type: 'submit-result', results: [{ ok: true, word: 'casa' }] }],
    ['time', { type: 'time', clientTime: 1, serverTime: 2 }],
    ['error', { type: 'error', code: 'wrong-phase' }],
  ])('%s leaves the view as it is', (_, msg) => {
    expect(applyServerMessage(MID_ROUND, msg)).toBe(MID_ROUND);
  });
});
