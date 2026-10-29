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
  /** The session wins; left out where the list shows no score, as the spectator's (phone-spectator.png). */
  wins?: number;
  crowned: boolean;
  tags: readonly PlayerTag[];
  dimmed: boolean;
  /** Makes the row a button, as the host's list where a tap opens the player's actions (HOST-01 AC 10). */
  onSelect?: () => void;
}

/** A player of the lobby: circle, nickname, crown, tags and wins; faded while disconnected (LOBBY-01 AC 2-5). */
export function PlayerRow({ nickname, color, wins, crowned, tags, dimmed, onSelect }: PlayerRowProps) {
  const rowClass = `player-row${dimmed ? ' player-row--dimmed' : ''}`;
  const content = (
    <>
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
      {wins !== undefined && <WinsBadge wins={wins} />}
    </>
  );

  if (onSelect === undefined) return <li class={rowClass}>{content}</li>;
  return (
    <li class="player-row-item">
      <button type="button" class={`${rowClass} player-row--button`} aria-label={STRINGS.playerActions(nickname)} onClick={onSelect}>
        {content}
      </button>
    </li>
  );
}
