import type { Dawg } from './dawg.ts';
import { solve } from './solver.ts';

export const MAX_COPIES_PER_LETTER = 4;
export const MAX_ATTEMPTS = 200;
export const MIN_WORDS: Readonly<Record<number, number>> = { 4: 40, 5: 80, 6: 120 };
const MIN_WORD_LENGTH = 3;
const Q = 16;

export interface GeneratedBoard {
  board: string[][];
  /** Number of boards drawn until one met the minimum, including the accepted one. */
  attempts: number;
  /** Words of 3+ letters the solver finds on the board. */
  wordCount: number;
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

/**
 * Draws boards with letters weighted by the dictionary header, at most 4 copies per letter
 * and Q only as "qu", until the solver finds the minimum word count for the size.
 * The same seed and dictionary always give the same board.
 */
export function generateBoard(size: number, seed: number, dawg: Dawg): GeneratedBoard {
  const min = MIN_WORDS[size];
  if (min === undefined) throw new Error(`Invalid board size ${size}: expected 4, 5 or 6`);
  const rng = mulberry32(seed);
  for (let attempts = 1; attempts <= MAX_ATTEMPTS; attempts++) {
    const board = drawBoard(size, rng, dawg.letterWeights);
    const wordCount = solve(board, dawg, MIN_WORD_LENGTH).size;
    if (wordCount >= min) return { board, attempts, wordCount };
  }
  throw new Error(`No ${size}x${size} board with ${min}+ words after ${MAX_ATTEMPTS} attempts (seed ${seed})`);
}
