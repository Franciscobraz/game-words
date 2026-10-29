/** Milliseconds in a second. */
const MS_PER_SECOND = 1_000;

/** Seconds in a minute. */
const SECONDS_PER_MINUTE = 60;

/** With this much time left or less, the timer turns to the alert color (PLAY-01 AC 15). */
export const ALERT_REMAINING_MS = 10_000;

/** The first number of the countdown before the board (COUNT-01 AC 1). */
export const COUNTDOWN_FIRST_NUMBER = 3;

/** A number of the countdown before the board. */
export type CountdownNumber = 1 | 2 | 3;

/**
 * The time left as "MM:SS" ("01:47") (PLAY-01 AC 14). A partial second counts as a
 * whole one, so the timer reads "00:00" only when the time is up; after that it
 * stays at "00:00".
 */
export function formatClock(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / MS_PER_SECOND));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Whether the timer shows the alert color: 10 s left or less (PLAY-01 AC 15). */
export function isAlert(remainingMs: number): boolean {
  return remainingMs <= ALERT_REMAINING_MS;
}

/**
 * The countdown number at `serverNow`: 3, 2 and 1, one per second, then null from
 * `startsAt` on, when the board shows (COUNT-01 AC 1-2).
 */
export function countdownNumber(serverNow: number, startsAt: number): CountdownNumber | null {
  const remainingMs = startsAt - serverNow;
  if (remainingMs <= 0) return null;
  const seconds = Math.min(COUNTDOWN_FIRST_NUMBER, Math.ceil(remainingMs / MS_PER_SECOND));
  return seconds as CountdownNumber;
}

/** Whether the round's time is up at `serverNow`: from `endsAt` on, the board locks and shows "Tempo!" (PLAY-01 AC 20). */
export function isTimeUp(serverNow: number, endsAt: number): boolean {
  return serverNow >= endsAt;
}

/**
 * The share of the round still left at `serverNow`, from 1 at `startsAt` down to 0
 * at `endsAt`, for the spectator's progress bar (SPEC-01 AC 2).
 */
export function remainingShare(serverNow: number, startsAt: number, endsAt: number): number {
  const length = endsAt - startsAt;
  if (length <= 0) return 0;
  const share = (endsAt - serverNow) / length;
  return Math.min(1, Math.max(0, share));
}
