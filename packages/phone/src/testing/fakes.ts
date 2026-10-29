import type { ClientMessage, ServerMessage } from '@bwords/core';
import type { OpenSocket, RoomConnection, Schedule, SocketEvents } from '../net/room-connection.ts';
import type { ConnectionHandlers, KeyValueStorage, OpenConnection } from '../state/room.ts';

/**
 * Fakes for the Node tests of `net/` and `state/` (style guide §9: fakes, not mocks).
 * They honour the same contracts as the browser versions.
 */

/** A manual clock with timers that fire, in order, when the test advances it. */
export interface FakeClock {
  now(): number;
  schedule: Schedule;
  /** Moves time forward `ms`, firing every timer due on the way. */
  advance(ms: number): void;
}

/** A clock that starts at `start` ms. */
export function fakeClock(start = 0): FakeClock {
  let time = start;
  let nextId = 0;
  const timers = new Map<number, { at: number; run: () => void }>();

  function nextDue(until: number): [number, { at: number; run: () => void }] | null {
    let due: [number, { at: number; run: () => void }] | null = null;
    for (const entry of timers) {
      if (entry[1].at > until) continue;
      if (due === null || entry[1].at < due[1].at) due = entry;
    }
    return due;
  }

  return {
    now: () => time,
    schedule(run, ms) {
      const id = nextId++;
      timers.set(id, { at: time + ms, run });
      return () => timers.delete(id);
    },
    advance(ms) {
      const until = time + ms;
      for (let due = nextDue(until); due !== null; due = nextDue(until)) {
        timers.delete(due[0]);
        time = due[1].at;
        due[1].run();
      }
      time = until;
    },
  };
}

/** One socket the connection opened, driven by the test. */
export interface FakeSocket {
  path: string;
  sent: ClientMessage[];
  closedByClient: boolean;
  open(): void;
  receive(msg: ServerMessage): void;
  receiveBinary(data: ArrayBuffer): void;
  /** The network drops the socket. */
  drop(): void;
}

/** A socket factory that records every socket it opens. */
export function fakeSockets(): { openSocket: OpenSocket; opened: FakeSocket[]; last(): FakeSocket } {
  const opened: FakeSocket[] = [];
  const openSocket: OpenSocket = (path: string, events: SocketEvents) => {
    const socket: FakeSocket = {
      path,
      sent: [],
      closedByClient: false,
      open: () => events.onOpen(),
      receive: (msg) => events.onMessage(JSON.stringify(msg)),
      receiveBinary: (data) => events.onMessage(data),
      drop: () => events.onClose(),
    };
    opened.push(socket);
    return {
      send: (text) => socket.sent.push(JSON.parse(text) as ClientMessage),
      close: () => {
        socket.closedByClient = true;
      },
    };
  };
  return {
    openSocket,
    opened,
    last() {
      const socket = opened.at(-1);
      if (!socket) throw new Error('No socket was opened');
      return socket;
    },
  };
}

/** A room connection that records what the store asks of it; the test plays the server. */
export interface FakeConnection {
  openConnection: OpenConnection;
  connects: { code: string; token: string | null }[];
  sent: ClientMessage[];
  retries: number;
  closes: number;
  /** Delivers a server message to the store. */
  receive(msg: ServerMessage): void;
  /** The handlers the store registered. */
  handlers(): ConnectionHandlers;
}

/** A fake `RoomConnection` whose server clock reads `serverTime`. */
export function fakeConnection(serverTime = 0): FakeConnection {
  let registered: ConnectionHandlers | null = null;
  const fake: FakeConnection = {
    connects: [],
    sent: [],
    retries: 0,
    closes: 0,
    openConnection(handlers) {
      registered = handlers;
      const connection: RoomConnection = {
        connect: (code, token) => fake.connects.push({ code, token }),
        send: (msg) => fake.sent.push(msg),
        retry: () => {
          fake.retries += 1;
        },
        close: () => {
          fake.closes += 1;
        },
        serverNow: () => serverTime,
      };
      return connection;
    },
    receive: (msg) => fake.handlers().onMessage(msg),
    handlers() {
      if (registered === null) throw new Error('The store has not opened the connection');
      return registered;
    },
  };
  return fake;
}

/** In-memory storage with the browser's semantics. */
export function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { entries: Map<string, string> } {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    get: (key) => entries.get(key) ?? null,
    set: (key, value) => {
      entries.set(key, value);
    },
    remove: (key) => {
      entries.delete(key);
    },
  };
}
