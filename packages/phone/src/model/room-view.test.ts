import type { PlayerInfo, RoundResultsMessage, ServerMessage, Settings, WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { applyHashFrame, applyServerMessage, INITIAL_VIEW, type RoomView } from './room-view.ts';

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

const ANA: PlayerInfo = { id: 'p-ana', nickname: 'Ana', color: '#FF7A00', connected: true, spectator: false, score: 0, wins: 1 };
const BETO: PlayerInfo = { id: 'p-beto', nickname: 'Beto', color: '#00B869', connected: true, spectator: false, score: 0, wins: 0 };

const ROUND = { id: 7, index: 0, board: [['c', 'a'], ['s', 'a']], startsAt: 10_000, endsAt: 130_000 };

/** "AQID" is base64url of the bytes 1, 2, 3. */
const SALT_TEXT = 'AQID';

function welcome(extra: Partial<Extract<WelcomeMessage, { role: 'player' }>> = {}): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'player',
    code: 'KBXT',
    phase: 'lobby',
    settings: SETTINGS,
    players: [ANA, BETO],
    hostId: ANA.id,
    round: null,
    playerId: BETO.id,
    found: [],
    salt: null,
    ...extra,
  };
}

/** Beto's view in the lobby of room KBXT. */
const lobby = (): RoomView => applyServerMessage(INITIAL_VIEW, welcome());

/** Beto's view during round 7, with the hash frame not yet in. */
const inRound = (): RoomView => applyServerMessage(lobby(), { type: 'round-start', ...ROUND, salt: SALT_TEXT });

const RESULTS: RoundResultsMessage = { type: 'round-results', index: 0, shared: [], players: [], longest: null, possibleWords: 0, last: false };

describe('applyServerMessage', () => {
  test('welcome builds the view of the room for this phone', () => {
    const view = lobby();

    expect(view).toMatchObject({ code: 'KBXT', phase: 'lobby', settings: SETTINGS, hostId: ANA.id, myId: BETO.id, round: null });
    expect(view.players).toEqual([ANA, BETO]);
  });

  test('welcome rebuilds the view from scratch and recovers found', () => {
    const before: RoomView = { ...inRound(), joinError: 'nickname-taken', closeReason: 'idle', podium: [] };

    const view = applyServerMessage(before, welcome({ phase: 'round', round: ROUND, found: ['casa', 'asa'], salt: SALT_TEXT }));

    expect(view.found).toEqual([
      { word: 'asa', points: 1, confirmed: true },
      { word: 'casa', points: 2, confirmed: true },
    ]);
    expect(view.salt).toEqual(new Uint8Array([1, 2, 3]));
    expect(view).toMatchObject({ joinError: null, closeReason: null, podium: null, results: null, round: ROUND });
    expect(view.hashes.size).toBe(0);
  });

  test('joined records the player id and clears the join error', () => {
    const before: RoomView = { ...lobby(), myId: null, joinError: 'nickname-taken' };

    const view = applyServerMessage(before, { type: 'joined', playerId: BETO.id, token: 'secret' });

    expect(view.myId).toBe(BETO.id);
    expect(view.joinError).toBeNull();
  });

  test('players replaces the list and the host', () => {
    const away = { ...ANA, connected: false };

    const view = applyServerMessage(lobby(), { type: 'players', players: [away, BETO], hostId: BETO.id });

    expect(view.players).toEqual([away, BETO]);
    expect(view.hostId).toBe(BETO.id);
  });

  test('settings replaces the settings', () => {
    const view = applyServerMessage(lobby(), { type: 'settings', settings: { ...SETTINGS, size: 5 } });

    expect(view.settings?.size).toBe(5);
  });

  test('keeps the last settings from the server', () => {
    const updates: ServerMessage[] = [
      { type: 'settings', settings: { ...SETTINGS, seconds: 150 } },
      { type: 'settings', settings: { ...SETTINGS, seconds: 180 } },
      { type: 'settings', settings: { ...SETTINGS, seconds: 90, rounds: 5 } },
    ];

    const view = updates.reduce(applyServerMessage, lobby());

    expect(view.settings).toEqual({ ...SETTINGS, seconds: 90, rounds: 5 });
  });

  test('round-start opens the round with its board and salt and no words', () => {
    const before: RoomView = { ...lobby(), found: [{ word: 'velha', points: 3, confirmed: true }], results: RESULTS };

    const view = applyServerMessage(before, { type: 'round-start', ...ROUND, salt: SALT_TEXT });

    expect(view).toMatchObject({ phase: 'round', round: ROUND, found: [], results: null, podium: null });
    expect(view.salt).toEqual(new Uint8Array([1, 2, 3]));
    expect(view.hashes.size).toBe(0);
  });

  test('submit-result confirms the accepted words and keeps the rest', () => {
    const before: RoomView = {
      ...inRound(),
      found: [
        { word: 'casa', points: 2, confirmed: false },
        { word: 'asa', points: 1, confirmed: false },
      ],
    };

    const view = applyServerMessage(before, {
      type: 'submit-result',
      results: [{ ok: true, word: 'casa' }, { ok: false, reason: 'not-a-word' }],
    });

    expect(view.found).toEqual([
      { word: 'casa', points: 2, confirmed: true },
      { word: 'asa', points: 1, confirmed: false },
    ]);
  });

  test('counts, meant for the TV, leaves the view as it is', () => {
    const before = inRound();

    expect(applyServerMessage(before, { type: 'counts', counts: [{ playerId: ANA.id, count: 3 }] })).toBe(before);
  });

  test('round-results moves to the results with the message', () => {
    const view = applyServerMessage(inRound(), RESULTS);

    expect(view.phase).toBe('results');
    expect(view.results).toBe(RESULTS);
  });

  test('podium moves to the podium with the ranking', () => {
    const ranking = [{ playerId: ANA.id, score: 12 }, { playerId: BETO.id, score: 7 }];

    const view = applyServerMessage(lobby(), { type: 'podium', ranking });

    expect(view.phase).toBe('podium');
    expect(view.podium).toEqual(ranking);
  });

  test('time leaves the view as it is', () => {
    const before = lobby();

    expect(applyServerMessage(before, { type: 'time', clientTime: 1, serverTime: 2 })).toBe(before);
  });

  test('error with a join code records it for the join screen', () => {
    const view = applyServerMessage(lobby(), { type: 'error', code: 'nickname-taken' });

    expect(view.joinError).toBe('nickname-taken');
  });

  test('ignores wrong-phase and not-host errors', () => {
    const before = inRound();

    expect(applyServerMessage(before, { type: 'error', code: 'wrong-phase' })).toBe(before);
    expect(applyServerMessage(before, { type: 'error', code: 'not-host' })).toBe(before);
  });

  test('closed records the close reason', () => {
    const view = applyServerMessage(lobby(), { type: 'closed', reason: 'kicked' });

    expect(view.closeReason).toBe('kicked');
  });
});

describe('applyHashFrame', () => {
  test('keeps the prefixes of the current round as hex', () => {
    const prefixes = new Uint8Array([0, 1, 2, 3, 4, 255, 16, 32, 48, 64, 80, 96]);

    const view = applyHashFrame(inRound(), { roundId: ROUND.id, prefixes });

    expect([...view.hashes]).toEqual(['0001020304ff', '102030405060']);
  });

  test('drops a frame of another round', () => {
    const before = inRound();

    const view = applyHashFrame(before, { roundId: ROUND.id + 1, prefixes: new Uint8Array(6) });

    expect(view).toBe(before);
  });
});
