import { scoreLabel } from '../model/score-label.ts';
import type { StandingRow } from '../model/standings.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/podium-card.css';
import { Confetti } from './Confetti.tsx';
import { CrownIcon } from './icons.tsx';

/** Props of `PodiumCard`. */
export interface PodiumCardProps {
  row: StandingRow;
  confetti: boolean;
}

/** One of the first three: nickname, place, words and points; no circle, all the same height (TVRES-01 AC 4, RESULT-02 AC 2-3). */
export function PodiumCard({ row, confetti }: PodiumCardProps) {
  const label = scoreLabel(row.words, row.score);
  return (
    <div class="podium-card" style={{ borderTopColor: row.color }} data-testid={`podium-card-${row.id}`}>
      {confetti && <Confetti />}
      <div class="podium-card__top">
        <div class="podium-card__identity">
          <span class="podium-card__name">{row.nickname}</span>
          {row.crowned && (
            <span class="podium-card__crown" role="img" aria-label={STRINGS.crown}>
              <CrownIcon />
            </span>
          )}
          {row.disconnected && <span class="podium-card__note">{STRINGS.disconnectedNote}</span>}
        </div>
        <span class="podium-card__place" style={{ color: row.color }}>
          {STRINGS.place(row.place)}
        </span>
      </div>
      <div class="podium-card__score">
        <span class="podium-card__words">{label.words}</span>
        <span class="podium-card__separator">·</span>
        <span class="podium-card__points">{label.points}</span>
        <span class="podium-card__unit">{label.unit}</span>
      </div>
    </div>
  );
}
