import { type ResultWord, type RoundResultsMessage, wordPoints } from '@bwords/core';
import type { FoundWord } from './room-view.ts';

/** The personal card of the round result (RES-01 AC 2). */
export interface RoundSummary {
  /** Points scored in this round. */
  roundPoints: number;
  /** Accumulated score of the match after this round. */
  total: number;
  /** 1 for the top total, shared on a tie: "Você está em 1º lugar". */
  place: number;
}

/** A line of "MINHAS PALAVRAS ENCONTRADAS" (RES-01 AC 3-5). */
export interface WordRow {
  /** The normalized word, as the server scores it. */
  word: string;
  /** The real spellings the server sent; empty when the only one is the word itself (DESIGN §5.5). */
  spellings: readonly string[];
  /** Only this player found it ("ÚNICA ×2"), or two or more did ("em comum", AD-008). */
  kind: 'unique' | 'shared';
  /** The points the player earned for it: doubled when unique. */
  points: number;
  /** The word's points before doubling: "base +N". */
  basePoints: number;
}

/**
 * This phone's round points, total and place among the round's players; null for a
 * phone that did not play the round, as a spectator (RES-01 AC 2, 10).
 */
export function myRoundSummary(results: RoundResultsMessage, myId: string | null): RoundSummary | null {
  const mine = results.players.find((line) => line.playerId === myId);
  if (mine === undefined) return null;
  const ahead = results.players.filter((line) => line.score > mine.score).length;
  return { roundPoints: mine.roundPoints, total: mine.score, place: ahead + 1 };
}

/**
 * This phone's words of the round, the highest points first and then in alphabetical
 * order. Unique words come from the server's line of the player, with their doubled
 * points; shared words are the server's shared words this phone found and had
 * accepted, with their simple points (RES-01 AC 3-5, AD-008).
 */
export function myWordRows(found: readonly FoundWord[], results: RoundResultsMessage, myId: string | null): WordRow[] {
  const mine = results.players.find((line) => line.playerId === myId);
  if (mine === undefined) return [];
  const accepted = new Set(found.filter((entry) => entry.confirmed).map((entry) => entry.word));
  const unique = mine.unique.map((word) => wordRow(word, 'unique'));
  const shared = results.shared.filter((word) => accepted.has(word.word)).map((word) => wordRow(word, 'shared'));
  return [...unique, ...shared].sort(byPointsThenWord);
}

/** The word as the result list shows it: upper case, without accents, as normalized ("CORACOES"). */
export function wordLabel(word: string): string {
  return word.toUpperCase();
}

/** The real spellings beside the word, "(faca, faça)"; null when there are none to show (RES-01 AC 3). */
export function spellingsLabel(spellings: readonly string[]): string | null {
  return spellings.length === 0 ? null : `(${spellings.join(', ')})`;
}

function wordRow(word: ResultWord, kind: WordRow['kind']): WordRow {
  return { word: word.word, spellings: word.spellings ?? [], kind, points: word.points, basePoints: wordPoints(word.word) };
}

function byPointsThenWord(a: WordRow, b: WordRow): number {
  if (a.points !== b.points) return b.points - a.points;
  return a.word.localeCompare(b.word);
}
