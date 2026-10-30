import type { ClientMessage, RoomConnection, Schedule, ServerMessage } from '@bwords/core';
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

/** A fake `RoomConnection` whose server clock reads `serverTime`, a fixed time or a clock to follow. */
export function fakeConnection(serverTime: number | (() => number) = 0): FakeConnection {
  const readServerTime = typeof serverTime === 'number' ? () => serverTime : serverTime;
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
        serverNow: readServerTime,
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

/** The device feedback of a valid word, recorded for the test (PLAY-01 AC 18-19). */
export interface FakeDevice {
  vibrate(ms: number): void;
  playHitSound(): void;
  /** Each vibration asked, in ms. */
  vibrations: number[];
  /** How many times the hit sound played. */
  sounds: number;
}

export function fakeDevice(): FakeDevice {
  const device: FakeDevice = {
    vibrations: [],
    sounds: 0,
    vibrate: (ms) => {
      device.vibrations.push(ms);
    },
    playHitSound: () => {
      device.sounds += 1;
    },
  };
  return device;
}

/** The screen's wake lock and the page's visibility, as the browser handles them (PREF-01 AC 4). */
export interface FakeScreen {
  wakeLock: { request(): void; release(): void };
  onVisible(listener: () => void): () => void;
  /** Whether the phone holds the wake lock now. */
  held: boolean;
  /** The page goes to the background: the browser lets go of the wake lock on its own. */
  hide(): void;
  /** The page is visible again. */
  show(): void;
}

export function fakeScreen(): FakeScreen {
  const listeners = new Set<() => void>();
  const screen: FakeScreen = {
    held: false,
    wakeLock: {
      request: () => {
        screen.held = true;
      },
      release: () => {
        screen.held = false;
      },
    },
    onVisible(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    hide: () => {
      screen.held = false;
    },
    show: () => {
      for (const listener of listeners) listener();
    },
  };
  return screen;
}

/** A storage whose every access throws, as a browser that blocks site data. */
export function throwingStorage(): KeyValueStorage {
  const refuse = (): never => {
    throw new Error('Site data is blocked');
  };
  return { get: refuse, set: refuse, remove: refuse };
}
