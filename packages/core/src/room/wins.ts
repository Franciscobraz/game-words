/**
 * Session wins (WINS-01): a player wins a match by ending it with the highest
 * accumulated score. The crown goes to every player with the most wins, and to
 * nobody while the most is 0.
 */

/** The players with the most wins, all of them on a tie; none while the most is 0 (WINS-01 AC 6). */
export function crownedPlayers<T extends { wins: number }>(players: readonly T[]): T[] {
  const most = Math.max(0, ...players.map((p) => p.wins));
  return most === 0 ? [] : players.filter((p) => p.wins === most);
}
