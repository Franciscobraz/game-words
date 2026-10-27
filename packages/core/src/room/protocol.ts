import type { RejectReason } from '../validate.ts';
import { HASH_PREFIX_BYTES } from './hashes.ts';

// The core compiles without DOM or Node types; TextEncoder exists in every runtime it targets.
declare const TextEncoder: { new (): { encode(input: string): Uint8Array } };

/**
 * Wire protocol between the room server and its clients (TV and phones). Every
 * message is a JSON object with a `type`, except the hash frame, which is binary.
 * All names are English kebab-case terms (AD-001); the server never sends display
 * text, only codes the clients translate.
 */

export const CLIENT_MESSAGE_TYPES = [
  'hello',
  'join',
  'settings',
  'start',
  'submit',
  'next',
  'transfer-host',
  'kick',
  'play-again',
  'back-to-lobby',
  'close-room',
  'time',
] as const;

export const SERVER_MESSAGE_TYPES = [
  'welcome',
  'joined',
  'players',
  'settings',
  'round-start',
  'submit-result',
  'counts',
  'round-results',
  'podium',
  'time',
  'error',
  'closed',
] as const;

export const ERROR_CODES = [
  'bad-message',
  'wrong-phase',
  'not-host',
  'bad-token',
  'room-not-found',
  'bad-nickname',
  'nickname-taken',
  'bad-color',
  'color-illegible',
  'color-too-similar',
  'room-full',
  'bad-settings',
  'bad-target',
] as const;

/** Reasons a submitted path is refused: the core's `RejectReason` plus the room's own. */
export const SUBMIT_REJECTS = [
  'invalid-path',
  'too-short',
  'not-a-word',
  'already-found',
  'round-closed',
  'spectator',
  'rate-limited',
] as const satisfies readonly (RejectReason | 'round-closed' | 'spectator' | 'rate-limited')[];

export const CLOSE_REASONS = ['kicked', 'closed-by-host', 'idle', 'tv-gone', 'replaced'] as const;

export type ClientMessageType = (typeof CLIENT_MESSAGE_TYPES)[number];
export type ServerMessageType = (typeof SERVER_MESSAGE_TYPES)[number];
export type ErrorCode = (typeof ERROR_CODES)[number];
export type SubmitReject = RejectReason | 'round-closed' | 'spectator' | 'rate-limited';
export type CloseReason = (typeof CLOSE_REASONS)[number];

/** Largest client message, in UTF-8 bytes. Longer ones are refused before parsing. */
export const MAX_MESSAGE_BYTES = 4096;

/** Longest token or player id a client may send. */
export const MAX_ID_LENGTH = 64;

// ---------------------------------------------------------------------------
// Shared shapes

export type Phase = 'lobby' | 'round' | 'results' | 'podium';

/** Room settings as stored and broadcast. */
export interface Settings {
  size: 4 | 5 | 6;
  seconds: 30 | 60 | 90 | 120 | 150 | 180;
  rounds: 1 | 2 | 3 | 4 | 5;
  minLength: 3 | 4;
  filterProfanity: boolean;
  fastMode: boolean;
  pack: 'pt-BR';
  /** 0-100 */
  volume: number;
  muted: boolean;
}

/** A player as every connection sees it. Tokens never leave the server except in `joined`. */
export interface PlayerInfo {
  id: string;
  nickname: string;
  color: string;
  connected: boolean;
  /** Joined after the countdown began; plays from the next round. */
  spectator: boolean;
  /** Accumulated score of the match. */
  score: number;
  /** Matches won since the room opened; `crownedPlayers` picks the leaders (WINS-01). */
  wins: number;
}

/** The current round: board and server timestamps (ms since epoch). */
export interface RoundInfo {
  /** Unique per room; the hash frame carries it. */
  id: number;
  /** 0-based round of the match. */
  index: number;
  board: string[][];
  /** Submissions open here; until then the clients show the countdown. */
  startsAt: number;
  endsAt: number;
}

export type SubmitResult = { ok: true; word: string } | { ok: false; reason: SubmitReject };

/** A word in the results. `spellings` is absent when the only spelling is the normalized word. */
export interface ResultWord {
  word: string;
  points: number;
  spellings?: string[];
}

export interface PlayerResult {
  playerId: string;
  /** Words only this player found. */
  unique: ResultWord[];
  roundPoints: number;
  /** Accumulated score after this round. */
  score: number;
}

export interface LongestResult extends ResultWord {
  /** Row-major tile indices that spell the word. */
  path: number[];
  /** Ids of the players who found it, possibly none. */
  foundBy: string[];
}

export interface PodiumEntry {
  playerId: string;
  score: number;
}

/** Raw settings change; `validateSettingsPatch` decides whether it is allowed. */
export type SettingsPatch = { readonly [key: string]: unknown };

// ---------------------------------------------------------------------------
// Client messages

/**
 * First message of every connection; tokens never go in the URL. The TV sends the
 * token it got when the room was created. A phone sends its player token to come
 * back, or no token to reach the join screen.
 */
export type HelloMessage = { type: 'hello'; role: 'tv'; token: string } | { type: 'hello'; role: 'player'; token?: string };

export type ClientMessage =
  | HelloMessage
  /** Nickname and color are checked by the room, which answers with their own error codes. */
  | { type: 'join'; nickname: string; color: string }
  | { type: 'settings'; patch: SettingsPatch }
  | { type: 'start' }
  /** One or more paths of row-major tile indices, validated in order. */
  | { type: 'submit'; paths: number[][] }
  | { type: 'next' }
  | { type: 'transfer-host'; playerId: string }
  | { type: 'kick'; playerId: string }
  | { type: 'play-again' }
  | { type: 'back-to-lobby' }
  | { type: 'close-room' }
  /** Clock sync: the client's own timestamp, echoed back. */
  | { type: 'time'; clientTime: number };

// ---------------------------------------------------------------------------
// Server messages

interface WelcomeBase {
  type: 'welcome';
  code: string;
  phase: Phase;
  settings: Settings;
  players: PlayerInfo[];
  hostId: string | null;
  /** Null in the lobby. */
  round: RoundInfo | null;
}

/**
 * Full state, sent in answer to `hello`. In the results or the podium the room
 * follows it with the `round-results` or `podium` message of the phase.
 */
export type WelcomeMessage =
  | (WelcomeBase & { role: 'tv' })
  | (WelcomeBase & {
      role: 'player';
      /** Null until the phone joins. */
      playerId: string | null;
      /** Words this player found in the current round. */
      found: string[];
      /** Base64url salt of the current round; the hash frame follows. Null outside a round. */
      salt: string | null;
    });

/**
 * The countdown of a round: the board goes with the start and end timestamps.
 * Phones also get the round's salt (base64url) and then the binary hash frame;
 * the TV gets neither, so `salt` is absent from its copy.
 */
export interface RoundStartMessage extends RoundInfo {
  type: 'round-start';
  salt?: string;
}

export interface RoundResultsMessage {
  type: 'round-results';
  /** 0-based round of the match. */
  index: number;
  /** Words found by two or more players, shortest first. */
  shared: ResultWord[];
  /** Players from the lowest to the highest accumulated score. */
  players: PlayerResult[];
  /** Null when the board has no solution. */
  longest: LongestResult | null;
  /** Whether another round follows; when false, `next` shows the podium. */
  last: boolean;
}

export type ServerMessage =
  | WelcomeMessage
  /** Only to the phone that joined: its id and the token to come back with. */
  | { type: 'joined'; playerId: string; token: string }
  /** To every connection, whenever the list, a connection state or the host changes. */
  | { type: 'players'; players: PlayerInfo[]; hostId: string | null }
  | { type: 'settings'; settings: Settings }
  | RoundStartMessage
  /** Only to the sender: one result per submitted path, in order. */
  | { type: 'submit-result'; results: SubmitResult[] }
  /** Only to the TV: words accepted per player so far, never the words. */
  | { type: 'counts'; counts: { playerId: string; count: number }[] }
  | RoundResultsMessage
  /** Players from the highest to the lowest score. */
  | { type: 'podium'; ranking: PodiumEntry[] }
  | { type: 'time'; clientTime: number; serverTime: number }
  | { type: 'error'; code: ErrorCode }
  /** Sent right before the server closes the connection. */
  | { type: 'closed'; reason: CloseReason };

// ---------------------------------------------------------------------------
// Parsing

const encoder = new TextEncoder();

type Fields = Record<string, unknown>;

const isObject = (v: unknown): v is Fields => typeof v === 'object' && v !== null && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= MAX_ID_LENGTH;
const hasOnly = (m: Fields, keys: readonly string[]) => Object.keys(m).every((k) => keys.includes(k));

/** Field checks per message type; each returns whether the fields are well formed. */
const SHAPES: Record<ClientMessageType, (m: Fields) => boolean> = {
  hello: (m) =>
    (m.role === 'tv' && hasOnly(m, ['type', 'role', 'token']) && isId(m.token)) ||
    (m.role === 'player' && hasOnly(m, ['type', 'role', 'token']) && (m.token === undefined || isId(m.token))),
  join: (m) => hasOnly(m, ['type', 'nickname', 'color']) && typeof m.nickname === 'string' && typeof m.color === 'string',
  settings: (m) => hasOnly(m, ['type', 'patch']) && isObject(m.patch),
  start: (m) => hasOnly(m, ['type']),
  submit: (m) =>
    hasOnly(m, ['type', 'paths']) &&
    Array.isArray(m.paths) &&
    m.paths.length > 0 &&
    m.paths.every((p) => Array.isArray(p) && p.every((i) => Number.isSafeInteger(i))),
  next: (m) => hasOnly(m, ['type']),
  'transfer-host': (m) => hasOnly(m, ['type', 'playerId']) && isId(m.playerId),
  kick: (m) => hasOnly(m, ['type', 'playerId']) && isId(m.playerId),
  'play-again': (m) => hasOnly(m, ['type']),
  'back-to-lobby': (m) => hasOnly(m, ['type']),
  'close-room': (m) => hasOnly(m, ['type']),
  time: (m) => hasOnly(m, ['type', 'clientTime']) && typeof m.clientTime === 'number' && Number.isFinite(m.clientTime),
};

/**
 * Parses a client text message. Returns null, for the room to answer `bad-message`,
 * when it exceeds 4096 UTF-8 bytes (checked before parsing), is not JSON, has an
 * unknown type, or has a missing, extra or malformed field.
 */
export function parseClientMessage(raw: string): ClientMessage | null {
  // A UTF-16 code unit is at least one UTF-8 byte, so this bounds the encoding below.
  if (raw.length > MAX_MESSAGE_BYTES || encoder.encode(raw).length > MAX_MESSAGE_BYTES) return null;
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObject(msg) || typeof msg.type !== 'string' || !Object.hasOwn(SHAPES, msg.type)) return null;
  return SHAPES[msg.type as ClientMessageType](msg) ? (msg as ClientMessage) : null;
}

// ---------------------------------------------------------------------------
// Hash frame

/** First byte of the binary frame that carries a round's hash prefixes. */
export const HASH_FRAME_KIND = 1;

const HEADER_BYTES = 5;

/**
 * Binary frame of a round's hash prefixes: u8 kind = 1, u32 roundId (big-endian),
 * then the 6-byte prefixes back to back.
 */
export function encodeHashFrame(roundId: number, prefixes: Uint8Array): ArrayBuffer {
  if (!Number.isInteger(roundId) || roundId < 0 || roundId > 0xffffffff) {
    throw new Error(`Invalid round id ${roundId}: expected a u32`);
  }
  if (prefixes.length % HASH_PREFIX_BYTES !== 0) {
    throw new Error(`Invalid prefixes: ${prefixes.length} bytes is not a multiple of ${HASH_PREFIX_BYTES}`);
  }
  const buf = new ArrayBuffer(HEADER_BYTES + prefixes.length);
  const view = new DataView(buf);
  view.setUint8(0, HASH_FRAME_KIND);
  view.setUint32(1, roundId);
  new Uint8Array(buf, HEADER_BYTES).set(prefixes);
  return buf;
}

/** Reads a hash frame. Returns null when the kind or the length is wrong. */
export function decodeHashFrame(buf: ArrayBuffer): { roundId: number; prefixes: Uint8Array } | null {
  if (buf.byteLength < HEADER_BYTES || (buf.byteLength - HEADER_BYTES) % HASH_PREFIX_BYTES !== 0) return null;
  const view = new DataView(buf);
  if (view.getUint8(0) !== HASH_FRAME_KIND) return null;
  return { roundId: view.getUint32(1), prefixes: new Uint8Array(buf.slice(HEADER_BYTES)) };
}
