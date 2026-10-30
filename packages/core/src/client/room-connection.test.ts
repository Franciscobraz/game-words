import { describe, expect, test } from 'vitest';
import { encodeHashFrame, type ServerMessage } from '../room/protocol.ts';
import { type ConnectionStatus, createRoomConnection, type HashFrame } from './room-connection.ts';
import { fakeClock, fakeSockets } from './test-helpers.ts';

/** A connection wired to a fake clock and fake sockets, recording what it reports. */
function setup() {
  const clock = fakeClock(1_000_000);
  const sockets = fakeSockets();
  const messages: ServerMessage[] = [];
  const frames: HashFrame[] = [];
  const statuses: ConnectionStatus[] = [];
  const connection = createRoomConnection({
    openSocket: sockets.openSocket,
    now: clock.now,
    schedule: clock.schedule,
    onMessage: (msg) => messages.push(msg),
    onHashes: (frame) => frames.push(frame),
    onStatus: (status) => statuses.push(status),
  });
  const status = () => statuses.at(-1);

  /** Advances time while every new attempt fails at once, as on a dead network. */
  function advanceFailing(ms: number): void {
    let remaining = ms;
    let failed = sockets.opened.length;
    while (remaining > 0) {
      const step = Math.min(100, remaining);
      clock.advance(step);
      remaining -= step;
      for (; failed < sockets.opened.length; failed++) sockets.opened[failed]?.drop();
    }
  }

  return { clock, sockets, messages, frames, connection, status, advanceFailing };
}

describe('without a hash listener', () => {
  test('drops the hash frame and keeps delivering messages', () => {
    // The TV never gets hashes, so it opens the connection without `onHashes`.
    const clock = fakeClock(1_000_000);
    const sockets = fakeSockets();
    const messages: ServerMessage[] = [];
    const connection = createRoomConnection({
      openSocket: sockets.openSocket,
      now: clock.now,
      schedule: clock.schedule,
      onMessage: (msg) => messages.push(msg),
      onStatus: () => {},
    });
    connection.connect('KBXT', null);
    sockets.last().open();

    sockets.last().receiveBinary(encodeHashFrame(7, new Uint8Array(6)));
    sockets.last().receive({ type: 'players', players: [], hostId: null });

    expect(messages).toEqual([{ type: 'players', players: [], hostId: null }]);
  });
});

describe('opening', () => {
  test('says hello with the saved token and asks the time three times', () => {
    const { sockets, connection, status, clock } = setup();

    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();

    expect(sockets.last().path).toBe('/api/rooms/KBXT/ws');
    expect(sockets.last().sent).toEqual([
      { type: 'hello', role: 'player', token: 'secret-beto' },
      { type: 'time', clientTime: clock.now() },
      { type: 'time', clientTime: clock.now() },
      { type: 'time', clientTime: clock.now() },
    ]);
    expect(status()).toBe('open');
  });

  test('says hello without a token when the phone has none', () => {
    const { sockets, connection, status } = setup();

    connection.connect('KBXT', null);
    expect(status()).toBe('connecting');
    sockets.last().open();

    expect(sockets.last().sent[0]).toEqual({ type: 'hello', role: 'player' });
  });

  test('delivers server messages and sends client messages while open', () => {
    const { sockets, connection, messages } = setup();
    connection.connect('KBXT', null);
    sockets.last().open();

    sockets.last().receive({ type: 'players', players: [], hostId: null });
    connection.send({ type: 'start' });

    expect(messages).toEqual([{ type: 'players', players: [], hostId: null }]);
    expect(sockets.last().sent.at(-1)).toEqual({ type: 'start' });
  });

  test('reads the server clock from the time answers', () => {
    const { sockets, connection, clock } = setup();
    connection.connect('KBXT', null);
    sockets.last().open();
    const sentAt = clock.now();

    clock.advance(40);
    sockets.last().receive({ type: 'time', clientTime: sentAt, serverTime: sentAt + 5_020 });

    expect(connection.serverNow()).toBe(clock.now() + 5_000);
  });
});

describe('hash frames', () => {
  test('decodes the binary frame of the round', () => {
    const { sockets, connection, frames } = setup();
    connection.connect('KBXT', null);
    sockets.last().open();

    sockets.last().receiveBinary(encodeHashFrame(7, new Uint8Array([1, 2, 3, 4, 5, 6])));

    expect(frames).toEqual([{ roundId: 7, prefixes: new Uint8Array([1, 2, 3, 4, 5, 6]) }]);
  });

  test('drops a binary frame that does not decode', () => {
    const { sockets, connection, frames } = setup();
    connection.connect('KBXT', null);
    sockets.last().open();

    sockets.last().receiveBinary(new Uint8Array([9, 0, 0, 0, 7]).buffer);

    expect(frames).toEqual([]);
  });
});

describe('reconnecting', () => {
  test('reconnects with the token after an unexpected close', () => {
    const { sockets, connection, status, clock } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();

    sockets.last().drop();
    expect(status()).toBe('reconnecting');
    clock.advance(499);
    expect(sockets.opened).toHaveLength(1);
    clock.advance(1);
    expect(sockets.opened).toHaveLength(2);
    sockets.last().open();

    expect(sockets.last().sent[0]).toEqual({ type: 'hello', role: 'player', token: 'secret-beto' });
    expect(status()).toBe('open');
  });

  test('comes back with the token the server gave on joined', () => {
    const { sockets, connection, clock } = setup();
    connection.connect('KBXT', null);
    sockets.last().open();
    sockets.last().receive({ type: 'joined', playerId: 'p-beto', token: 'secret-beto' });

    sockets.last().drop();
    clock.advance(500);
    sockets.last().open();

    expect(sockets.last().sent[0]).toEqual({ type: 'hello', role: 'player', token: 'secret-beto' });
  });

  test('waits 0.5 s, 1 s, 2 s and then 4 s between attempts', () => {
    const { sockets, connection, clock } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();

    for (const [attempt, delay] of [500, 1_000, 2_000, 4_000, 4_000].entries()) {
      clock.advance(delay - 1);
      expect(sockets.opened).toHaveLength(attempt + 1);
      clock.advance(1);
      expect(sockets.opened).toHaveLength(attempt + 2);
      sockets.last().drop();
    }
  });

  test('starts the waits over after a successful reconnect', () => {
    const { sockets, connection, clock } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();
    clock.advance(500);
    sockets.last().drop();
    clock.advance(1_000);
    sockets.last().open();

    sockets.last().drop();
    clock.advance(500);

    expect(sockets.opened).toHaveLength(4);
  });

  test('goes offline after 30 seconds without reconnecting', () => {
    const { sockets, connection, status, advanceFailing } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();

    advanceFailing(29_999);
    expect(status()).toBe('reconnecting');
    advanceFailing(1);
    expect(status()).toBe('offline');

    const attempts = sockets.opened.length;
    advanceFailing(60_000);
    expect(sockets.opened).toHaveLength(attempts);
  });

  test('keeps the 30 second deadline while sockets open and drop before any welcome', () => {
    // RECON-01 AC 4: an attempt only succeeds when the room is back; a server that accepts the socket and drops it
    // again does not restart the 30 s.
    const { sockets, connection, status, clock } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();

    let handled = sockets.opened.length;
    for (let elapsed = 0; elapsed < 29_999; elapsed += 1) {
      clock.advance(1);
      for (; handled < sockets.opened.length; handled++) {
        sockets.opened[handled]?.open();
        sockets.opened[handled]?.drop();
      }
    }
    expect(sockets.opened.length).toBeGreaterThan(5);
    expect(status()).toBe('reconnecting');
    clock.advance(1);

    expect(status()).toBe('offline');
  });

  test('a welcome after the socket opens ends the reconnection', () => {
    const { sockets, connection, status, clock } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();
    clock.advance(500);
    sockets.last().open();

    sockets.last().receive({
      type: 'welcome',
      role: 'player',
      code: 'KBXT',
      phase: 'lobby',
      settings: { size: 4, seconds: 60, rounds: 1, minLength: 3, filterProfanity: true, pack: 'pt-BR', volume: 100, muted: false },
      players: [],
      hostId: null,
      round: null,
      playerId: null,
      found: [],
      salt: null,
    });
    clock.advance(60_000);

    expect(status()).toBe('open');
  });

  test('retry starts reconnecting again with a fresh 30 second window', () => {
    const { sockets, connection, status, advanceFailing } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();
    advanceFailing(30_000);
    const attempts = sockets.opened.length;

    connection.retry();

    expect(status()).toBe('reconnecting');
    expect(sockets.opened).toHaveLength(attempts + 1);
    sockets.last().drop();
    advanceFailing(29_999);
    expect(status()).toBe('reconnecting');
    advanceFailing(1);
    expect(status()).toBe('offline');
  });

  test('a successful retry opens the room with the token', () => {
    const { sockets, connection, status, advanceFailing } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();
    advanceFailing(30_000);

    connection.retry();
    sockets.last().open();

    expect(status()).toBe('open');
    expect(sockets.last().sent[0]).toEqual({ type: 'hello', role: 'player', token: 'secret-beto' });
  });

  test('drops messages sent while reconnecting', () => {
    const { sockets, connection } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();
    sockets.last().drop();
    const sentBefore = sockets.last().sent.length;

    connection.send({ type: 'start' });

    expect(sockets.last().sent).toHaveLength(sentBefore);
  });
});

describe('closing', () => {
  test('does not reconnect after replaced', () => {
    const { sockets, connection, status, messages, clock } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();

    sockets.last().receive({ type: 'closed', reason: 'replaced' });
    sockets.last().drop();
    clock.advance(60_000);

    expect(messages.at(-1)).toEqual({ type: 'closed', reason: 'replaced' });
    expect(status()).toBe('closed');
    expect(sockets.opened).toHaveLength(1);
  });

  test('stops reconnecting after room-not-found', () => {
    // Edge Cases, ENTRY-01: the server closes without `closed`; only a new "CONTINUAR" connects again.
    const { sockets, connection, status, messages, clock } = setup();
    connection.connect('ZZZZ', null);
    sockets.last().open();

    sockets.last().receive({ type: 'error', code: 'room-not-found' });
    sockets.last().drop();
    clock.advance(60_000);

    expect(messages.at(-1)).toEqual({ type: 'error', code: 'room-not-found' });
    expect(status()).toBe('closed');
    expect(sockets.opened).toHaveLength(1);

    connection.connect('KBXT', null);

    expect(sockets.opened).toHaveLength(2);
    expect(sockets.last().path).toBe('/api/rooms/KBXT/ws');
    expect(status()).toBe('connecting');
  });

  test('does not reconnect after the phone closes on purpose', () => {
    const { sockets, connection, status, clock } = setup();
    connection.connect('KBXT', 'secret-beto');
    sockets.last().open();

    connection.close();
    sockets.last().drop();
    clock.advance(60_000);

    expect(sockets.last().closedByClient).toBe(true);
    expect(status()).toBe('closed');
    expect(sockets.opened).toHaveLength(1);
  });

  test('a new connect replaces the old socket and ignores its late events', () => {
    const { sockets, connection, status, clock } = setup();
    connection.connect('KBXT', 'stale-token');
    const first = sockets.last();
    first.open();

    connection.connect('KBXT', null);
    first.drop();
    clock.advance(60_000);

    expect(first.closedByClient).toBe(true);
    expect(sockets.opened).toHaveLength(2);
    expect(status()).toBe('connecting');
  });
});
