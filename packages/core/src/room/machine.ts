import { countsMessage } from './counts.ts';
import {
  type ConnRef,
  type Effect,
  type Handler,
  type HandlerContext,
  type RoomDeps,
  type StepResult,
  playersMessage,
  reject,
  unchanged,
  welcomeBase,
} from './effects.ts';
import { handleCloseRoom, handleNext, handlePlayAgain, podiumMessage } from './flow.ts';
import { handleKick, handleTransferHost, HOST_COMMANDS, isHost } from './host.ts';
import { handleJoin } from './join.ts';
import { type ClientMessage, type ClientMessageType, encodeHashFrame, type Phase, parseClientMessage } from './protocol.ts';
import type { PreparedRound } from './prepare.ts';
import { handleStart, onPrepared } from './round.ts';
import { handleSettings } from './settings.ts';
import { handleSubmit } from './submit.ts';
import type { RoomState } from './state.ts';

/**
 * The room as a pure state machine (design: approach A). The Durable Object turns
 * sockets and alarms into inputs, calls `step`, and runs the effects. The clock is
 * the `now` parameter: nothing here reads the time.
 */

/**
 * What reaches the room. `data` is the raw text frame; `step` parses it.
 * `prepared` carries a round the adapter prepared after a `prepare-next` effect.
 */
export type RoomInput =
  | { kind: 'message'; conn: ConnRef; data: string }
  | { kind: 'connect'; conn: ConnRef }
  | { kind: 'disconnect'; conn: ConnRef }
  | { kind: 'alarm' }
  | { kind: 'prepared'; round: PreparedRound };

const ALL_PHASES: readonly Phase[] = ['lobby', 'round', 'results', 'podium'];

/** Phases in which each command is valid; anything else gets `wrong-phase`. */
export const COMMAND_PHASES: Record<ClientMessageType, readonly Phase[]> = {
  hello: ALL_PHASES,
  time: ALL_PHASES,
  join: ALL_PHASES,
  settings: ['lobby'],
  start: ['lobby'],
  submit: ['round'],
  next: ['results'],
  'transfer-host': ALL_PHASES,
  kick: ALL_PHASES,
  'play-again': ['podium'],
  'close-room': ALL_PHASES,
};

/** Connection roles that may send each command; anything else gets `bad-message`. */
export const COMMAND_ROLES: Record<ClientMessageType, readonly ConnRef['role'][]> = {
  hello: ['pending'],
  time: ['pending', 'guest', 'tv', 'player'],
  join: ['guest'],
  settings: ['player'],
  start: ['player'],
  submit: ['player'],
  next: ['player'],
  'transfer-host': ['player'],
  kick: ['player'],
  'play-again': ['player'],
  'close-room': ['player'],
};

/** Commands that count as a player or host action for the idle timeout. */
const ACTIONS: ReadonlySet<ClientMessageType> = new Set([
  'join',
  'settings',
  'start',
  'submit',
  'next',
  'transfer-host',
  'kick',
  'play-again',
  'close-room',
]);

// ---------------------------------------------------------------------------
// Connection handlers

const handleHello: Handler<'hello'> = (ctx, msg) => {
  const { state, conn, now } = ctx;
  if (msg.role === 'tv') {
    if (msg.token !== state.tvToken) return badToken(state, conn);
    const effects: Effect[] = [];
    if (state.tvConn !== null) effects.push(...replace({ id: state.tvConn, role: 'tv' }));
    const tv: ConnRef = { id: conn.id, role: 'tv' };
    const inRound = state.phase === 'round';
    const next: RoomState = {
      ...state,
      tvConn: conn.id,
      tvOfflineSince: null,
      // During a round the counts so far follow the welcome, so nothing is pending.
      tvCounts: inRound ? { dirty: false, lastSentAt: now } : state.tvCounts,
    };
    effects.push(
      { kind: 'persist', keys: ['room'] },
      { kind: 'bind', conn: tv },
      { kind: 'send', to: tv, msg: { type: 'welcome', role: 'tv', ...welcomeBase(next) } },
    );
    if (inRound) effects.push({ kind: 'send', to: tv, msg: countsMessage(next) });
    effects.push(...afterWelcome(next, tv));
    return { state: next, effects };
  }

  if (msg.token === undefined) {
    const guest: ConnRef = { id: conn.id, role: 'guest' };
    return unchanged(
      state,
      { kind: 'bind', conn: guest },
      {
        kind: 'send',
        to: guest,
        msg: { type: 'welcome', role: 'player', ...welcomeBase(state), playerId: null, found: [], salt: null },
      },
      ...afterWelcome(state, guest),
    );
  }

  const player = state.players.find((p) => p.token === msg.token);
  if (!player) return badToken(state, conn);
  const effects: Effect[] = [];
  if (player.connId !== null) effects.push(...replace({ id: player.connId, role: 'player', playerId: player.id }));
  const me: ConnRef = { id: conn.id, role: 'player', playerId: player.id };
  const next: RoomState = {
    ...state,
    players: state.players.map((p) => (p.id === player.id ? { ...p, connected: true, connId: conn.id } : p)),
    hostOfflineSince: state.hostId === player.id ? null : state.hostOfflineSince,
  };
  const inRound = next.phase === 'round' && next.round !== null;
  effects.push(
    { kind: 'persist', keys: ['room'] },
    { kind: 'bind', conn: me },
    {
      kind: 'send',
      to: me,
      msg: {
        type: 'welcome',
        role: 'player',
        ...welcomeBase(next),
        playerId: player.id,
        found: [...player.found],
        salt: inRound ? next.round!.salt : null,
      },
    },
  );
  if (inRound && next.solutions) {
    effects.push({ kind: 'send-hashes', to: me, frame: encodeHashFrame(next.round!.id, next.solutions.prefixes) });
  }
  effects.push(...afterWelcome(next, me), { kind: 'broadcast', msg: playersMessage(next) });
  return { state: next, effects };
};

const handleTime: Handler<'time'> = ({ state, conn, now }, msg) =>
  unchanged(state, { kind: 'send', to: conn, msg: { type: 'time', clientTime: msg.clientTime, serverTime: now } });

/**
 * Handlers by message type. Phase 2 and 3 tasks register theirs here; a type
 * without a handler is accepted and changes nothing.
 */
const HANDLERS: { [T in ClientMessageType]?: Handler<T> } = {
  hello: handleHello,
  time: handleTime,
  join: handleJoin,
  'transfer-host': handleTransferHost,
  kick: handleKick,
  settings: handleSettings,
  start: handleStart,
  submit: handleSubmit,
  next: handleNext,
  'play-again': handlePlayAgain,
  'close-room': handleCloseRoom,
};

/** What follows the welcome in the results and the podium: the message of the phase. */
function afterWelcome(state: RoomState, to: ConnRef): Effect[] {
  if (state.phase === 'results' && state.results) return [{ kind: 'send', to, msg: state.results }];
  if (state.phase === 'podium') return [{ kind: 'send', to, msg: podiumMessage(state) }];
  return [];
}

function badToken(state: RoomState, conn: ConnRef): StepResult {
  return unchanged(state, { kind: 'send', to: conn, msg: { type: 'error', code: 'bad-token' } }, { kind: 'close', to: conn });
}

/** Closes the connection a newer one with the same token replaces. */
function replace(old: ConnRef): Effect[] {
  return [
    { kind: 'send', to: old, msg: { type: 'closed', reason: 'replaced' } },
    { kind: 'close', to: old },
  ];
}

// ---------------------------------------------------------------------------
// Dispatch

/** Whether `conn` is still the open connection of its TV or player; replaced ones are ignored. */
function isCurrent(state: RoomState, conn: ConnRef): boolean {
  if (conn.role === 'tv') return state.tvConn === conn.id;
  if (conn.role === 'player') return state.players.some((p) => p.id === conn.playerId && p.connId === conn.id);
  return true;
}

function onMessage(state: RoomState, conn: ConnRef, data: string, now: number, deps: RoomDeps): StepResult {
  if (!isCurrent(state, conn)) return unchanged(state);
  const msg = parseClientMessage(data);
  if (!msg) return reject(state, conn, 'bad-message');
  if (!COMMAND_ROLES[msg.type].includes(conn.role)) return reject(state, conn, 'bad-message');
  if (HOST_COMMANDS.includes(msg.type) && !isHost(state, conn)) return reject(state, conn, 'not-host');
  if (!COMMAND_PHASES[msg.type].includes(state.phase)) return reject(state, conn, 'wrong-phase');
  const handler = HANDLERS[msg.type] as Handler<ClientMessage['type']> | undefined;
  if (!handler) return unchanged(state);
  const ctx: HandlerContext = { state, conn, now, deps };
  const result = handler(ctx, msg);
  if (ACTIONS.has(msg.type) && result.state !== state) {
    return { state: { ...result.state, lastActionAt: now }, effects: result.effects };
  }
  return result;
}

function onDisconnect(state: RoomState, conn: ConnRef, now: number): StepResult {
  if (!isCurrent(state, conn)) return unchanged(state);
  if (conn.role === 'tv') {
    return { state: { ...state, tvConn: null, tvOfflineSince: now }, effects: [{ kind: 'persist', keys: ['room'] }] };
  }
  if (conn.role === 'player') {
    const next: RoomState = {
      ...state,
      players: state.players.map((p) => (p.id === conn.playerId ? { ...p, connected: false, connId: null } : p)),
      hostOfflineSince: state.hostId === conn.playerId ? now : state.hostOfflineSince,
    };
    return { state: next, effects: [{ kind: 'persist', keys: ['room'] }, { kind: 'broadcast', msg: playersMessage(next) }] };
  }
  return unchanged(state);
}

/**
 * Applies one input to the room and returns the new state and the effects to run,
 * in order. Never mutates `state`; a rejected input returns it unchanged.
 */
export function step(state: RoomState, input: RoomInput, now: number, deps: RoomDeps): StepResult {
  if (state.closed) return unchanged(state);
  switch (input.kind) {
    case 'message':
      return onMessage(state, input.conn, input.data, now, deps);
    case 'disconnect':
      return onDisconnect(state, input.conn, now);
    case 'connect':
      // A new socket waits for its `hello`; the room has nothing to do yet.
      return unchanged(state);
    case 'alarm':
      // Phase 3 (deadlines): round end, host handover, TV counts flush, expiry.
      return unchanged(state);
    case 'prepared':
      return onPrepared(state, input.round, now);
  }
}
