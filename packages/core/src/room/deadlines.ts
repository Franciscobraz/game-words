import { countsDeadline, flushCounts } from './counts.ts';
import { playersMessage, type RoomDeps, type StepResult } from './effects.ts';
import { closeRoom } from './flow.ts';
import { endRound } from './results.ts';
import type { RoomState } from './state.ts';
import { LATE_GRACE_MS } from './submit.ts';

/** How long the host may stay offline before the role moves on (HOST-01 AC 5). */
export const HOST_HANDOFF_MS = 30_000;

const MINUTE_MS = 60_000;

/** No player or host action for `config.idleMin` minutes closes the room; 0 turns it off. */
function idleDeadline(state: RoomState): number | null {
  return state.config.idleMin > 0 ? state.lastActionAt + state.config.idleMin * MINUTE_MS : null;
}

/** The TV away for `config.tvGoneMin` minutes closes the room; 0 turns it off. */
function tvGoneDeadline(state: RoomState): number | null {
  if (state.config.tvGoneMin <= 0 || state.tvOfflineSince === null) return null;
  return state.tvOfflineSince + state.config.tvGoneMin * MINUTE_MS;
}

/** The round ends at `endsAt + 300 ms`, TV or not (ROUND-01 AC 8, RECON-01 AC 5). */
function roundEndDeadline(state: RoomState): number | null {
  return state.phase === 'round' && state.round !== null ? state.round.endsAt + LATE_GRACE_MS : null;
}

function hostDeadline(state: RoomState): number | null {
  if (state.hostId === null || state.hostOfflineSince === null || state.hostHandoffDue) return null;
  return state.hostOfflineSince + HOST_HANDOFF_MS;
}

/**
 * The next time the room needs an `alarm`: the earliest of the round end, the
 * host handoff, the TV counts flush, the idle timeout and the TV timeout. Null
 * when nothing is pending; the adapter then deletes the alarm.
 */
export function nextDeadline(state: RoomState): number | null {
  if (state.closed) return null;
  const all = [roundEndDeadline(state), hostDeadline(state), countsDeadline(state), idleDeadline(state), tvGoneDeadline(state)];
  const due = all.filter((d): d is number => d !== null);
  return due.length > 0 ? Math.min(...due) : null;
}

const isDue = (deadline: number | null, now: number) => deadline !== null && now >= deadline;

/**
 * Hands the host role to the next connected player after the host in joining
 * order, wrapping around. With nobody connected the host keeps the role until the
 * first player connects.
 */
function handOverHost(state: RoomState): StepResult {
  const at = state.players.findIndex((p) => p.id === state.hostId);
  const order = [...state.players.slice(at + 1), ...state.players.slice(0, at)];
  const heir = order.find((p) => p.connected);
  if (!heir) {
    return { state: { ...state, hostOfflineSince: null, hostHandoffDue: true }, effects: [{ kind: 'persist', keys: ['room'] }] };
  }
  const next: RoomState = { ...state, hostId: heir.id, hostOfflineSince: null };
  return {
    state: next,
    effects: [
      { kind: 'persist', keys: ['room'] },
      { kind: 'broadcast', msg: playersMessage(next) },
    ],
  };
}

/**
 * The `alarm` input: runs whatever is due at `now`. Expiry closes the room (idle
 * first, then TV gone); otherwise the round ends or the TV counts flush, and the
 * host role moves on. Nothing due changes nothing.
 */
export function onAlarm(state: RoomState, now: number, deps: RoomDeps): StepResult {
  if (isDue(idleDeadline(state), now)) return closeRoom(state, 'idle');
  if (isDue(tvGoneDeadline(state), now)) return closeRoom(state, 'tv-gone');
  let result = isDue(roundEndDeadline(state), now) ? endRound(state, now, deps) : flushCounts(state, now);
  if (isDue(hostDeadline(result.state), now)) {
    const host = handOverHost(result.state);
    result = { state: host.state, effects: [...result.effects, ...host.effects] };
  }
  return result;
}
