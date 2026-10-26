import type { LanguagePack } from './pack.ts';

export interface LongestWord<P> {
  word: string;
  /** Whether the word came from the common words (false when the board had none). */
  common: boolean;
  /** Players who found the word, in the order of `found`. */
  foundBy: P[];
}

/**
 * The board's longest word: the longest common valid solution, or the longest valid
 * solution when there is no common one. Ties go to a word some player found, then to
 * the first in alphabetical order. With the filter on, profanity is never a candidate.
 * Returns null when there is no valid solution.
 */
export function pickLongestWord<P>(
  solutions: Iterable<string>,
  pack: LanguagePack,
  found: ReadonlyMap<P, ReadonlySet<string>>,
  filterProfanity: boolean,
): LongestWord<P> | null {
  const valid = [...solutions].filter((w) => !(filterProfanity && pack.isProfane(w)));
  const common = valid.filter((w) => pack.isCommon(w));
  const pool = common.length > 0 ? common : valid;
  const wasFound = (w: string) => [...found.values()].some((words) => words.has(w));

  let best: string | null = null;
  let bestFound = false;
  for (const w of pool) {
    const f = wasFound(w);
    if (
      best === null ||
      w.length > best.length ||
      (w.length === best.length && ((f && !bestFound) || (f === bestFound && w < best)))
    ) {
      best = w;
      bestFound = f;
    }
  }
  if (best === null) return null;
  const word = best;
  return {
    word,
    common: common.length > 0,
    foundBy: [...found].filter(([, words]) => words.has(word)).map(([player]) => player),
  };
}
