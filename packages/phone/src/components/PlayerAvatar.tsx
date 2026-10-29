import { initialOf } from '../model/nickname.ts';
import '../styles/player-avatar.css';

/** Props of `PlayerAvatar`. */
export interface PlayerAvatarProps {
  nickname: string;
  /** The player's color, from the data (style guide §5.1). */
  color: string;
  size: 'small' | 'medium' | 'large';
}

/** The player's circle in their color with the initial of the nickname, in place of a photo (AD-004). */
export function PlayerAvatar({ nickname, color, size }: PlayerAvatarProps) {
  return (
    <span class={`player-avatar player-avatar--${size}`} style={{ backgroundColor: color }} aria-hidden="true">
      {initialOf(nickname)}
    </span>
  );
}
