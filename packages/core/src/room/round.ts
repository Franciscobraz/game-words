import { type Effect, type Handler, type PersistKey, roundInfo, type StepResult, unchanged } from './effects.ts';
import { type PreparedRound, preparedFor } from './prepare.ts';
import { encodeHashFrame } from './protocol.ts';
import type { RoomState, RoundMeta } from './state.ts';

/** Countdown before a round opens: the board shows with `startsAt = now + 3000`. */
export const COUNTDOWN_MS = 3000;

/** Whether the current round is the last of the match. */
export function isLastRound(state: RoomState): boolean {
  return state.roundIndex + 1 >= state.settings.rounds;
}

/** Whether a board prepared for the current settings is waiting. */
function hasPrepared(state: RoomState): boolean {
  return state.nextRound !== null && state.nextSolutions !== null && preparedFor(state.nextRound, state.settings);
}

/**
 * Starts the countdown of a round with the prepared board: spectators become
 * players, everyone's round words reset, and every connection gets `round-start`.
 * Outside the results this is the first round of a new match, so every score
 * starts at zero.
 * Only phones get the salt, followed by the binary frame of the hash prefixes;
 * the TV and the guests on the join screen get neither.
 */
export function beginRound(state: RoomState, now: number): StepResult {
  const prepared = state.nextRound!;
  const startsAt = now + COUNTDOWN_MS;
  const round: RoundMeta = {
    id: (state.round?.id ?? 0) + 1,
    board: prepared.board,
    startsAt,
    endsAt: startsAt + state.settings.seconds * 1000,
    salt: prepared.salt,
  };
  const newMatch = state.phase !== 'results';
  const next: RoomState = {
    ...state,
    phase: 'round',
    roundIndex: newMatch ? 0 : state.roundIndex + 1,
    round,
    solutions: state.nextSolutions,
    nextRound: null,
    nextSolutions: null,
    pendingStart: false,
    players: state.players.map((p) => ({ ...p, spectator: false, found: [], score: newMatch ? 0 : p.score })),
    tvCounts: { dirty: false, lastSentAt: 0 },
  };
  const info = roundInfo(next)!;
  const keys: PersistKey[] = ['room', 'round:solutions', 'round:next', ...next.players.map((p) => `found:${p.id}` as const)];
  const effects: Effect[] = [
    { kind: 'persist', keys },
    { kind: 'broadcast', msg: { type: 'round-start', ...info }, roles: ['tv', 'guest'] },
  ];
  const frame = encodeHashFrame(round.id, next.solutions!.prefixes);
  for (const p of next.players) {
    if (p.connId === null) continue;
    const to = { id: p.connId, role: 'player', playerId: p.id } as const;
    effects.push(
      { kind: 'send', to, msg: { type: 'round-start', ...info, salt: round.salt } },
      { kind: 'send-hashes', to, frame },
    );
  }
  return { state: next, effects };
}

/**
 * Starts the round when its board is ready; otherwise remembers the request and
 * asks the adapter for a board (`prepare-next`), and the round starts when the
 * `prepared` input arrives. Used by `start` in the lobby, `next` in the results
 * and `play-again` on the podium.
 */
export function requestRound(state: RoomState, now: number): StepResult {
  if (hasPrepared(state)) return beginRound(state, now);
  return { state: { ...state, pendingStart: true }, effects: [{ kind: 'prepare-next' }] };
}

/** `start` from the host in the lobby (ROUND-01 AC 1). */
export const handleStart: Handler<'start'> = ({ state, now }) => requestRound(state, now);

/**
 * A round the adapter prepared. Kept as the next round while the room is in the
 * lobby or in results with rounds left, and started at once when the host already
 * asked for it (on the podium, through `play-again`). A board prepared for other settings is dropped (and asked for again
 * when the host is waiting); anywhere else the input is stale and ignored.
 */
export function onPrepared(state: RoomState, prepared: PreparedRound, now: number): StepResult {
  const waiting =
    state.phase === 'lobby' ||
    (state.phase === 'results' && !isLastRound(state)) ||
    (state.phase === 'podium' && state.pendingStart);
  if (!waiting) return unchanged(state);
  if (!preparedFor(prepared, state.settings)) {
    return state.pendingStart ? unchanged(state, { kind: 'prepare-next' }) : unchanged(state);
  }
  if (hasPrepared(state) && !state.pendingStart) return unchanged(state);
  const { solutions, ...board } = prepared;
  const stored: RoomState = { ...state, nextRound: board, nextSolutions: solutions };
  if (state.pendingStart) return beginRound(stored, now);
  return { state: stored, effects: [{ kind: 'persist', keys: ['room', 'round:next'] }] };
}
