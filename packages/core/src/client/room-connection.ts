import { type ClientMessage, decodeHashFrame, type HelloMessage, type ServerMessage } from '../room/protocol.ts';
import { addTimeSample, CLOCK_SYNC_SAMPLES, type ClockSample, serverNow } from './clock-sync.ts';

/** The binary frame of a round's hash prefixes, as `decodeHashFrame` returns it. */
export interface HashFrame {
  roundId: number;
  prefixes: Uint8Array;
}

/** Where the connection stands, for the reconnect banner and the screens (RECON-01). */
export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'offline' | 'closed';

/** Waits before each reconnect attempt: 0.5 s, 1 s, 2 s, then 4 s (RECON-01 AC 1). */
export const RECONNECT_DELAYS_MS = [500, 1_000, 2_000, 4_000] as const;

/** Time without a successful reconnect before the client gives up and shows "Sem conexão" (RECON-01 AC 4). */
export const OFFLINE_AFTER_MS = 30_000;

/** What a socket reports back to the connection. */
export interface SocketEvents {
  onOpen(): void;
  onMessage(data: string | ArrayBuffer): void;
  onClose(): void;
}

/** The two things the connection does to an open socket. */
export interface SocketHandle {
  send(text: string): void;
  close(): void;
}

// SPEC_DEVIATION: design.md types `openSocket` as `(url) => WebSocket`.
// Reason: a factory that takes the events and returns a small handle lets the Node
// tests pass a fake socket without DOM types; `browserSocket` adapts the real one.
/** Opens a socket to `path` (e.g. `/api/rooms/KBXT/ws`) and reports its events. */
export type OpenSocket = (path: string, events: SocketEvents) => SocketHandle;

/** Runs `run` after `ms`; the returned function cancels it. */
export type Schedule = (run: () => void, ms: number) => () => void;

/** The first message of each socket, from the token the connection holds (design: core client). */
export type SayHello = (token: string | null) => HelloMessage;

/** A phone's `hello`: with its token to come back, without one to reach the join screen (ENTRY-01 AC 6). */
export const playerHello: SayHello = (token) => (token === null ? { type: 'hello', role: 'player' } : { type: 'hello', role: 'player', token });

/** The TV's `hello`: it always opens a room with the token that came with it (TVROOM-01 AC 4). */
export const tvHello: SayHello = (token) => {
  if (token === null) throw new Error('The TV connects only with the token of its room');
  return { type: 'hello', role: 'tv', token };
};

/** Everything the connection needs from the outside world (style guide §4, D). */
export interface ConnectionOptions {
  openSocket: OpenSocket;
  now: () => number;
  schedule: Schedule;
  /** What each socket says first; a phone's `hello` unless told otherwise. */
  hello?: SayHello;
  onMessage(msg: ServerMessage): void;
  /** Only phones get the round's hashes; the TV leaves it out (design: core client). */
  onHashes?(frame: HashFrame): void;
  onStatus(status: ConnectionStatus): void;
}

/** One room connection: `hello`, reconnection, clock sync and message delivery (RECON-01, EXIT-01, COUNT-01). */
export interface RoomConnection {
  /** Opens the room `code`, saying `hello` with `token` when the client has one (ENTRY-01 AC 6). */
  connect(code: string, token: string | null): void;
  /** Sends a message when the socket is open; drops it otherwise, since the screens lock while reconnecting. */
  send(msg: ClientMessage): void;
  /** "Tentar de novo": starts reconnecting again with a fresh 30 s window (RECON-01 AC 4). */
  retry(): void;
  /** Closes on purpose; nothing reconnects. */
  close(): void;
  /** The server clock now, from the best `time` sample (COUNT-01 AC 3). */
  serverNow(): number;
}

/** Creates a connection; nothing opens until `connect`. */
export function createRoomConnection(options: ConnectionOptions): RoomConnection {
  const { openSocket, now, schedule, hello = playerHello } = options;

  let code: string | null = null;
  let token: string | null = null;
  let socket: SocketHandle | null = null;
  let isOpen = false;
  let attempt = 0;
  let cancelReconnect: (() => void) | null = null;
  let cancelOffline: (() => void) | null = null;
  let clock: ClockSample | null = null;
  let status: ConnectionStatus = 'closed';

  function setStatus(next: ConnectionStatus): void {
    status = next;
    options.onStatus(next);
  }

  function stopTimers(): void {
    cancelReconnect?.();
    cancelReconnect = null;
    cancelOffline?.();
    cancelOffline = null;
  }

  /** Forgets the current socket, so its late events are ignored, and closes it. */
  function dropSocket(): void {
    const old = socket;
    socket = null;
    isOpen = false;
    old?.close();
  }

  function open(): void {
    if (code === null) return;
    let handle: SocketHandle | null = null;
    const isCurrent = () => handle !== null && socket === handle;
    handle = openSocket(`/api/rooms/${code}/ws`, {
      onOpen: () => {
        if (isCurrent()) handleOpen();
      },
      onMessage: (data) => {
        if (isCurrent()) handleData(data);
      },
      onClose: () => {
        if (isCurrent()) handleUnexpectedClose();
      },
    });
    socket = handle;
  }

  function handleOpen(): void {
    isOpen = true;
    attempt = 0;
    // The offline deadline stays until the welcome: a socket that opens and drops again has not brought the room back.
    cancelReconnect?.();
    cancelReconnect = null;
    setStatus('open');
    sendNow(hello(token));
    for (let i = 0; i < CLOCK_SYNC_SAMPLES; i++) sendNow({ type: 'time', clientTime: now() });
  }

  function handleData(data: string | ArrayBuffer): void {
    if (typeof data !== 'string') {
      // A frame that does not decode is not the round's hashes; the next welcome resends them.
      const frame = decodeHashFrame(data);
      if (frame !== null) options.onHashes?.(frame);
      return;
    }
    const msg = JSON.parse(data) as ServerMessage;
    if (msg.type === 'time') clock = addTimeSample(clock, msg, now());
    if (msg.type === 'welcome') stopTimers();
    if (msg.type === 'joined') token = msg.token;
    if (msg.type === 'closed') endByServer();
    // The server closes right after `room-not-found`; only a new "CONTINUAR" opens the room again (Edge Cases).
    if (msg.type === 'error' && msg.code === 'room-not-found') endByServer();
    options.onMessage(msg);
  }

  /** The server ended this socket on purpose (`closed`, `room-not-found`): no reconnect (EXIT-01 AC 4, Edge Cases). */
  function endByServer(): void {
    stopTimers();
    dropSocket();
    setStatus('closed');
  }

  /** A drop without `closed`: retry with growing waits until the offline deadline (RECON-01 AC 1, 4). */
  function handleUnexpectedClose(): void {
    socket = null;
    isOpen = false;
    if (status !== 'reconnecting') startReconnecting();
    scheduleNextAttempt();
  }

  function startReconnecting(): void {
    setStatus('reconnecting');
    cancelOffline = schedule(goOffline, OFFLINE_AFTER_MS);
  }

  function scheduleNextAttempt(): void {
    const delay = reconnectDelay(attempt);
    attempt += 1;
    cancelReconnect = schedule(() => {
      cancelReconnect = null;
      open();
    }, delay);
  }

  function goOffline(): void {
    cancelOffline = null;
    stopTimers();
    dropSocket();
    setStatus('offline');
  }

  function sendNow(msg: ClientMessage): void {
    socket?.send(JSON.stringify(msg));
  }

  return {
    connect(nextCode, nextToken) {
      stopTimers();
      dropSocket();
      code = nextCode;
      token = nextToken;
      attempt = 0;
      setStatus('connecting');
      open();
    },
    send(msg) {
      if (isOpen) sendNow(msg);
    },
    retry() {
      if (code === null) return;
      stopTimers();
      dropSocket();
      attempt = 0;
      startReconnecting();
      open();
    },
    close() {
      stopTimers();
      dropSocket();
      setStatus('closed');
    },
    serverNow: () => serverNow(clock, now()),
  };
}

/** The wait before attempt `attempt` (0-based); the last delay repeats. */
function reconnectDelay(attempt: number): number {
  const lastIndex = RECONNECT_DELAYS_MS.length - 1;
  // The index is clamped to the array, so the entry exists.
  return RECONNECT_DELAYS_MS[Math.min(attempt, lastIndex)]!;
}
