import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/wins-badge.css';
import { TrophyIcon } from './icons.tsx';

/** Props of `WinsBadge`. */
export interface WinsBadgeProps {
  wins: number;
}

/** A trophy with the matches won in this room (LOBBY-01 AC 2). */
export function WinsBadge({ wins }: WinsBadgeProps) {
  return (
    <span class="wins-badge" aria-label={STRINGS.winsLabel(wins)}>
      <TrophyIcon />
      <span aria-hidden="true">{wins}</span>
    </span>
  );
}
