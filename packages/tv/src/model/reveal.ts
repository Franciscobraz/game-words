import type { Phase, RoundResultsMessage } from '@bwords/core';

/** Where the TV is after the end of a round: "Tempo!", then the words until the host shows the result (WORDCTL-01 AC 9). */
export type RevealStage = 'time-up' | 'words' | 'result';

/** The phases that come after a round. */
export type RevealPhase = Extract<Phase, 'words' | 'results' | 'podium'>;

/** The instants of the stages after a round; a function of the clock, so a reload or a fake clock need no timers. */
export interface RevealPlan {
  /** When the list starts: `max(arrival of the results, endsAt + TIME_UP_MS)`. */
  wordsStartAt: number;
  /** When this TV saw the result open, on the server clock; null while the room is on the words. */
  resultShownAt: number | null;
}

/** How long "Tempo!" stays on the screen (TVPLAY-01 AC 10). */
export const TIME_UP_MS = 2_000;

/** Every word found in the round: the shared ones and each player's unique ones (TVWORDS-01 AC 2). */
export function foundWordCount(results: RoundResultsMessage): number {
  return results.players.reduce((total, player) => total + player.unique.length, results.shared.length);
}

/**
 * The plan of a round whose results arrived at `arrivedAt`. A late message delays the list, and it never cuts "Tempo!"
 * short. `endsAt` is null when the TV connected without the round: there is no "Tempo!" to wait for (TVWORDS-01 AC 1, 11).
 */
export function revealPlan(endsAt: number | null, arrivedAt: number): RevealPlan {
  const timeUpEndsAt = endsAt === null ? arrivedAt : endsAt + TIME_UP_MS;
  return { wordsStartAt: Math.max(arrivedAt, timeUpEndsAt), resultShownAt: null };
}

/**
 * The stage at `now`. The words stay on the screen for as long as the room is on them: only the host's "Ver resultado",
 * which moves the room to `results` or `podium`, opens the result (TVPLAY-01 AC 10, WORDCTL-01 AC 3, 9).
 */
export function revealStage(now: number, plan: RevealPlan, phase: RevealPhase): RevealStage {
  if (phase !== 'words') return 'result';
  return now < plan.wordsStartAt ? 'time-up' : 'words';
}
