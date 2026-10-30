import type { RoundPlayerRow } from '../model/round-columns.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/round-player-card.css';
import { CrownIcon } from './icons.tsx';
import { PlayerCircle } from './PlayerCircle.tsx';

/** Props of `RoundPlayerCard`. */
export interface RoundPlayerCardProps {
  row: RoundPlayerRow;
}

/** A player during the round: the number of words and never which ones; faded while disconnected (TVPLAY-01 AC 5-8). */
export function RoundPlayerCard({ row }: RoundPlayerCardProps) {
  return (
    <div class={row.disconnected ? 'round-player round-player--dimmed' : 'round-player'} data-testid={`round-player-${row.id}`}>
      <PlayerCircle nickname={row.nickname} color={row.color} shape="circle" />
      <div class="round-player__identity">
        <div class="round-player__name-line">
          <span class="round-player__name">{row.nickname}</span>
          {row.crowned && (
            <span class="round-player__crown" role="img" aria-label={STRINGS.crown}>
              <CrownIcon />
            </span>
          )}
        </div>
        {row.isHost && <span class="round-player__tag round-player__tag--host">{STRINGS.hostTag}</span>}
        {row.disconnected && <span class="round-player__tag">{STRINGS.disconnectedTag}</span>}
      </div>
      <div class="round-player__words">
        <span class="round-player__count" style={{ color: row.color }}>
          {row.count}
        </span>
        <span class="round-player__label">{row.wordsLabel}</span>
      </div>
    </div>
  );
}
