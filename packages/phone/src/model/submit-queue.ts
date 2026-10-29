import { RATE_LIMIT_PATHS, RATE_WINDOW_MS } from '@bwords/core';
import type { Path } from './path.ts';

/** How long the phone waits after the last valid swipe before sending, to group paths (PLAY-01 AC 12, M2-Q5). */
export const SUBMIT_DEBOUNCE_MS = 500;

/** In the round's last 3 s every valid swipe goes at once, so none is lost at the end (PLAY-01 AC 12). */
export const SUBMIT_AT_ONCE_MS = 3_000;

/** Paths that go now and paths that wait for the window to free up. */
export interface Batch {
  batch: Path[];
  rest: Path[];
}

/** The wait before sending the paths queued at `now`: 500 ms, or 0 with 3 s or less to `endsAt` (PLAY-01 AC 12). */
export function submitDelay(now: number, endsAt: number): number {
  const remainingMs = endsAt - now;
  return remainingMs <= SUBMIT_AT_ONCE_MS ? 0 : SUBMIT_DEBOUNCE_MS;
}

/**
 * Splits the waiting paths so the next `submit` never passes the server's limit
 * of 10 paths in any 1 s window (ROUND-01 AC 6): a path over it would come back
 * `rate-limited` and the phone would lose a word it showed as valid.
 */
export function takeBatch(pending: readonly Path[], sentInWindow: number): Batch {
  const room = Math.max(0, RATE_LIMIT_PATHS - sentInWindow);
  return { batch: pending.slice(0, room), rest: pending.slice(room) };
}

/** The send times, one per path, still inside the 1 s window at `now`, counted as the server counts them. */
export function recentSends(sentAt: readonly number[], now: number): number[] {
  return sentAt.filter((time) => now - time < RATE_WINDOW_MS);
}

/** Milliseconds until the oldest send in the window leaves it; 0 when the window is empty. */
export function windowFreesIn(sentAt: readonly number[], now: number): number {
  const recent = recentSends(sentAt, now);
  if (recent.length === 0) return 0;
  return Math.min(...recent) + RATE_WINDOW_MS - now;
}

/** A swiped word the phone showed as valid, with its path and points. */
export interface QueuedWord {
  path: Path;
  word: string;
  points: number;
}

/**
 * The words to send again after a reconnect (RECON-01 AC 3, PLAY-01 AC 12): those
 * the phone queued or sent before the drop and that the `welcome` does not list as
 * accepted, once each, oldest first. The `welcome` only carries what the server
 * took, so without this a word shown as valid would vanish without being judged.
 */
export function stillUnsent(queued: readonly QueuedWord[], accepted: readonly string[]): QueuedWord[] {
  const seen = new Set(accepted);
  const missing: QueuedWord[] = [];
  for (const entry of queued) {
    if (seen.has(entry.word)) continue;
    seen.add(entry.word);
    missing.push(entry);
  }
  return missing;
}
