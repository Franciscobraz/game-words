import type { Settings } from '@bwords/core';

/** Seconds in a minute, for the "M:SS" round time. */
const SECONDS_PER_MINUTE = 60;

/** The round times the host steps through with − and +: 30 s to 180 s, 30 s apart (HOST-01 AC 3). */
export const ROUND_SECONDS = [30, 60, 90, 120, 150, 180] as const satisfies readonly Settings['seconds'][];

/** The rounds per match the host steps through with − and +: 1 to 5 (HOST-01 AC 5). */
export const ROUND_COUNTS = [1, 2, 3, 4, 5] as const satisfies readonly Settings['rounds'][];

/** − is -1 and + is 1. */
export type StepDirection = -1 | 1;

/** A setting the host changes with − and +. */
export type SteppedSetting = 'seconds' | 'rounds';

/** The values of each stepped setting, in order. */
const STEPPED_VALUES: Record<SteppedSetting, readonly number[]> = {
  seconds: ROUND_SECONDS,
  rounds: ROUND_COUNTS,
};

/** The round time as "M:SS" ("2:00"), as the rule chips and the host's stepper show it (LOBBY-01 AC 6, HOST-01 AC 3). */
export function formatRoundTime(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

/** The round time 30 s shorter or longer; at 30 s or 180 s it stays where it is (HOST-01 AC 3). */
export function stepSeconds(seconds: Settings['seconds'], direction: StepDirection): Settings['seconds'] {
  return stepWithin(ROUND_SECONDS, seconds, direction);
}

/** One round fewer or more; at 1 or 5 it stays where it is (HOST-01 AC 5). */
export function stepRounds(rounds: Settings['rounds'], direction: StepDirection): Settings['rounds'] {
  return stepWithin(ROUND_COUNTS, rounds, direction);
}

/** Whether − or + still has somewhere to go; false disables the button (HOST-01 AC 4). */
export function canStep(setting: SteppedSetting, value: number, direction: StepDirection): boolean {
  const values = STEPPED_VALUES[setting];
  const index = values.indexOf(value);
  return index !== -1 && values[index + direction] !== undefined;
}

/** The value next to `value` in `values`, or `value` itself at either end. */
function stepWithin<T extends number>(values: readonly T[], value: T, direction: StepDirection): T {
  const index = values.indexOf(value);
  return values[index + direction] ?? value;
}
