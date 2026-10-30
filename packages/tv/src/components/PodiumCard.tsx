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

/** One of the first three: nickname, place and accumulated points; no circle, all the same height (TVRES-01 AC 2, 4). */
export function PodiumCard({ row, confetti }: PodiumCardProps) {
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
        <span class="podium-card__points">{row.score}</span>
        <span class="podium-card__unit">{STRINGS.pointsUnit(row.score)}</span>
      </div>
    </div>
  );
}
