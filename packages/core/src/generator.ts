import type { LanguagePack } from './pack.ts';
import { type Board, boardTiles } from './solver.ts';
import { boardSolutions } from './validate.ts';

export const MAX_COPIES_PER_LETTER = 4;
export const MAX_ATTEMPTS = 200;
export const MIN_WORDS: Readonly<Record<number, number>> = { 4: 40, 5: 80, 6: 120 };
const MIN_WORD_LENGTH = 3;
/** Shortest profanity, in letters, that the generator keeps out of straight lines. */
export const MIN_STRAIGHT_PROFANITY = 4;
const Q = 16;

export interface GeneratedBoard {
  board: string[][];
  /** Number of boards drawn until one met the minimum, including the accepted one. */
  attempts: number;
  /** Valid words of 3+ letters on the board (profanity excluded while the filter is on). */
  wordCount: number;
  /** Valid common words of 3+ letters on the board (profanity excluded while the filter is on). */
  commonCount: number;
}

export interface GenerateOptions {
  /** Default true. Profanity does not count, and boards with straight-line profanity are redrawn. */
  filterProfanity?: boolean;
  /** Minimum valid common words. Default `pack.meta.minCommonWords[size]`, or 0 when the meta has none. */
  minCommonWords?: number;
}

/** mulberry32: small seeded PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawBoard(size: number, rng: () => number, weights: Float64Array): string[][] {
  const copies = new Array<number>(26).fill(0);
  const board: string[][] = [];
  for (let r = 0; r < size; r++) {
    const row: string[] = [];
    for (let c = 0; c < size; c++) {
      let total = 0;
      for (let l = 0; l < 26; l++) if (copies[l]! < MAX_COPIES_PER_LETTER) total += weights[l]!;
      let x = rng() * total;
      let pick = -1;
      for (let l = 0; l < 26; l++) {
        if (copies[l]! >= MAX_COPIES_PER_LETTER || weights[l]! <= 0) continue;
        pick = l;
        x -= weights[l]!;
        if (x < 0) break;
      }
      if (pick < 0) {
        const eligible = weights.filter((w) => w > 0).length;
        throw new Error(
          `Not enough letters for a ${size}x${size} board: ${eligible} letter(s) with non-zero weight allow at most ${eligible * MAX_COPIES_PER_LETTER} tiles`,
        );
      }
      copies[pick]!++;
      row.push(pick === Q ? 'qu' : String.fromCharCode(97 + pick));
    }
    board.push(row);
  }
  return board;
}

/** Whether a profane word of 4+ letters reads in a straight line (row, column or diagonal, either way). */
export function hasStraightLineProfanity(board: Board, pack: LanguagePack): boolean {
  const tiles = boardTiles(board);
  const n = board.length;
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1],
    [0, -1], [-1, 0], [-1, -1], [-1, 1],
  ] as const;
  for (let start = 0; start < tiles.length; start++) {
    for (const [dr, dc] of directions) {
      let r = Math.floor(start / n);
      let c = start % n;
      let word = '';
      while (r >= 0 && r < n && c >= 0 && c < n) {
        for (const l of tiles[r * n + c]!) word += String.fromCharCode(97 + l);
        if (word.length >= MIN_STRAIGHT_PROFANITY && pack.isProfane(word)) return true;
        r += dr;
        c += dc;
      }
    }
  }
  return false;
}

/**
 * Draws boards with letters weighted by the dictionary header, at most 4 copies per letter
 * and Q only as "qu", until one has the minimum word count for the size and the minimum
 * common word count, and (with the profanity filter on) no straight-line profanity.
 * The same seed, pack and options always give the same board.
 */
export function generateBoard(size: number, seed: number, pack: LanguagePack, options: GenerateOptions = {}): GeneratedBoard {
  const min = MIN_WORDS[size];
  if (min === undefined) throw new Error(`Invalid board size ${size}: expected 4, 5 or 6`);
  const filterProfanity = options.filterProfanity ?? true;
  const minCommon = options.minCommonWords ?? pack.meta.minCommonWords[size] ?? 0;
  const rng = mulberry32(seed);
  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
    const board = drawBoard(size, rng, pack.dict.letterWeights);
    if (filterProfanity && hasStraightLineProfanity(board, pack)) continue;
    const { words, common } = boardSolutions(board, pack, { minLength: MIN_WORD_LENGTH, filterProfanity });
    if (words.size >= min && common.size >= minCommon) {
      return { board, attempts, wordCount: words.size, commonCount: common.size };
    }
  }
  throw new Error(
    `No ${size}x${size} board with ${min}+ words and ${minCommon}+ common words after ${MAX_ATTEMPTS} attempts (seed ${seed})`,
  );
}
