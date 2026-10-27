import { validateSubmission } from '../validate.ts';
import { flushCounts } from './counts.ts';
import type { Handler } from './effects.ts';
import type { SubmitResult } from './protocol.ts';
import type { RoomState } from './state.ts';

/** Most paths a player may send in any 1 s window, counting every message (ROUND-01 AC 6). */
export const RATE_LIMIT_PATHS = 10;
export const RATE_WINDOW_MS = 1000;
/** Paths still count this long after `endsAt`, for the network delay (ROUND-01 AC 3-4). */
export const LATE_GRACE_MS = 300;

/** The stored solutions are already filtered, so validation never reads the pack (design: G7). */
const NO_PACK = { isProfane: () => false };

/**
 * `submit` from a player during the round: one result per path, in order, in a
 * single `submit-result` to the sender. Per path: beyond 10 paths in the last
 * second it is `rate-limited` without validation; outside `[startsAt, endsAt + 300]`
 * it is `round-closed`; from a spectator it is `spectator`; otherwise
 * `validateSubmission` decides against the round's stored solutions. New counts
 * go to the TV, throttled by `flushCounts`. Every submit stores `room`, whose
 * `lastActionAt` must survive a rebuild, and an accepted word also stores
 * `found:<id>`. Phones only send paths their hashes accept, so refused submits
 * are rare and their extra write is cheap.
 */
export const handleSubmit: Handler<'submit'> = ({ state, conn, now }, msg) => {
  if (conn.role !== 'player') return { state, effects: [] };
  const player = state.players.find((p) => p.id === conn.playerId)!;
  const { round, solutions } = state;
  const open = round !== null && solutions !== null && now >= round.startsAt && now <= round.endsAt + LATE_GRACE_MS;
  const recent = (state.rateWindow[player.id] ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  const words = new Set(open ? solutions!.words : []);
  const found = new Set(player.found);
  const accepted: string[] = [];

  const results = msg.paths.map((path): SubmitResult => {
    if (recent.length >= RATE_LIMIT_PATHS) return { ok: false, reason: 'rate-limited' };
    recent.push(now);
    if (!open) return { ok: false, reason: 'round-closed' };
    if (player.spectator) return { ok: false, reason: 'spectator' };
    const r = validateSubmission(round!.board, path, {
      solutions: words,
      found,
      minLength: state.settings.minLength,
      filterProfanity: false,
      pack: NO_PACK,
    });
    if (r.ok) {
      found.add(r.word);
      accepted.push(r.word);
    }
    return r;
  });

  const next: RoomState = {
    ...state,
    rateWindow: { ...state.rateWindow, [player.id]: recent },
    players:
      accepted.length > 0
        ? state.players.map((p) => (p.id === player.id ? { ...p, found: [...p.found, ...accepted] } : p))
        : state.players,
    tvCounts: accepted.length > 0 ? { ...state.tvCounts, dirty: true } : state.tvCounts,
  };
  // New counts go to the TV now, or at the flush deadline when one went out less than a second ago.
  const counts = flushCounts(next, now);
  return {
    state: counts.state,
    effects: [
      ...(accepted.length > 0 ? [{ kind: 'persist' as const, keys: [`found:${player.id}` as const] }] : []),
      // `room` carries the `lastActionAt` that `step` sets for this submit (PERSIST-01 AC 1, EXP-01 AC 2).
      { kind: 'persist', keys: ['room'] },
      { kind: 'send', to: conn, msg: { type: 'submit-result', results } },
      ...counts.effects,
    ],
  };
};
