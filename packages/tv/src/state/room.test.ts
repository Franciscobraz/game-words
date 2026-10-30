import { createRoomConnection, type ErrorCode, type Phase, RECONNECT_DELAYS_MS, type Settings, tvHello, type WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { STRINGS } from '../strings/pt-BR.ts';
import { fakeClock, fakeLocalStorage, fakeSockets, type FakeSocket } from '../testing/fakes.ts';
import { createRoomStore, ROOM_RETRY_MS } from './room.ts';
import { createTokenStore, type SavedRoom } from './token-store.ts';

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

const SAVED_ROOM: SavedRoom = { code: 'KBXT', tvToken: 'saved-tv-token' };
const NEW_ROOM: SavedRoom = { code: 'WXYZ', tvToken: 'new-tv-token' };

/** The server's answer to the TV's `hello`, in room `code` and phase `phase`. */
function welcome(code: string, phase: Phase): WelcomeMessage {
  return { type: 'welcome', role: 'tv', code, phase, settings: SETTINGS, players: [], hostId: null, round: null };
}

/** Lets the store's pending `createRoom` finish. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve));
}

/**
 * A store over the real connection, fake sockets and a fake clock. `rooms` are the answers of
 * `POST /api/rooms`, in order; `null` is a failure.
 */
function setup(saved: SavedRoom | null, rooms: readonly (SavedRoom | null)[] = [NEW_ROOM]) {
  const clock = fakeClock(1_000_000);
  const sockets = fakeSockets();
  const local = fakeLocalStorage();
  const tokens = createTokenStore(() => local);
  if (saved !== null) tokens.save(saved);

  let requests = 0;
  const createRoom = async (): Promise<SavedRoom> => {
    const answer = rooms[requests++];
    if (answer === undefined || answer === null) throw new Error('POST /api/rooms failed');
    return answer;
  };

  const store = createRoomStore({
    openConnection: (handlers) =>
      createRoomConnection({ openSocket: sockets.openSocket, now: clock.now, schedule: clock.schedule, hello: tvHello, ...handlers }),
    createRoom,
    tokens,
    schedule: clock.schedule,
  });
  return { clock, sockets, tokens, store, requests: () => requests };
}

/** The only `hello` a socket sent. */
function helloOf(socket: FakeSocket) {
  const hellos = socket.sent.filter((msg) => msg.type === 'hello');
  expect(hellos).toHaveLength(1);
  return hellos[0];
}

describe('opening the room', () => {
  test('creates a room when there is no token', async () => {
    const { sockets, tokens, store, requests } = setup(null);

    store.open();
    await settle();
    sockets.last().open();
    sockets.last().receive(welcome(NEW_ROOM.code, 'lobby'));

    expect(requests()).toBe(1);
    expect(tokens.load()).toEqual(NEW_ROOM);
    expect(sockets.last().path).toBe('/api/rooms/WXYZ/ws');
    expect(helloOf(sockets.last())).toEqual({ type: 'hello', role: 'tv', token: NEW_ROOM.tvToken });
    expect(store.room.value.code).toBe(NEW_ROOM.code);
    expect(store.room.value.phase).toBe('lobby');
    expect(store.status.value).toBe('open');
  });

  test('resumes the room of a saved token', async () => {
    const { sockets, tokens, store, requests } = setup(SAVED_ROOM);

    store.open();
    await settle();
    sockets.last().open();
    sockets.last().receive(welcome(SAVED_ROOM.code, 'round'));

    expect(requests()).toBe(0);
    expect(tokens.load()).toEqual(SAVED_ROOM);
    expect(sockets.opened).toHaveLength(1);
    expect(sockets.last().path).toBe('/api/rooms/KBXT/ws');
    expect(helloOf(sockets.last())).toEqual({ type: 'hello', role: 'tv', token: SAVED_ROOM.tvToken });
    expect(store.room.value.code).toBe(SAVED_ROOM.code);
    expect(store.room.value.phase).toBe('round');
  });

  test.each<ErrorCode>(['bad-token', 'room-not-found'])('creates a new room when the token is refused: %s', async (code) => {
    const { clock, sockets, tokens, store, requests } = setup(SAVED_ROOM);
    store.open();
    const refused = sockets.last();
    refused.open();

    refused.receive({ type: 'error', code });
    refused.drop();
    expect(tokens.load()).toBeNull();
    expect(store.room.value.code).toBeNull();
    await settle();
    sockets.last().open();
    sockets.last().receive(welcome(NEW_ROOM.code, 'lobby'));

    expect(requests()).toBe(1);
    expect(tokens.load()).toEqual(NEW_ROOM);
    expect(store.room.value.code).toBe(NEW_ROOM.code);
    expect(helloOf(sockets.last())).toEqual({ type: 'hello', role: 'tv', token: NEW_ROOM.tvToken });

    // The refused socket is finished: its room is never asked for again.
    clock.advance(Math.max(...RECONNECT_DELAYS_MS) * 2);
    expect(sockets.opened.map((socket) => socket.path)).toEqual(['/api/rooms/KBXT/ws', '/api/rooms/WXYZ/ws']);
    expect(store.status.value).toBe('open');
  });

  test('sends the token only in the hello', async () => {
    const { clock, sockets, store } = setup(null);

    store.open();
    await settle();
    sockets.last().open();
    sockets.last().drop();
    clock.advance(Math.max(...RECONNECT_DELAYS_MS));
    sockets.last().open();

    expect(sockets.opened).toHaveLength(2);
    for (const socket of sockets.opened) {
      expect(socket.path).not.toContain(NEW_ROOM.tvToken);
      expect(helloOf(socket)).toEqual({ type: 'hello', role: 'tv', token: NEW_ROOM.tvToken });
      const others = socket.sent.filter((msg) => msg.type !== 'hello');
      expect(others.length).toBeGreaterThan(0);
      expect(JSON.stringify(others)).not.toContain(NEW_ROOM.tvToken);
    }
  });

  test('retries every 5 seconds when the room cannot be created', async () => {
    const { clock, sockets, tokens, store, requests } = setup(null, [null, null, NEW_ROOM]);
    expect(ROOM_RETRY_MS).toBe(5_000);

    store.open();
    await settle();
    expect(requests()).toBe(1);
    expect(store.status.value).toBe('create-failed');
    expect(STRINGS.roomOpenFailed).toBe('Não foi possível abrir a sala');

    clock.advance(ROOM_RETRY_MS - 1);
    await settle();
    expect(requests()).toBe(1);

    clock.advance(1);
    await settle();
    expect(requests()).toBe(2);
    expect(store.status.value).toBe('create-failed');
    expect(sockets.opened).toHaveLength(0);

    clock.advance(ROOM_RETRY_MS);
    await settle();
    expect(requests()).toBe(3);
    expect(store.status.value).toBe('connecting');
    expect(tokens.load()).toEqual(NEW_ROOM);
    expect(sockets.last().path).toBe('/api/rooms/WXYZ/ws');

    clock.advance(ROOM_RETRY_MS);
    await settle();
    expect(requests()).toBe(3);
  });
});
