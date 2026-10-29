import type { PlayerTag } from '../model/players.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/player-row.css';
import { CrownIcon } from './icons.tsx';
import { PlayerAvatar } from './PlayerAvatar.tsx';
import { PlayerTagPill } from './PlayerTagPill.tsx';
import { WinsBadge } from './WinsBadge.tsx';

/** Props of `PlayerRow`. */
export interface PlayerRowProps {
  nickname: string;
  color: string;
  wins: number;
  crowned: boolean;
  tags: readonly PlayerTag[];
  dimmed: boolean;
}

/** A player of the lobby: circle, nickname, crown, tags and wins; faded while disconnected (LOBBY-01 AC 2-5). */
export function PlayerRow({ nickname, color, wins, crowned, tags, dimmed }: PlayerRowProps) {
  return (
    <li class={`player-row${dimmed ? ' player-row--dimmed' : ''}`}>
      <PlayerAvatar nickname={nickname} color={color} size="small" />
      <span class="player-row__who">
        <span class="player-row__name">{nickname}</span>
        {crowned && (
          <span class="player-row__crown" role="img" aria-label={STRINGS.crown}>
            <CrownIcon />
          </span>
        )}
        {tags.map((tag) => (
          <PlayerTagPill key={tag} tag={tag} />
        ))}
      </span>
      <WinsBadge wins={wins} />
    </li>
  );
}
