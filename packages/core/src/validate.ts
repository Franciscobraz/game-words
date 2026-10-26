import type { LanguagePack } from './pack.ts';
import { type Board, boardTiles, solve } from './solver.ts';

export type RejectReason = 'invalid-path' | 'too-short' | 'not-a-word' | 'already-found';

export type SubmissionResult = { ok: true; word: string } | { ok: false; reason: RejectReason };

export interface SubmissionContext {
  /** Solutions of the board, e.g. `boardSolutions(...).words`. */
  solutions: ReadonlySet<string>;
  /** Words the submitting player already has. */
  found: ReadonlySet<string>;
  /** The room's minimum word length, in normalized letters. */
  minLength: number;
  filterProfanity: boolean;
  pack: LanguagePack;
}

export interface SolutionOptions {
  minLength: number;
  filterProfanity: boolean;
}

/** Valid solutions of a board and the common ones among them; with the filter on, profanity is neither. */
export function boardSolutions(
  board: Board,
  pack: LanguagePack,
  { minLength, filterProfanity }: SolutionOptions,
): { words: Set<string>; common: Set<string> } {
  const words = solve(board, pack.dict, minLength);
  if (filterProfanity) for (const w of words) if (pack.isProfane(w)) words.delete(w);
  const common = new Set([...words].filter((w) => pack.isCommon(w)));
  return { words, common };
}

/**
 * Validates a submitted path of row-major tile indices. Checks, in order: the path
 * (2+ distinct, adjacent tiles on the board), the minimum length, the solutions with
 * the current profanity filter, and the player's found words.
 */
export function validateSubmission(board: Board, path: readonly number[], ctx: SubmissionContext): SubmissionResult {
  const tiles = boardTiles(board);
  const n = board.length;
  if (path.length < 2) return { ok: false, reason: 'invalid-path' };
  const seen = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const cell = path[i]!;
    if (!Number.isInteger(cell) || cell < 0 || cell >= tiles.length || seen.has(cell)) {
      return { ok: false, reason: 'invalid-path' };
    }
    if (i > 0) {
      const prev = path[i - 1]!;
      const dr = Math.abs(Math.floor(cell / n) - Math.floor(prev / n));
      const dc = Math.abs((cell % n) - (prev % n));
      if (dr > 1 || dc > 1) return { ok: false, reason: 'invalid-path' };
    }
    seen.add(cell);
  }

  const word = String.fromCharCode(...path.flatMap((cell) => tiles[cell]!.map((l) => l + 97)));
  if (word.length < ctx.minLength) return { ok: false, reason: 'too-short' };
  if (!ctx.solutions.has(word) || (ctx.filterProfanity && ctx.pack.isProfane(word))) {
    return { ok: false, reason: 'not-a-word' };
  }
  if (ctx.found.has(word)) return { ok: false, reason: 'already-found' };
  return { ok: true, word };
}
