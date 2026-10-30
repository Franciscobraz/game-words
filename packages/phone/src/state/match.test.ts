import type { PlayerInfo, PlayerResult, RoundResultsMessage, RoundStartMessage, Settings, WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { fakeConnection, fakeStorage } from '../testing/fakes.ts';
import { createMatchStore } from './match.ts';
import { createRoomStore } from './room.ts';

const SETTINGS: Settings = {
  size: 4,
  seconds: 60,
  rounds: 3,
  minLength: 3,
  filterProfanity: true,
  fastMode: false,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

const BOARD = [
  ['c', 'a', 's', 'a'],
  ['qu', 'e', 'r', 'o'],
  ['l', 'u', 'a', 'm'],
  ['m', 'e', 's', 'a'],
];

function player(id: string, nickname: string): PlayerInfo {
  return { id, nickname, color: '#ff5e5e', connected: true, spectator: false, score: 0, wins: 0 };
}

/** Beto's phone back in round `index` of KBXT, with the words the server already accepted. */
function roundWelcome(index: number, found: string[]): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'player',
    code: 'KBXT',
    phase: 'round',
    settings: SETTINGS,
    players: [player('ana', 'Ana'), player('beto', 'Beto')],
    hostId: 'ana',
    round: { id: 10 + index, index, board: BOARD, startsAt: 0, endsAt: 60_000 },
    playerId: 'beto',
    found,
    salt: null,
  };
}

function roundStart(index: number): RoundStartMessage {
  return { type: 'round-start', id: 10 + index, index, board: BOARD, startsAt: 0, endsAt: 60_000 };
}

/** The end of round `index`: Beto found `unique` alone and shares `shared` with Ana. */
function roundResults(index: number, unique: string[], shared: string[]): RoundResultsMessage {
  const words = (list: string[], factor: number) => list.map((word) => ({ word, points: (word.length - 2) * factor }));
  const beto: PlayerResult = { playerId: 'beto', unique: words(unique, 2), roundPoints: 0, score: 0 };
  const ana: PlayerResult = { playerId: 'ana', unique: [], roundPoints: 0, score: 0 };
  return { type: 'round-results', index, shared: words(shared, 1).map((word) => ({ ...word, foundBy: ['ana', 'beto'] })), players: [ana, beto], longest: null, possibleWords: 0, last: index === 2 };
}

/** The phone's room and match stores over a fake server. */
function setup() {
  const connection = fakeConnection();
  const room = createRoomStore({ openConnection: connection.openConnection, storage: fakeStorage() });
  const match = createMatchStore(room);
  room.openRoom('KBXT');
  return { connection, match };
}

/** Plays round `index` on the phone: Beto's words are accepted, then the round ends. */
function playRound(connection: ReturnType<typeof fakeConnection>, index: number, unique: string[], shared: string[]): void {
  connection.receive(roundStart(index));
  connection.receive({ type: 'submit-result', results: [...unique, ...shared].map((word) => ({ ok: true, word })) });
  connection.receive(roundResults(index, unique, shared));
}

describe('match history', () => {
  test('adds the words of each round of the match', () => {
    // POD-01 AC 4-5: two rounds with 3 and 2 of Beto's words make 5; CORACOES is the longest.
    const { connection, match } = setup();
    connection.receive(roundWelcome(0, []));

    playRound(connection, 0, ['casa'], ['lua', 'mesa']);
    playRound(connection, 1, ['coracoes'], ['quero']);

    expect(match.summary.value.wordCount).toBe(5);
    expect(match.summary.value.longest).toMatchObject({ word: 'coracoes', letters: 8 });
  });

  test('counts only the rounds seen after a reload', () => {
    // POD-01 AC 6: the phone reloads in round 2 of 3; round 1 is gone, so only rounds 2 and 3 count.
    const { connection, match } = setup();

    connection.receive(roundWelcome(1, ['casa']));
    connection.receive(roundResults(1, ['casa'], []));
    playRound(connection, 2, [], ['lua', 'mesa']);

    expect(match.history.value.map((record) => record.index)).toEqual([1, 2]);
    expect(match.summary.value.wordCount).toBe(3);
  });

  test('starts over when round 0 of a new match counts down', () => {
    // A new match ("JOGAR DE NOVO" or a start after the lobby) begins at round 0 with an empty summary.
    const { connection, match } = setup();
    connection.receive(roundWelcome(0, []));
    playRound(connection, 0, ['casa'], ['lua']);

    connection.receive(roundStart(0));

    expect(match.history.value).toEqual([]);
    expect(match.summary.value).toEqual({ wordCount: 0, longest: null });
  });

  test('keeps the history when a later round counts down', () => {
    const { connection, match } = setup();
    connection.receive(roundWelcome(0, []));
    playRound(connection, 0, ['casa'], []);

    connection.receive(roundStart(1));

    expect(match.summary.value.wordCount).toBe(1);
  });
});
