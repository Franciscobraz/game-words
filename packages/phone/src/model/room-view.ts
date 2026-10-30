import {
  type CloseReason,
  type ErrorCode,
  HASH_PREFIX_BYTES,
  type HashFrame,
  type Phase,
  type PlayerInfo,
  type PodiumEntry,
  type RoundInfo,
  type RoundResultsMessage,
  type RoundStartMessage,
  type ServerMessage,
  type Settings,
  type SubmitResult,
  type WelcomeMessage,
  wordPoints,
} from '@bwords/core';

/** A word this phone found in the current round. */
export interface FoundWord {
  word: string;
  points: number;
  /** True once the server accepted it, in a `submit-result` or a `welcome`. */
  confirmed: boolean;
}

/** Everything the phone knows about the room, built only from server messages (ENTRY-01, RECON-01). */
export interface RoomView {
  code: string | null;
  phase: Phase | null;
  settings: Settings | null;
  players: PlayerInfo[];
  hostId: string | null;
  myId: string | null;
  round: RoundInfo | null;
  salt: Uint8Array | null;
  /** Prefixes of the round's valid words, as hex strings for set lookup. */
  hashes: ReadonlySet<string>;
  /** Words this phone found this round, newest first. */
  found: FoundWord[];
  results: RoundResultsMessage | null;
  podium: PodiumEntry[] | null;
  joinError: ErrorCode | null;
  closeReason: CloseReason | null;
}

/** The view before the first `welcome`. */
export const INITIAL_VIEW: RoomView = {
  code: null,
  phase: null,
  settings: null,
  players: [],
  hostId: null,
  myId: null,
  round: null,
  salt: null,
  hashes: new Set(),
  found: [],
  results: null,
  podium: null,
  joinError: null,
  closeReason: null,
};

/**
 * Error codes the join and code screens show (JOIN-01 AC 6-10, ENTRY-01 AC 5).
 * Any other code leaves the view as it is: `wrong-phase` and `not-host` wait for
 * the server's next state (Edge Cases), and `bad-token` is handled by the store.
 */
const JOIN_ERRORS: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
  'room-not-found',
  'bad-nickname',
  'nickname-taken',
  'bad-color',
  'color-illegible',
  'color-too-similar',
  'room-full',
]);

/** Folds one server message into the view; the server is authoritative (ENTRY-01, RECON-01 AC 3). */
export function applyServerMessage(view: RoomView, msg: ServerMessage): RoomView {
  switch (msg.type) {
    case 'welcome':
      return viewFromWelcome(msg);
    case 'joined':
      return { ...view, myId: msg.playerId, joinError: null };
    case 'players':
      return { ...view, players: msg.players, hostId: msg.hostId };
    case 'settings':
      return { ...view, settings: msg.settings };
    case 'round-start':
      return startRound(view, msg);
    case 'submit-result':
      return { ...view, found: confirmAccepted(view.found, msg.results) };
    case 'counts':
      return view;
    case 'round-results':
      return { ...view, phase: 'results', results: msg };
    case 'podium':
      return { ...view, phase: 'podium', podium: msg.ranking };
    case 'time':
      return view;
    case 'error':
      return JOIN_ERRORS.has(msg.code) ? { ...view, joinError: msg.code } : view;
    case 'closed':
      return { ...view, closeReason: msg.reason };
    default: {
      const never: never = msg;
      return never;
    }
  }
}

/** Takes the round's hash prefixes; a frame of another round is dropped. */
export function applyHashFrame(view: RoomView, frame: HashFrame): RoomView {
  if (view.round?.id !== frame.roundId) return view;
  return { ...view, hashes: prefixSet(frame.prefixes) };
}

/** A `welcome` rebuilds the view from scratch and recovers the round's words (RECON-01 AC 3). */
function viewFromWelcome(msg: WelcomeMessage): RoomView {
  const base: RoomView = {
    ...INITIAL_VIEW,
    code: msg.code,
    phase: msg.phase,
    settings: msg.settings,
    players: msg.players,
    hostId: msg.hostId,
    round: msg.round,
  };
  if (msg.role === 'tv') return base;
  const recovered = msg.found.map((word) => confirmedWord(word)).reverse();
  return { ...base, myId: msg.playerId, found: recovered, salt: msg.salt === null ? null : decodeBase64Url(msg.salt) };
}

/** A new round: its board and salt, no hashes until the frame arrives, no words yet. */
function startRound(view: RoomView, msg: RoundStartMessage): RoomView {
  const { type: _type, salt, ...round } = msg;
  return {
    ...view,
    phase: 'round',
    round,
    salt: salt === undefined ? null : decodeBase64Url(salt),
    hashes: new Set(),
    found: [],
    results: null,
    podium: null,
  };
}

/** Marks the words the server accepted; one the phone did not list is added, since the server decides. */
function confirmAccepted(found: readonly FoundWord[], results: readonly SubmitResult[]): FoundWord[] {
  let next = [...found];
  for (const result of results) {
    if (!result.ok) continue;
    const listed = next.some((f) => f.word === result.word);
    next = listed
      ? next.map((f) => (f.word === result.word ? { ...f, confirmed: true } : f))
      : [confirmedWord(result.word), ...next];
  }
  return next;
}

function confirmedWord(word: string): FoundWord {
  return { word, points: wordPoints(word), confirmed: true };
}

/** The 6-byte prefixes as hex strings. */
function prefixSet(prefixes: Uint8Array): Set<string> {
  const set = new Set<string>();
  for (let start = 0; start < prefixes.length; start += HASH_PREFIX_BYTES) {
    set.add(toHex(prefixes.subarray(start, start + HASH_PREFIX_BYTES)));
  }
  return set;
}

/** Lower-case hex of the bytes; `model/judge.ts` looks words up with the same form. */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Bytes of a base64url string without padding, as the server sends the salt. */
function decodeBase64Url(text: string): Uint8Array {
  const base64 = text.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
