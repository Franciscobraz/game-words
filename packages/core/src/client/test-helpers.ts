import type { ClientMessage, ServerMessage } from '../room/protocol.ts';
import type { OpenSocket, Schedule, SocketEvents } from './room-connection.ts';

/** Fakes of the connection's tests (style guide §9: fakes, not mocks). Not exported from the package. */

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
