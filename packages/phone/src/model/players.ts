import { crownedPlayers, type PlayerInfo, type PodiumEntry } from '@bwords/core';

/** A label next to a nickname (LOBBY-01 AC 3-5, AD-013). */
export type PlayerTag = 'host' | 'you' | 'disconnected' | 'spectator';

/** A player of the lobby list (LOBBY-01 AC 2-5). */
export interface LobbyRow {
  id: string;
  nickname: string;
  color: string;
  wins: number;
  /** Next to the nickname of everyone with the most wins; nobody's while the most is 0. */
  crowned: boolean;
  tags: PlayerTag[];
  /** A disconnected player is shown faded. */
  dimmed: boolean;
}

/** A line of the "PLACAR RÁPIDO DA MESA" (RES-01 AC 6). */
export interface ScoreRow {
  id: string;
  nickname: string;
  color: string;
  score: number;
  /** 1 for the top score, shared on a tie; null for a spectator, shown as "Esp.". */
  place: number | null;
}

/** A line of the "CLASSIFICAÇÃO DA MESA" (POD-01 AC 7). */
export interface PodiumRow {
  id: string;
  nickname: string;
  color: string;
  wins: number;
  crowned: boolean;
  /** Spectators show 0 points. */
  score: number;
  /** Shared on a tie; null for a spectator, shown as "Espectador(a)". */
  place: number | null;
  spectator: boolean;
}

/** Where this phone's player finished the match (POD-01 AC 2). */
export interface Placement {
  place: number;
  total: number;
  wins: number;
}

/**
 * The lobby list in joining order with spectators last: crown, tags and faded
 * disconnected players (LOBBY-01 AC 2-5).
 */
export function lobbyRows(players: readonly PlayerInfo[], hostId: string | null, myId: string | null): LobbyRow[] {
  const crowned = crownedIds(players);
  return spectatorsLast(players).map((player) => ({
    id: player.id,
    nickname: player.nickname,
    color: player.color,
    wins: player.wins,
    crowned: crowned.has(player.id),
    tags: tagsOf(player, hostId, myId),
    dimmed: !player.connected,
  }));
}

/**
 * The quick scoreboard of the round result: highest score first, ties in joining
 * order sharing their place, spectators last without a place (RES-01 AC 6).
 */
export function quickScoreboard(players: readonly PlayerInfo[]): ScoreRow[] {
  const playing = players.filter((p) => !p.spectator).sort((a, b) => b.score - a.score);
  const places = placesOf(playing.map((p) => p.score));
  const rows: ScoreRow[] = playing.map((player, index) => ({ ...scoreFields(player), score: player.score, place: places[index]! }));
  const spectators = players.filter((p) => p.spectator).map((player) => ({ ...scoreFields(player), score: player.score, place: null }));
  return [...rows, ...spectators];
}

/**
 * The podium ranking in the server's order, places shared on a tie, and the
 * spectators last with 0 points (POD-01 AC 7).
 */
export function podiumRows(ranking: readonly PodiumEntry[], players: readonly PlayerInfo[]): PodiumRow[] {
  const byId = new Map(players.map((p) => [p.id, p] as const));
  const crowned = crownedIds(players);
  const ranked = ranking.flatMap((entry) => {
    const player = byId.get(entry.playerId);
    return player === undefined ? [] : [{ player, score: entry.score }];
  });
  const playing = ranked.filter(({ player }) => !player.spectator);
  const places = placesOf(playing.map(({ score }) => score));
  const rows: PodiumRow[] = playing.map(({ player, score }, index) => ({
    ...podiumFields(player, crowned),
    score,
    place: places[index]!,
    spectator: false,
  }));
  const spectators: PodiumRow[] = ranked
    .filter(({ player }) => player.spectator)
    .map(({ player }) => ({ ...podiumFields(player, crowned), score: 0, place: null, spectator: true }));
  return [...rows, ...spectators];
}

/** This phone's place, total and session wins on the podium; null for a spectator or a stranger (POD-01 AC 2). */
export function myPlacement(rows: readonly PodiumRow[], myId: string | null): Placement | null {
  const mine = rows.find((row) => row.id === myId);
  if (mine === undefined || mine.place === null) return null;
  return { place: mine.place, total: mine.score, wins: mine.wins };
}

function tagsOf(player: PlayerInfo, hostId: string | null, myId: string | null): PlayerTag[] {
  const tags: PlayerTag[] = [];
  if (player.id === hostId) tags.push('host');
  if (player.id === myId) tags.push('you');
  if (!player.connected) tags.push('disconnected');
  if (player.spectator) tags.push('spectator');
  return tags;
}

function crownedIds(players: readonly PlayerInfo[]): Set<string> {
  return new Set(crownedPlayers(players).map((p) => p.id));
}

/** Players first, spectators after, each group in its original order. */
function spectatorsLast(players: readonly PlayerInfo[]): PlayerInfo[] {
  return [...players.filter((p) => !p.spectator), ...players.filter((p) => p.spectator)];
}

/** Places of scores sorted from the highest: 1 + how many scored more, so a tie shares the place. */
function placesOf(sortedScores: readonly number[]): number[] {
  return sortedScores.map((score) => 1 + sortedScores.filter((other) => other > score).length);
}

function scoreFields(player: PlayerInfo): Pick<ScoreRow, 'id' | 'nickname' | 'color'> {
  return { id: player.id, nickname: player.nickname, color: player.color };
}

function podiumFields(player: PlayerInfo, crowned: ReadonlySet<string>): Pick<PodiumRow, 'id' | 'nickname' | 'color' | 'wins' | 'crowned'> {
  return { id: player.id, nickname: player.nickname, color: player.color, wins: player.wins, crowned: crowned.has(player.id) };
}
