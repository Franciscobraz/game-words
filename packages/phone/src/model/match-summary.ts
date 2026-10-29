import type { WordRow } from './results.ts';

/** One finished round, as this phone saw it, for the podium summary (AD-007). */
export interface RoundRecord {
  /** 0-based round of the match. */
  index: number;
  /** The player's words of the round, from `myWordRows`. */
  words: readonly WordRow[];
}

/** The longest word of "MAIOR PALAVRA ENCONTRADA" (POD-01 AC 5). */
export interface LongestFound {
  /** The normalized word, shown in tiles without accents. */
  word: string;
  spellings: readonly string[];
  /** The points the player earned for it. */
  points: number;
  /** Letters of the normalized word ("Qu" counts as 2, as in the scoring). */
  letters: number;
}

/** The personal blocks of the podium (POD-01 AC 4-5, AD-007). */
export interface MatchSummary {
  /** "SEU RENDIMENTO": the player's words in every round this phone saw. */
  wordCount: number;
  longest: LongestFound | null;
}

/** The history with `record`, which replaces a round of the same index the phone already had. */
export function addRound(history: readonly RoundRecord[], record: RoundRecord): RoundRecord[] {
  const others = history.filter((kept) => kept.index !== record.index);
  return [...others, record].sort((a, b) => a.index - b.index);
}

/**
 * The player's word count and longest word over the rounds this phone saw; a tie in
 * length goes to the first word in alphabetical order (POD-01 AC 4-6, DESIGN §4.3).
 */
export function matchSummary(history: readonly RoundRecord[]): MatchSummary {
  const words = history.flatMap((record) => record.words);
  let longest: WordRow | null = null;
  for (const candidate of words) {
    if (longest === null || isLonger(candidate.word, longest.word)) longest = candidate;
  }
  return { wordCount: words.length, longest: longest === null ? null : longestOf(longest) };
}

/** Longer, or as long and first in alphabetical order. */
function isLonger(word: string, than: string): boolean {
  if (word.length !== than.length) return word.length > than.length;
  return word < than;
}

function longestOf(row: WordRow): LongestFound {
  return { word: row.word, spellings: row.spellings, points: row.points, letters: row.word.length };
}
