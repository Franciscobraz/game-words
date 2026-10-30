import type { RoundResultsMessage } from '@bwords/core';

/** Where the TV is after the end of a round; only the TV knows this, the server does not (design: RevealStage). */
export type RevealStage = 'time-up' | 'words' | 'hold' | 'result';

/** The instants of the stages after a round; a function of the clock, so a reload or a fake clock need no timers. */
export interface RevealPlan {
  /** When the scroll starts: `max(arrival of the results, endsAt + TIME_UP_MS)`. */
  wordsStartAt: number;
  scrollMs: number;
}

/** How long "Tempo!" stays on the screen (TVPLAY-01 AC 10). */
export const TIME_UP_MS = 2_000;

/** The speed of the scroll (TVWORDS-01 AC 6). */
export const WORDS_PER_SECOND = 2;

/** The longest scroll; a longer list goes faster (TVWORDS-01 AC 7). */
export const MAX_SCROLL_MS = 60_000;

/** The wait with the last word in view, or with "Nenhuma palavra encontrada" (TVWORDS-01 AC 8-9). */
export const HOLD_AFTER_LAST_MS = 5_000;

/** How long the list of `wordCount` words scrolls (TVWORDS-01 AC 6-7). */
export function scrollDurationMs(wordCount: number): number {
  return Math.min((wordCount / WORDS_PER_SECOND) * 1_000, MAX_SCROLL_MS);
}

/** Every word found in the round: the shared ones and each player's unique ones (TVWORDS-01 AC 2). */
export function foundWordCount(results: RoundResultsMessage): number {
  return results.players.reduce((total, player) => total + player.unique.length, results.shared.length);
}

/**
 * The plan of a round whose results arrived at `arrivedAt`. A late message delays the scroll, and it never cuts "Tempo!"
 * short. `endsAt` is null when the TV connected without the round: there is no "Tempo!" to wait for (TVWORDS-01 AC 1, 11).
 */
export function revealPlan(results: RoundResultsMessage, endsAt: number | null, arrivedAt: number): RevealPlan {
  const timeUpEndsAt = endsAt === null ? arrivedAt : endsAt + TIME_UP_MS;
  return { wordsStartAt: Math.max(arrivedAt, timeUpEndsAt), scrollMs: scrollDurationMs(foundWordCount(results)) };
}

/** The stage at `now` (TVPLAY-01 AC 10, TVWORDS-01 AC 1, 8-9). */
export function revealStage(now: number, plan: RevealPlan): RevealStage {
  if (now < plan.wordsStartAt) return 'time-up';
  if (now < plan.wordsStartAt + plan.scrollMs) return 'words';
  return now < resultStartAt(plan) ? 'hold' : 'result';
}

/** When the result screen opens; the lit tiles count from here (TVRES-01 AC 5). */
export function resultStartAt(plan: RevealPlan): number {
  return plan.wordsStartAt + plan.scrollMs + HOLD_AFTER_LAST_MS;
}
