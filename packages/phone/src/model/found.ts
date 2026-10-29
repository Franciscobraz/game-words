import type { SubmitResult } from '@bwords/core';
import type { FoundWord } from './room-view.ts';

/** The counter of the top bar: "N pal · N pts" (PLAY-01 AC 14). */
export interface FoundTotals {
  words: number;
  points: number;
}

/** The list with `word` first, shown as valid before the server answers (PLAY-01 AC 7). */
export function addFound(found: readonly FoundWord[], word: string, points: number): FoundWord[] {
  return [{ word, points, confirmed: false }, ...found];
}

// SPEC_DEVIATION: design.md names `reconcileFound(found, results)`.
// Reason: a refusal in `submit-result` carries only the reason, not the word, so the
// function also takes the words of the batch, in the order their paths were sent.
/**
 * The list after the server answers a batch (PLAY-01 AC 13): a word it refused
 * leaves the list, and its points with it. A word the server had already accepted
 * stays. `sentWords[i]` is the word of the path that `results[i]` answers.
 */
export function reconcileFound(
  found: readonly FoundWord[],
  sentWords: readonly string[],
  results: readonly SubmitResult[],
): FoundWord[] {
  const refused = new Set(sentWords.filter((_, i) => results[i]?.ok === false));
  return found.filter((entry) => entry.confirmed || !refused.has(entry.word));
}

/** How many words the phone found and their points (PLAY-01 AC 14). */
export function foundTotals(found: readonly FoundWord[]): FoundTotals {
  const points = found.reduce((sum, entry) => sum + entry.points, 0);
  return { words: found.length, points };
}
