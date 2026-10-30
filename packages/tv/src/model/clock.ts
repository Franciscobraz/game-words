const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;

/** From this much time left, the timer turns to the alert color and pulses (TVPLAY-01 AC 4). */
export const ALERT_REMAINING_MS = 10_000;

/** The first number of the countdown before the board (TVPLAY-01 AC 1). */
export const COUNTDOWN_FIRST_NUMBER = 3;

/** A number of the countdown before the board. */
export type CountdownNumber = 1 | 2 | 3;

/**
 * The time left as "M:SS" ("1:44") (TVPLAY-01 AC 3). A partial second counts as a whole one,
 * so the timer reads "0:00" only when the time is up, and it stays there afterwards.
 */
export function formatClock(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / MS_PER_SECOND));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Whether the timer is in the alert color: 10 s left or less (TVPLAY-01 AC 4). */
export function isAlert(remainingMs: number): boolean {
  return remainingMs <= ALERT_REMAINING_MS;
}

/**
 * The countdown number at `serverNow`: 3, 2 and 1, one per second, then null from `startsAt` on,
 * when the board shows (TVPLAY-01 AC 1-2). A TV that comes back in the middle sees the right number.
 */
export function countdownNumber(serverNow: number, startsAt: number): CountdownNumber | null {
  const remainingMs = startsAt - serverNow;
  if (remainingMs <= 0) return null;
  return Math.min(COUNTDOWN_FIRST_NUMBER, Math.ceil(remainingMs / MS_PER_SECOND)) as CountdownNumber;
}

/** Whether the round's time is up at `serverNow`: from `endsAt` on, "Tempo!" covers the board (TVPLAY-01 AC 10). */
export function isTimeUp(serverNow: number, endsAt: number): boolean {
  return serverNow >= endsAt;
}
