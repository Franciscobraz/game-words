import type { LanguagePack } from '../pack.ts';
import type { ClientMessage, ErrorCode, PlayerInfo, RoundInfo, ServerMessage } from './protocol.ts';
import type { Player, RoomState } from './state.ts';

/**
 * One connection as `step()` sees it. `id` is unique per socket, so a replaced
 * connection never passes for its successor. The adapter keeps the ref in the
 * socket attachment and updates it on `bind`:
 * - `pending`: accepted, no `hello` yet
 * - `guest`: a phone that said `hello` without a token (join screen)
 * - `tv`: the room's TV
 * - `player`: a phone bound to a player
 */
export type ConnRef =
  | { id: string; role: 'pending' }
  | { id: string; role: 'guest' }
  | { id: string; role: 'tv' }
  | { id: string; role: 'player'; playerId: string };

/** Storage keys of a room (design: "Storage"); a key whose data is gone is deleted. */
export type PersistKey = 'room' | 'round:solutions' | 'round:next' | `found:${string}`;

/** What the adapter must do after a step, in order. */
export type Effect =
  /** Sends a JSON message to one connection. */
  | { kind: 'send'; to: ConnRef; msg: ServerMessage }
  /**
   * Sends a JSON message to every connection past `hello` (the TV, guests and
   * players), or only to those whose role is in `roles`.
   */
  | { kind: 'broadcast'; msg: ServerMessage; roles?: readonly ConnRef['role'][] }
  /** Sends the binary hash frame of the current round to one phone. */
  | { kind: 'send-hashes'; to: ConnRef; frame: ArrayBuffer }
  /** The connection with `conn.id` now has this identity. */
  | { kind: 'bind'; conn: ConnRef }
  /** Closes one connection; a `closed` or `error` send precedes it when there is a reason. */
  | { kind: 'close'; to: ConnRef }
  /** Writes these storage keys from the new state, before any send reaches a client. */
  | { kind: 'persist'; keys: PersistKey[] }
  /**
   * Prepares a round for the room's current settings (`prepareRound` with a fresh
   * seed and salt) and feeds it back to `step` as a `prepared` input.
   */
  | { kind: 'prepare-next' }
  /**
   * Closes the room: closes every connection (a `closed` broadcast precedes it),
   * deletes the storage and the alarm, and frees the code.
   */
  | { kind: 'close-room' };

export interface StepResult {
  state: RoomState;
  effects: Effect[];
}

/** Services `step()` gets from the adapter. */
export interface RoomDeps {
  /** A fresh secret token: 16 random bytes in base64url. */
  randomToken(): string;
  /**
   * The room's language pack, already loaded. Read only when a round ends (the
   * results need spellings and the longest word), so the adapter loads the pack
   * before it feeds an `alarm` while the room is in the `round` phase.
   */
  pack(): LanguagePack;
}

/** Everything a message handler gets. `conn` already passed the role check. */
export interface HandlerContext {
  state: RoomState;
  conn: ConnRef;
  now: number;
  deps: RoomDeps;
}

/** Handles one client message type. Returning the same `state` object means "rejected, nothing changed". */
export type Handler<T extends ClientMessage['type']> = (
  ctx: HandlerContext,
  msg: Extract<ClientMessage, { type: T }>,
) => StepResult;

// ---------------------------------------------------------------------------
// Views: what each role may see

/** The public view of a player: never the token or the round words. */
export function playerInfo(p: Player): PlayerInfo {
  return {
    id: p.id,
    nickname: p.nickname,
    color: p.color,
    connected: p.connected,
    spectator: p.spectator,
    score: p.score,
  };
}

export function playersMessage(state: RoomState): ServerMessage {
  return { type: 'players', players: state.players.map(playerInfo), hostId: state.hostId };
}

/** The current or last round without its salt; null in the lobby. */
export function roundInfo(state: RoomState): RoundInfo | null {
  const r = state.round;
  if (!r || state.phase === 'lobby') return null;
  return { id: r.id, index: state.roundIndex, board: r.board, startsAt: r.startsAt, endsAt: r.endsAt };
}

/** The part of `welcome` every role gets: the room as it stands. */
export function welcomeBase(state: RoomState) {
  return {
    code: state.code,
    phase: state.phase,
    settings: state.settings,
    players: state.players.map(playerInfo),
    hostId: state.hostId,
    round: roundInfo(state),
  };
}

// ---------------------------------------------------------------------------
// Results

export const unchanged = (state: RoomState, ...effects: Effect[]): StepResult => ({ state, effects });

/** An `error` to one connection; the state does not change. */
export const reject = (state: RoomState, to: ConnRef, code: ErrorCode): StepResult =>
  unchanged(state, { kind: 'send', to, msg: { type: 'error', code } });
