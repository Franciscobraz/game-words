import type { Phase, RoundResultsMessage, Settings, SettingsPatch } from './protocol.ts';

/**
 * Server-side state of a room. Wire shapes (`Settings`, `PlayerInfo`, `RoundInfo`)
 * live in `protocol.ts`; this module adds what only the server keeps: tokens,
 * connection ids, round salts and solutions.
 */

/** Expiry timeouts in minutes, read from the Worker vars; 0 turns a rule off. */
export interface RoomConfig {
  idleMin: number;
  tvGoneMin: number;
}

/** A player as the server keeps it. `token` goes only to its owner, in `joined`. */
export interface Player {
  id: string;
  token: string;
  nickname: string;
  color: string;
  joinedAt: number;
  connected: boolean;
  /** Id of the open connection of this player, null while disconnected. */
  connId: string | null;
  /** Joined after the countdown began; plays from the next round. */
  spectator: boolean;
  /** Accumulated score of the match. */
  score: number;
  /** Matches won since the room opened (WINS-01). */
  wins: number;
  /** Words this player found in the current round. */
  found: string[];
}

/** Board and timestamps of a round. */
export interface RoundMeta {
  id: number;
  board: string[][];
  startsAt: number;
  endsAt: number;
  /** Base64url, 16 bytes. */
  salt: string;
}

/** The settings a round's board and solutions depend on. */
export interface RoundOptions {
  size: Settings['size'];
  minLength: Settings['minLength'];
  filterProfanity: boolean;
  pack: Settings['pack'];
}

/** A board prepared for a round that has not started: no id or timestamps yet. */
export interface PreparedBoard {
  board: string[][];
  /** Base64url, 16 bytes. */
  salt: string;
  /** Settings it was prepared for. */
  options: RoundOptions;
}

/** Valid words of a round and their salted hash prefixes, in the same order. */
export interface RoundSolutions {
  words: readonly string[];
  /** `HASH_PREFIX_BYTES` per word, back to back. */
  prefixes: Uint8Array;
}

export interface RoomState {
  code: string;
  tvToken: string;
  /** Id of the open TV connection, null while the TV is away. */
  tvConn: string | null;
  config: RoomConfig;
  phase: Phase;
  settings: Settings;
  /** In joining order. */
  players: Player[];
  hostId: string | null;
  hostOfflineSince: number | null;
  /** The host was offline 30 s with nobody else connected: the first player to connect takes the role. */
  hostHandoffDue: boolean;
  tvOfflineSince: number | null;
  /** Last player or host action; clock sync and heartbeat never touch it. */
  lastActionAt: number;
  /** Players who ever joined; the next player id is `p<joinCount + 1>`. */
  joinCount: number;
  /** 0-based round of the match. */
  roundIndex: number;
  round: RoundMeta | null;
  solutions: RoundSolutions | null;
  /** Prepared before `start`, or while the results show (RES-01 AC 4). */
  nextRound: PreparedBoard | null;
  nextSolutions: RoundSolutions | null;
  /** The host asked for the next round before its board was prepared; it starts when the board arrives. */
  pendingStart: boolean;
  /** Results of the last round, sent again to whoever connects in the results or on the podium. */
  results: RoundResultsMessage | null;
  /** Per player, when each path of the last second was taken in (rate limit); kept in memory only. */
  rateWindow: Record<string, number[]>;
  tvCounts: { dirty: boolean; lastSentAt: number };
  /** The room closed; every later input is ignored. */
  closed: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  size: 4,
  seconds: 120,
  rounds: 1,
  minLength: 3,
  filterProfanity: true,
  pack: 'pt-BR',
  volume: 100,
  muted: false,
};

/**
 * A new room in the lobby with the default settings. The TV has not connected yet,
 * so its absence counts from `now`.
 */
export function createRoom(code: string, tvToken: string, now: number, cfg: RoomConfig): RoomState {
  return {
    code,
    tvToken,
    tvConn: null,
    config: { ...cfg },
    phase: 'lobby',
    settings: { ...DEFAULT_SETTINGS },
    players: [],
    hostId: null,
    hostOfflineSince: null,
    hostHandoffDue: false,
    tvOfflineSince: now,
    lastActionAt: now,
    joinCount: 0,
    roundIndex: 0,
    round: null,
    solutions: null,
    nextRound: null,
    nextSolutions: null,
    pendingStart: false,
    results: null,
    rateWindow: {},
    tvCounts: { dirty: false, lastSentAt: 0 },
    closed: false,
  };
}

const isIntIn = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

/** Allowed values of each option. */
const SETTING_RULES: Record<keyof Settings, (v: unknown) => boolean> = {
  size: (v) => v === 4 || v === 5 || v === 6,
  seconds: (v) => isIntIn(v, 30, 180) && v % 30 === 0,
  rounds: (v) => isIntIn(v, 1, 5),
  minLength: (v) => v === 3 || v === 4,
  filterProfanity: isBool,
  pack: (v) => v === 'pt-BR',
  volume: (v) => isIntIn(v, 0, 100),
  muted: isBool,
};

/**
 * The patch as typed settings, or null (`bad-settings`) when it is empty, names an
 * unknown option, or any value is out of range. A rejected patch changes nothing.
 */
export function validateSettingsPatch(patch: SettingsPatch): Partial<Settings> | null {
  const keys = Object.keys(patch);
  if (keys.length === 0) return null;
  for (const key of keys) {
    if (!Object.hasOwn(SETTING_RULES, key) || !SETTING_RULES[key as keyof Settings](patch[key])) return null;
  }
  return { ...patch } as Partial<Settings>;
}
