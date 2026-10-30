import { crownedPlayers, MAX_PLAYERS, type PlayerInfo } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';

/** What the right side of a player's line says besides the wins (TVLOBBY-01 AC 5, tv-lobby.png). */
export type PlayerStatus = 'disconnected' | 'spectator';

/** The line of a player in the lobby (TVLOBBY-01 AC 4-6). */
export interface LobbyPlayerSlot {
  kind: 'player';
  id: string;
  nickname: string;
  color: string;
  wins: number;
  isHost: boolean;
  crowned: boolean;
  status: PlayerStatus | null;
  /** "2 vitórias"; null for a player with no wins whose line already has a status (tv-lobby.png). */
  winsText: string | null;
}

/** A free place in the room, "Vaga Livre #N" (TVLOBBY-01 AC 7). */
export interface LobbyFreeSlot {
  kind: 'free';
  number: number;
}

/** One line of the players' panel. */
export type LobbySlot = LobbyPlayerSlot | LobbyFreeSlot;

/** The players' panel of the lobby. */
export interface LobbySlots {
  /** "N / 10" (TVLOBBY-01 AC 4). */
  count: string;
  /** Always `MAX_PLAYERS` lines: the players in joining order, then the free places (TVLOBBY-01 AC 7). */
  slots: LobbySlot[];
}

/** The players' panel: one line per player, with the host's tag and the crowns, and the free places up to the limit. */
export function lobbySlots(players: readonly PlayerInfo[], hostId: string | null): LobbySlots {
  const crowned = crownedPlayers(players);
  const taken = players.map((player) => playerSlot(player, player.id === hostId, crowned.includes(player)));
  const free = Array.from({ length: MAX_PLAYERS - players.length }, (_, index): LobbyFreeSlot => ({
    kind: 'free',
    number: players.length + index + 1,
  }));
  return { count: STRINGS.playerCount(players.length, MAX_PLAYERS), slots: [...taken, ...free] };
}

/** The footer: who the room waits for, or how an empty room gets a host (TVLOBBY-01 AC 9-10). */
export function lobbyFooter(players: readonly PlayerInfo[], hostId: string | null): string {
  const host = players.find((player) => player.id === hostId);
  return host === undefined ? STRINGS.firstJoinerHosts : STRINGS.waitingForHost(host.nickname);
}

function playerSlot(player: PlayerInfo, isHost: boolean, crowned: boolean): LobbyPlayerSlot {
  const { id, nickname, color, wins } = player;
  const status = statusOf(player);
  const winsText = wins === 0 && status !== null ? null : STRINGS.winsCount(wins);
  return { kind: 'player', id, nickname, color, wins, isHost, crowned, status, winsText };
}

/** A disconnected spectator reads as disconnected: that is what the room needs to know first. */
function statusOf(player: PlayerInfo): PlayerStatus | null {
  if (!player.connected) return 'disconnected';
  return player.spectator ? 'spectator' : null;
}
