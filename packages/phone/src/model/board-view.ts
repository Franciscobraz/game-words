import type { Board } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';
import type { Feedback } from './judge.ts';
import type { Path } from './path.ts';
import type { FoundWord } from './room-view.ts';

/** How the word above the board is drawn: the swipe in progress, or the verdict of the last release. */
export type RackTone = 'swiping' | Feedback['kind'];

/** The word above the board (PLAY-01 AC 5-10): one entry per tile, "Qu" in one tile. */
export interface RackContent {
  letters: string[];
  tone: RackTone;
}

/** A chip of "PALAVRAS ENCONTRADAS" (PLAY-01 AC 17). */
export interface FoundChip {
  word: string;
  points: string;
}

/** A point of the path line, as a share of the board side (0 to 1 from the top left). */
export interface LinePoint {
  x: number;
  y: number;
}

/** The tile "qu" reads "Qu"; any other tile is its letter in upper case (PLAY-01 AC 5). */
export function tileLabel(tile: string): string {
  const lower = tile.toLowerCase();
  return lower === 'qu' ? 'Qu' : lower.toUpperCase();
}

/** The labels of the board's tiles, row-major. */
export function boardLabels(board: Board): string[] {
  return board.flat().map(tileLabel);
}

/**
 * The tiles of a normalized word: one per letter, with "qu" in one tile, since Q
 * only appears on the board as Qu (PLAY-01 AC 5).
 */
export function wordLetters(word: string): string[] {
  const letters: string[] = [];
  for (let i = 0; i < word.length; i++) {
    const isQu = word[i] === 'q' && word[i + 1] === 'u';
    letters.push(isQu ? 'Qu' : word[i]!.toUpperCase());
    if (isQu) i++;
  }
  return letters;
}

/**
 * What the rack above the board shows: the tiles under the finger while it swipes,
 * otherwise the word of the feedback on screen, otherwise nothing (PLAY-01 AC 5-6).
 */
export function rackContent(board: Board, path: Path, feedback: Feedback | null): RackContent {
  if (path.length > 0) {
    const labels = boardLabels(board);
    return { letters: path.map((tile) => labels[tile]!), tone: 'swiping' };
  }
  if (feedback !== null) return { letters: wordLetters(feedback.word), tone: feedback.kind };
  return { letters: [], tone: 'swiping' };
}

/** The verdict of a release: "VÁLIDA (+N PTS)", "JÁ ENCONTRADA", "INVÁLIDA" or "MUITO CURTA" (PLAY-01 AC 7-10). */
export function feedbackText(feedback: Feedback): string {
  switch (feedback.kind) {
    case 'valid':
      return STRINGS.validWord(feedback.points);
    case 'already-found':
      return STRINGS.alreadyFound;
    case 'invalid':
      return STRINGS.invalidWord;
    case 'too-short':
      return STRINGS.tooShort;
    default: {
      const never: never = feedback;
      return never;
    }
  }
}

/** The found words as chips, newest first as the list keeps them, in upper case with "+N" points (PLAY-01 AC 17). */
export function foundChips(found: readonly FoundWord[]): FoundChip[] {
  return found.map((entry) => ({ word: entry.word.toUpperCase(), points: STRINGS.plusPoints(entry.points) }));
}

/** The centers of the path's tiles, as shares of the board side, for the line that joins them (PLAY-01 AC 2). */
export function pathLine(path: Path, size: number): LinePoint[] {
  return path.map((tile) => ({ x: ((tile % size) + 0.5) / size, y: (Math.floor(tile / size) + 0.5) / size }));
}
