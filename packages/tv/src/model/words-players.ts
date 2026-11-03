import type { PlayerInfo, RoundResultsMessage } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';
import { wordRows } from './word-rows.ts';
import type { ScrollMode } from './word-scroll.ts';

/** A card of the "Jogadores" panel beside the words (WORDCTL-01 AC 18-29, tv-words.png). */
export interface WordsPlayerCard {
  id: string;
  nickname: string;
  color: string;
  /** The words of the whole round, from the first instant: "14 palavras", "1 palavra" (WORDCTL-01 AC 18). */
  wordsText: string;
  /** The points added up to the highlighted word. */
  points: number;
  /** "pts", or "pt" for one point. */
  unit: string;
  /** Where the card stands in the panel, from 0 at the top: by points, ties in joining order (WORDCTL-01 AC 24). */
  place: number;
  connected: boolean;
  /** First with points: the brighter card (WORDCTL-01 AC 29). */
  leader: boolean;
  /** First or second with points: the points in the player's color (WORDCTL-01 AC 29). */
  pointsInColor: boolean;
  /** Found the word just highlighted, so the card plays its animation with the "check" (WORDCTL-01 AC 20-21). */
  scored: boolean;
}

/** How far the list has gone: the highlighted word, in list order, and who moves it. */
export interface WordsProgress {
  highlight: number | null;
  mode: ScrollMode;
}

/**
 * The cards of the players of the round, in joining order, each with its place in the panel. Points start at 0 and add
 * each highlighted word to whoever found it; under the host, or once the last word is highlighted, they are the round's
 * points of the result. A player who did not play the round, or whom the room no longer has, gets no card
 * (WORDCTL-01 AC 18-24, 27-29).
 */
export function wordsPlayers(results: RoundResultsMessage, players: readonly PlayerInfo[], progress: WordsProgress): WordsPlayerCard[] {
  const inRound = players.filter((player) => results.players.some((result) => result.playerId === player.id));
  const points = pointsSoFar(results, players, progress);
  const scoredNow = scorersOf(results, players, progress);
  const ranked = [...inRound].sort((a, b) => (points.get(b.id) ?? 0) - (points.get(a.id) ?? 0));
  return inRound.map((player) => {
    const result = results.players.find(({ playerId }) => playerId === player.id);
    const playerPoints = points.get(player.id) ?? 0;
    const place = ranked.indexOf(player);
    return {
      id: player.id,
      nickname: player.nickname,
      color: player.color,
      wordsText: STRINGS.wordCount(result?.roundWords ?? 0),
      points: playerPoints,
      unit: STRINGS.pointsUnit(playerPoints),
      place,
      connected: player.connected,
      leader: place === 0 && playerPoints > 0,
      pointsInColor: place <= 1 && playerPoints > 0,
      scored: scoredNow.has(player.id),
    };
  });
}

/** The points of each player at this point of the list. */
function pointsSoFar(results: RoundResultsMessage, players: readonly PlayerInfo[], { highlight, mode }: WordsProgress): Map<string, number> {
  const words = listedWords(results, players);
  const complete = mode === 'manual' || (highlight !== null && highlight >= words.length - 1);
  if (complete) return new Map(results.players.map(({ playerId, roundPoints }) => [playerId, roundPoints]));
  const points = new Map<string, number>();
  if (highlight === null) return points;
  for (const word of words.slice(0, highlight + 1)) {
    for (const id of word.finderIds) points.set(id, (points.get(id) ?? 0) + word.points);
  }
  return points;
}

/** Who found the word just highlighted; nobody under the host, whose steps play no "check". */
function scorersOf(results: RoundResultsMessage, players: readonly PlayerInfo[], { highlight, mode }: WordsProgress): Set<string> {
  if (mode === 'manual' || highlight === null) return new Set();
  return new Set(listedWords(results, players)[highlight]?.finderIds ?? []);
}

/** The words in the order of the list on the screen, with their points and finders. */
function listedWords(results: RoundResultsMessage, players: readonly PlayerInfo[]): { points: number; finderIds: string[] }[] {
  return wordRows(results, players).flatMap((row) => (row.kind === 'word' ? [{ points: row.points, finderIds: row.finders.map(({ id }) => id) }] : []));
}
