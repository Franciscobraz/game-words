import type { RoundSummary } from '../model/results.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/round-score-card.css';
import { CelebrationIcon } from './icons.tsx';

/** Props of `RoundScoreCard`. */
export interface RoundScoreCardProps {
  summary: RoundSummary;
}

/**
 * "DESEMPENHO DA RODADA": the round's points, a badge with the place ("1º") in place
 * of the capture's crown, the accumulated score and "Você está em Nº lugar" (RES-01 AC 2, AD-012).
 */
export function RoundScoreCard({ summary }: RoundScoreCardProps) {
  return (
    <section class="round-score" aria-label={STRINGS.roundPerformance}>
      <div class="round-score__head">
        <div class="round-score__gain">
          <h2 class="round-score__title">
            <CelebrationIcon />
            {STRINGS.roundPerformance}
          </h2>
          <p class="round-score__points">{STRINGS.gainedPoints(summary.roundPoints)}</p>
          <p class="round-score__added">{STRINGS.addedThisRound}</p>
        </div>
        <span class="round-score__badge" role="img" aria-label={STRINGS.placeBadge(summary.place)}>
          {STRINGS.ordinal(summary.place)}
        </span>
      </div>
      <div class="round-score__total">
        <p class="round-score__total-label">
          {STRINGS.accumulatedScore}
          <span class="round-score__total-value">{STRINGS.points(summary.total)}</span>
        </p>
        <p class="round-score__place">{STRINGS.yourPlace(summary.place)}</p>
      </div>
    </section>
  );
}
