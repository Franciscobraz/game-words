import { crownedPlayers, type PlayerInfo } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';

/** Lines in the left column; from the next player on they go to the right (TVPLAY-01 AC 9). */
export const LEFT_COLUMN_PLAYERS = 5;

/** The line of a player during the round: the numbers only, never the words (TVPLAY-01 AC 5). */
export interface RoundPlayerRow {
  id: string;
  nickname: string;
  color: string;
  count: number;
  /** "palavra" or "palavras", under the number (TVPLAY-01 AC 6). */
  wordsLabel: string;
  isHost: boolean;
  crowned: boolean;
  disconnected: boolean;
}

/** The two columns beside the board (tv-round.png). */
export interface RoundColumns {
  left: RoundPlayerRow[];
  right: RoundPlayerRow[];
}

/**
 * Only who plays the round, in joining order, so a line does not jump around while the numbers change:
 * up to 5 on the left and the others on the right (TVPLAY-01 AC 7, 9). The crown still looks at the whole room (WINS-01).
 */
export function roundColumns(players: readonly PlayerInfo[], counts: Readonly<Record<string, number>>, hostId: string | null): RoundColumns {
  const crowned = crownedPlayers(players);
  const rows = players
    .filter((player) => !player.spectator)
    .map((player) => playerRow(player, counts[player.id] ?? 0, player.id === hostId, crowned.includes(player)));
  return { left: rows.slice(0, LEFT_COLUMN_PLAYERS), right: rows.slice(LEFT_COLUMN_PLAYERS) };
}

function playerRow(player: PlayerInfo, count: number, isHost: boolean, crowned: boolean): RoundPlayerRow {
  const { id, nickname, color } = player;
  return { id, nickname, color, count, wordsLabel: STRINGS.wordsLabel(count), isHost, crowned, disconnected: !player.connected };
}
