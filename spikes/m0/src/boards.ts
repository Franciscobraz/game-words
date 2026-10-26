import { mulberry32 } from '@bwords/core';

export const BOARD_SIZE = 6;
/** Seeds shared by the Node and Cloudflare benchmarks. */
export const SOLVE_SEEDS = Array.from({ length: 100 }, (_, i) => i + 1);
export const GENERATE_SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

/** Seeded random 6x6 board: letters by dictionary weight, at most 4 copies, Q only as "qu". */
export function randomBoard(seed: number, weights: Float64Array): string[][] {
  const rng = mulberry32(seed);
  const copies = new Array<number>(26).fill(0);
  const board: string[][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    const row: string[] = [];
    for (let c = 0; c < BOARD_SIZE; c++) {
      let total = 0;
      for (let l = 0; l < 26; l++) if (copies[l]! < 4) total += weights[l]!;
      let x = rng() * total;
      let pick = -1;
      for (let l = 0; l < 26; l++) {
        if (copies[l]! >= 4 || weights[l]! <= 0) continue;
        pick = l;
        x -= weights[l]!;
        if (x < 0) break;
      }
      copies[pick]!++;
      row.push(pick === 16 ? 'qu' : String.fromCharCode(97 + pick));
    }
    board.push(row);
  }
  return board;
}
