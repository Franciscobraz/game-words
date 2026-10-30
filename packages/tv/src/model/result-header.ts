import type { RoundResultsMessage } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';
import type { Standings } from './standings.ts';

/** What the result screen says around the scores (TVRES-01 AC 8-10). */
export interface ResultHeader {
  /** The muted word before the title; only between rounds (tv-round-result.png). */
  prefix: string | null;
  title: string;
  /** Null when the room has no host to wait for. */
  footer: string | null;
  confetti: boolean;
}

/** Between rounds, the round and who advances it; after the last, who won and what the host decides (TVRES-01 AC 8-10). */
export function resultHeader(
  results: Pick<RoundResultsMessage, 'index' | 'last'>,
  { top }: Pick<Standings, 'top'>,
  hostName: string | null,
  rounds: number,
): ResultHeader {
  if (!results.last) {
    return {
      prefix: STRINGS.resultLabel,
      title: STRINGS.roundLabel(results.index + 1, rounds),
      footer: hostName === null ? null : STRINGS.waitingToAdvance(hostName),
      confetti: false,
    };
  }
  return {
    prefix: null,
    title: matchTitle(top.filter(({ place }) => place === 1)),
    footer: hostName === null ? null : STRINGS.waitingAfterMatch(hostName),
    confetti: true,
  };
}

/** A tie has no one name to show: everyone on it wins (TVRES-01 AC 10, DESIGN §2). */
function matchTitle(winners: Standings['top']): string {
  const [winner] = winners;
  return winner === undefined || winners.length > 1 ? STRINGS.tieTitle : STRINGS.winnerTitle(winner.nickname);
}
