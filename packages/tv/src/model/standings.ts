import { placesOf, type PlayerInfo, type RoundResultsMessage } from '@bwords/core';

/** How many players get a card; the others go on the list (TVRES-01 AC 2-3). */
export const TOP_CARDS = 3;

/** A player on the result screen (TVRES-01 AC 2-4, RESULT-02 AC 2-3). */
export interface StandingRow {
  id: string;
  nickname: string;
  color: string;
  /** The points shown: of the round between rounds, of the match after the last round (RESULT-02 AC 2-3). */
  score: number;
  /** The words shown, counted the same way as `score` (RESULT-02 AC 2-3, 5). */
  words: number;
  place: number;
  disconnected: boolean;
  /** The crown of the leaders; nobody's while everyone is at 0 (tv-round-result.png). */
  crowned: boolean;
}

/** The result's order: the cards on top and the list below. */
export interface Standings {
  top: readonly StandingRow[];
  rest: readonly StandingRow[];
}

/** The words and points one player shows on the result. */
interface Tally {
  words: number;
  points: number;
}

/**
 * Between rounds, the round's words and points, ranked by the round's points; after the last round, the match's sums,
 * ranked by the match's points. Ties keep the joining order and share their place. Who did not play the round goes last,
 * each in the next place after the players: with 0 and 0 between rounds, with their own sums after the last round
 * (RESULT-02 AC 2-3, 5-7, 10).
 */
export function standings(players: readonly PlayerInfo[], results: Pick<RoundResultsMessage, 'players' | 'last'>): Standings {
  const tallyOf = results.last ? matchTally : roundTally(results);
  const inRound = players.filter((player) => playedTheRound(player, results));
  const late = players.filter((player) => !playedTheRound(player, results));
  const ranked = [...inRound].sort((a, b) => tallyOf(b).points - tallyOf(a).points);
  const places = placesOf(ranked.map((player) => tallyOf(player).points));
  const rows = ranked.map((player, index) => standingRow(player, tallyOf(player), places[index]!));
  const lateRows = late.map((player, index) => standingRow(player, tallyOf(player), ranked.length + 1 + index));
  const all = [...rows, ...lateRows];
  return { top: all.slice(0, TOP_CARDS), rest: all.slice(TOP_CARDS) };
}

function playedTheRound(player: PlayerInfo, results: Pick<RoundResultsMessage, 'players'>): boolean {
  return results.players.some(({ playerId }) => playerId === player.id);
}

/** The sums of the match up to this round, which a late joiner also has (RESULT-02 AC 3, 10). */
function matchTally(player: PlayerInfo): Tally {
  return { words: player.words, points: player.score };
}

/** This round's words and points; 0 and 0 for who did not play it (RESULT-02 AC 2, 10). */
function roundTally(results: Pick<RoundResultsMessage, 'players'>): (player: PlayerInfo) => Tally {
  return (player) => {
    const result = results.players.find(({ playerId }) => playerId === player.id);
    return { words: result?.roundWords ?? 0, points: result?.roundPoints ?? 0 };
  };
}

function standingRow(player: PlayerInfo, tally: Tally, place: number): StandingRow {
  const { id, nickname, color } = player;
  const { words, points } = tally;
  return { id, nickname, color, score: points, words, place, disconnected: !player.connected, crowned: place === 1 && points > 0 };
}
