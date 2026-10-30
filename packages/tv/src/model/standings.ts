import { placesOf, type PlayerInfo } from '@bwords/core';

/** How many players get a card; the others go on the list (TVRES-01 AC 2-3). */
export const TOP_CARDS = 3;

/** A player on the result screen (TVRES-01 AC 2-4). */
export interface StandingRow {
  id: string;
  nickname: string;
  color: string;
  score: number;
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

/**
 * The accumulated scores from the highest, ties in joining order and sharing their place. Who joined late, as a spectator,
 * goes last with their points, each in the next place after the players, as on the phone (TVRES-01 AC 2-3).
 */
export function standings(players: readonly PlayerInfo[]): Standings {
  const playing = players.filter((player) => !player.spectator).sort((a, b) => b.score - a.score);
  const places = placesOf(playing.map((player) => player.score));
  const rows = playing.map((player, index) => standingRow(player, places[index]!));
  const lateRows = players.filter((player) => player.spectator).map((player, index) => standingRow(player, playing.length + 1 + index));
  const all = [...rows, ...lateRows];
  return { top: all.slice(0, TOP_CARDS), rest: all.slice(TOP_CARDS) };
}

function standingRow(player: PlayerInfo, place: number): StandingRow {
  const { id, nickname, color, score } = player;
  return { id, nickname, color, score, place, disconnected: !player.connected, crowned: place === 1 && score > 0 };
}
