/**
 * Board calibration (CAL-01).
 *
 * For each board size, draws CALIBRATION_BOARDS boards with the fixed seeds CALIBRATION_SEED + i
 * (i = 0..999) and counts the valid common words of 3+ letters on each. The size's minimum is the 10th
 * percentile of those counts, by the nearest-rank method: sort the counts ascending and take the value at
 * rank ceil(0.10 * n), the 100th of 1,000. Fewer than 10% of the boards fall strictly below it, so the
 * generator rejects at most the poorest 10%. The median is the same method at 50% (rank 500, the lower
 * median), so every reported number is a real board's count.
 *
 * The boards are drawn with `generateBoard` and no common-word minimum (it is what is being computed),
 * so the generator's total-word minimums (40/80/120) still apply as before. The profanity filter is off:
 * the pt-BR list is empty, so it changes nothing today.
 */
import { BOARD_SIZES, type LanguagePack, generateBoard } from '@bwords/core';

export const CALIBRATION_BOARDS = 1000;
export const CALIBRATION_SEED = 20261026;
export const CALIBRATION_PERCENTILE = 10;
const MIN_LENGTH = 3;

export interface SizeCalibration {
  min: number;
  median: number;
  max: number;
  /** The 10th percentile: the minimum valid common words for this size. */
  minCommonWords: number;
}

export interface Calibration {
  boards: number;
  seeds: { first: number; last: number };
  percentile: string;
  minLength: number;
  sizes: Record<number, SizeCalibration>;
}

/** Nearest-rank percentile of an ascending list. */
export function nearestRank(sorted: readonly number[], p: number): number {
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)]!;
}

/** Draws the seeded boards of each size and returns the minimum and distribution of common words. */
export function calibrate(pack: LanguagePack): Calibration {
  const sizes: Record<number, SizeCalibration> = {};
  for (const size of BOARD_SIZES) {
    const counts: number[] = [];
    for (let i = 0; i < CALIBRATION_BOARDS; i++) {
      const { commonCount } = generateBoard(size, CALIBRATION_SEED + i, pack, { minCommonWords: 0, filterProfanity: false });
      counts.push(commonCount);
    }
    counts.sort((a, b) => a - b);
    sizes[size] = {
      min: counts[0]!,
      median: nearestRank(counts, 50),
      max: counts[counts.length - 1]!,
      minCommonWords: nearestRank(counts, CALIBRATION_PERCENTILE),
    };
  }
  return {
    boards: CALIBRATION_BOARDS,
    seeds: { first: CALIBRATION_SEED, last: CALIBRATION_SEED + CALIBRATION_BOARDS - 1 },
    percentile: `nearest-rank P${CALIBRATION_PERCENTILE}`,
    minLength: MIN_LENGTH,
    sizes,
  };
}
