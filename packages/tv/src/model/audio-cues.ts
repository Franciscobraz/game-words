import type { Phase, RoundInfo } from '@bwords/core';
import { ALERT_REMAINING_MS } from './clock.ts';

/** Every sound of the TV (design: `device/audio.ts`). */
export type AudioCue = 'round-start' | 'last-seconds' | 'time-up' | 'words-start';

/** What the cues depend on, at one reading of the clock. */
export interface CueMoment {
  /** The server clock. */
  now: number;
  phase: Phase | null;
  round: Pick<RoundInfo, 'startsAt' | 'endsAt'> | null;
  /** When the scroll starts; null when no reveal is running. */
  wordsStartAt: number | null;
}

/**
 * The cues whose instant passed between two readings of the clock, in order (TVAUDIO-01 AC 1, 6). Each instant is
 * crossed once, and a TV that opens or reconnects mid-stage has nothing to cross, so a past cue never plays again.
 * `before` is null on the first reading after a reload. `now` must not go backwards.
 */
export function cuesBetween(before: CueMoment | null, after: CueMoment): AudioCue[] {
  if (before === null) return [];
  const crossed = (instant: number) => before.now < instant && instant <= after.now;
  const cues: AudioCue[] = [];
  if (after.round !== null) {
    const { startsAt, endsAt } = after.round;
    if (after.phase === 'round' && crossed(startsAt)) cues.push('round-start');
    if (after.phase === 'round' && crossed(endsAt - ALERT_REMAINING_MS)) cues.push('last-seconds');
    if (crossed(endsAt)) cues.push('time-up');
  }
  if (after.wordsStartAt !== null && sawTheRoundEnd(before) && crossed(after.wordsStartAt)) cues.push('words-start');
  return cues;
}

/**
 * Whether this TV was there for the reveal. A reload mid-scroll starts the scroll again at the arrival of the results
 * (TVWORDS-01 AC 11), and that restart is a past cue; results that come late to a TV watching the round still get theirs.
 */
function sawTheRoundEnd(before: CueMoment): boolean {
  return before.wordsStartAt !== null || before.phase === 'round';
}
