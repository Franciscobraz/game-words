import { type StepResult, unchanged } from './effects.ts';
import type { ServerMessage } from './protocol.ts';
import type { RoomState } from './state.ts';

/** The TV gets the live counts at most once per this interval (ROUND-01 AC 7, M2-Q6). */
export const COUNTS_INTERVAL_MS = 1000;

/** Words accepted per player in the current round, in joining order; never the words. */
export function countsMessage(state: RoomState): ServerMessage {
  return { type: 'counts', counts: state.players.map((p) => ({ playerId: p.id, count: p.found.length })) };
}

/**
 * When the changed counts may go to the TV: one interval after the last send.
 * Null when nothing changed, the TV is away or no round is running.
 */
export function countsDeadline(state: RoomState): number | null {
  if (state.phase !== 'round' || !state.tvCounts.dirty || state.tvConn === null) return null;
  return state.tvCounts.lastSentAt + COUNTS_INTERVAL_MS;
}

/** Sends the changed counts to the TV when their deadline has come; otherwise changes nothing. */
export function flushCounts(state: RoomState, now: number): StepResult {
  const due = countsDeadline(state);
  if (due === null || now < due) return unchanged(state);
  return {
    state: { ...state, tvCounts: { dirty: false, lastSentAt: now } },
    effects: [{ kind: 'send', to: { id: state.tvConn!, role: 'tv' }, msg: countsMessage(state) }],
  };
}
