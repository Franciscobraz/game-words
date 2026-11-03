import { scoreLabel } from '../model/score-label.ts';
import type { StandingRow } from '../model/standings.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/standing-line.css';
import { PlayerCircle } from './PlayerCircle.tsx';

/** Props of `StandingLine`. */
export interface StandingLineProps {
  row: StandingRow;
}

/** A player from the fourth place on: place, circle, nickname, words and points (TVRES-01 AC 3-4, RESULT-02 AC 2-3). */
export function StandingLine({ row }: StandingLineProps) {
  const label = scoreLabel(row.words, row.score);
  return (
    <div class="standing-line" data-testid={`standing-line-${row.id}`}>
      <span class="standing-line__place">{STRINGS.place(row.place)}</span>
      <PlayerCircle nickname={row.nickname} color={row.color} shape="small-circle" />
      <div class="standing-line__identity">
        <span class="standing-line__name">{row.nickname}</span>
        {row.disconnected && <span class="standing-line__note">{STRINGS.disconnectedNote}</span>}
      </div>
      <span class="standing-line__words">{label.words}</span>
      <span class="standing-line__separator">·</span>
      <span class="standing-line__points">{label.points}</span>
      <span class="standing-line__unit">{label.unit}</span>
    </div>
  );
}
