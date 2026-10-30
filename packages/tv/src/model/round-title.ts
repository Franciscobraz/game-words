import { STRINGS } from '../strings/pt-BR.ts';

/** "RODADA N DE M", from the 0-based round of the match (TVPLAY-01 AC 1). */
export function roundTitle(roundIndex: number, rounds: number): string {
  return STRINGS.roundOf(roundIndex + 1, rounds);
}
