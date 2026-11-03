import type { RoundResultsMessage } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';
import type { Standings } from './standings.ts';

/** What the result screen says around the scores (TVRES-01 AC 8-10, 13). */
export interface ResultHeader {
  /** The muted word before the title; only between rounds (tv-round-result.png). */
  prefix: string | null;
  title: string;
  /** Null when the room has no host to wait for. */
  footer: string | null;
  confetti: boolean;
}

/**
 * Between rounds, the round and who advances it; after the last, who won and what the host decides (TVRES-01 AC 8-10).
 * A match whose best score is 0 has no winner, as the server counts no win for it: no name and no confetti (TVRES-01 AC 13).
 */
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
  const leaders = top.filter(({ place }) => place === 1);
  const somebodyScored = (leaders[0]?.score ?? 0) > 0;
  return {
    prefix: null,
    title: somebodyScored ? matchTitle(leaders) : STRINGS.nobodyScoredTitle,
    footer: hostName === null ? null : STRINGS.waitingAfterMatch(hostName),
    confetti: somebodyScored,
  };
}

/**
 * What the standings follow: the round between rounds, the match after the last round. The round is in the title, so
 * nothing beside it repeats it (RESULT-02 AC 6-7, AD-029).
 */
export function standingsTitle(results: Pick<RoundResultsMessage, 'index' | 'last'>): string {
  return results.last ? STRINGS.matchStandings : STRINGS.roundStandings(results.index + 1);
}

/** A tie has no one name to show: everyone on it wins (TVRES-01 AC 10, DESIGN §2). */
function matchTitle(winners: Standings['top']): string {
  const [winner] = winners;
  return winner === undefined || winners.length > 1 ? STRINGS.tieTitle : STRINGS.winnerTitle(winner.nickname);
}
