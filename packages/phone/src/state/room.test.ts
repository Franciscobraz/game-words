import type { ClientMessage, CloseReason, Settings, WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { fakeConnection, fakeStorage } from '../testing/fakes.ts';
import { createRoomStore, type RoomStore, tokenKey } from './room.ts';

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

/** The server's answer to `hello` in the lobby of KBXT; `playerId` null means a newcomer. */
function welcome(playerId: string | null): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'player',
    code: 'KBXT',
    phase: 'lobby',
    settings: SETTINGS,
    players: [],
    hostId: null,
    round: null,
    playerId,
    found: [],
    salt: null,
  };
}

/** A store over a fake connection and storage, with room KBXT open. */
function setup(saved: Record<string, string> = {}) {
  const connection = fakeConnection(123_456);
  const storage = fakeStorage(saved);
  const store: RoomStore = createRoomStore({ openConnection: connection.openConnection, storage });
  store.openRoom('KBXT');
  return { connection, storage, store };
}

describe('opening a room', () => {
  test('connects without a token when none is saved for the room', () => {
    const { connection, store } = setup({ [tokenKey('ABCD')]: 'other-room' });

    expect(connection.connects).toEqual([{ code: 'KBXT', token: null }]);
    expect(store.room.value.code).toBe('KBXT');
  });

  test('comes back with the token saved for the room', () => {
    const { connection } = setup({ [tokenKey('KBXT')]: 'secret-beto' });

    expect(connection.connects).toEqual([{ code: 'KBXT', token: 'secret-beto' }]);
  });

  test('saves the token of joined for the room', () => {
    const { connection, storage, store } = setup();

    connection.receive({ type: 'joined', playerId: 'p-beto', token: 'secret-beto' });

    expect(storage.get(tokenKey('KBXT'))).toBe('secret-beto');
    expect(store.room.value.myId).toBe('p-beto');
  });

  test('drops the saved token on bad-token and shows the join screen', () => {
    const { connection, storage, store } = setup({ [tokenKey('KBXT')]: 'expired-token' });

    connection.receive({ type: 'error', code: 'bad-token' });
    connection.receive(welcome(null));

    expect(storage.get(tokenKey('KBXT'))).toBeNull();
    expect(connection.connects.at(-1)).toEqual({ code: 'KBXT', token: null });
    expect(store.room.value).toMatchObject({ code: 'KBXT', phase: 'lobby', myId: null });
  });
});

describe('server messages and connection status', () => {
  test('folds server messages into the room signal', () => {
    const { connection, store } = setup();

    connection.receive(welcome('p-beto'));
    connection.receive({ type: 'settings', settings: { ...SETTINGS, size: 6 } });

    expect(store.room.value.myId).toBe('p-beto');
    expect(store.room.value.settings?.size).toBe(6);
  });

  test('takes the hash frame of the current round', () => {
    const { connection, store } = setup();
    connection.receive({ type: 'round-start', id: 3, index: 0, board: [['a']], startsAt: 1, endsAt: 2, salt: 'AQID' });

    connection.handlers().onHashes({ roundId: 3, prefixes: new Uint8Array([1, 2, 3, 4, 5, 6]) });

    expect([...store.room.value.hashes]).toEqual(['010203040506']);
  });

  test('mirrors the connection status', () => {
    const { connection, store } = setup();

    connection.handlers().onStatus('reconnecting');

    expect(store.connection.value).toBe('reconnecting');
  });

  test('reads the server clock from the connection', () => {
    const { store } = setup();

    expect(store.serverNow()).toBe(123_456);
  });

  test.each<CloseReason>(['kicked', 'closed-by-host', 'idle', 'tv-gone'])('drops the saved token when closed with %s', (reason) => {
    const { connection, storage, store } = setup({ [tokenKey('KBXT')]: 'secret-beto' });

    connection.receive({ type: 'closed', reason });

    expect(storage.get(tokenKey('KBXT'))).toBeNull();
    expect(store.room.value.closeReason).toBe(reason);
  });

  test('keeps the saved token when replaced by another tab', () => {
    const { connection, storage } = setup({ [tokenKey('KBXT')]: 'secret-beto' });

    connection.receive({ type: 'closed', reason: 'replaced' });

    expect(storage.get(tokenKey('KBXT'))).toBe('secret-beto');
  });
});

describe('actions', () => {
  test('sends join with the trimmed nickname and the color', () => {
    const { connection, store } = setup();

    store.join('  Beto  ', '#00B869');

    expect(connection.sent).toEqual([{ type: 'join', nickname: 'Beto', color: '#00B869' }]);
  });

  test('sends a too-short nickname trimmed, for the server to refuse', () => {
    const { connection, store } = setup();

    store.join(' B ', '#00B869');

    expect(connection.sent).toEqual([{ type: 'join', nickname: 'B', color: '#00B869' }]);
  });

  const cases: [string, (store: RoomStore) => void, ClientMessage][] = [
    ['changeSettings', (s) => s.changeSettings({ seconds: 150 }), { type: 'settings', patch: { seconds: 150 } }],
    ['start', (s) => s.start(), { type: 'start' }],
    ['next', (s) => s.next(), { type: 'next' }],
    ['transferHost', (s) => s.transferHost('p-caio'), { type: 'transfer-host', playerId: 'p-caio' }],
    ['kick', (s) => s.kick('p-duda'), { type: 'kick', playerId: 'p-duda' }],
    ['playAgain', (s) => s.playAgain(), { type: 'play-again' }],
    ['backToLobby', (s) => s.backToLobby(), { type: 'back-to-lobby' }],
    ['closeRoom', (s) => s.closeRoom(), { type: 'close-room' }],
  ];

  test.each(cases)('%s sends its message', (_name, act, expected) => {
    const { connection, store } = setup();

    act(store);

    expect(connection.sent).toEqual([expected]);
  });

  test('leaving the room closes the connection and forgets the room', () => {
    // EXIT-01 AC 5: after "ENTRAR EM OUTRA SALA" the phone knows no room, so the code screen shows.
    const { connection, store } = setup();
    connection.receive(welcome('p-beto'));
    connection.receive({ type: 'closed', reason: 'kicked' });

    store.leaveRoom();

    expect(connection.closes).toBe(1);
    expect(store.room.value.code).toBeNull();
    expect(store.room.value.closeReason).toBeNull();
  });

  test('retry asks the connection to try again', () => {
    const { connection, store } = setup();

    store.retry();

    expect(connection.retries).toBe(1);
  });
});
