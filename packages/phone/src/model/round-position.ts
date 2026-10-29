import type { RoundInfo, Settings } from '@bwords/core';

/** Which round of the match is on: 1-based, out of the match's rounds ("RODADA 1 DE 3", "Rodada 1/3"). */
export interface RoundPosition {
  round: number;
  total: number;
}

/**
 * The 1-based round and the match's total, from the server's 0-based index
 * (COUNT-01 AC 1, PLAY-01 AC 14); null before the round or the settings arrive.
 */
export function roundPosition(round: RoundInfo | null, settings: Settings | null): RoundPosition | null {
  if (round === null || settings === null) return null;
  return { round: round.index + 1, total: settings.rounds };
}
