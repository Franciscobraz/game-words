/** Seconds in a minute, for the "M:SS" round time. */
const SECONDS_PER_MINUTE = 60;

/** The round time as "M:SS" ("2:00"), as the rule chips and the host's stepper show it (LOBBY-01 AC 6, HOST-01 AC 3). */
export function formatRoundTime(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}
