import type { StandingRow } from '../model/standings.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/standing-line.css';
import { PlayerCircle } from './PlayerCircle.tsx';

/** Props of `StandingLine`. */
export interface StandingLineProps {
  row: StandingRow;
}

/** A player from the fourth place on: place, circle, nickname and points (TVRES-01 AC 3-4). */
export function StandingLine({ row }: StandingLineProps) {
  return (
    <div class="standing-line" data-testid={`standing-line-${row.id}`}>
      <span class="standing-line__place">{STRINGS.place(row.place)}</span>
      <PlayerCircle nickname={row.nickname} color={row.color} shape="small-circle" />
      <div class="standing-line__identity">
        <span class="standing-line__name">{row.nickname}</span>
        {row.disconnected && <span class="standing-line__note">{STRINGS.disconnectedNote}</span>}
      </div>
      <span class="standing-line__points">{row.score}</span>
      <span class="standing-line__unit">{STRINGS.pointsUnit(row.score)}</span>
    </div>
  );
}
