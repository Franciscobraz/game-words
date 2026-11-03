import { STRINGS } from '../strings/pt-BR.ts';

/** The words and points of a player on the result: "14 plvrs · 34 pts", "1 plvr · 1 pt" (RESULT-02 AC 2-4). */
export interface ScoreLabel {
  /** "14 plvrs", or "1 plvr" for one word. */
  words: string;
  /** The number, drawn bigger than its unit. */
  points: string;
  /** "pts", or "pt" for one point. */
  unit: string;
}

/** Singular only at 1; 0 and every other count take the plural (RESULT-02 AC 4). */
export function scoreLabel(words: number, points: number): ScoreLabel {
  return { words: STRINGS.shortWordCount(words), points: String(points), unit: STRINGS.pointsUnit(points) };
}
