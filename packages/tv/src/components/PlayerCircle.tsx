import { initialOf } from '../model/nickname.ts';
import '../styles/player-circle.css';

/** Props of `PlayerCircle`. */
export interface PlayerCircleProps {
  nickname: string;
  /** The player's color, from the data (style guide §5.1). */
  color: string;
  /** The lobby draws a rounded square, the round a circle, and the lists a small circle (tv-lobby.png, tv-round.png, tv-words.png). */
  shape: 'square' | 'circle' | 'small-circle';
}

/** The player's mark in their color with the initial of the nickname, in place of a photo (AD-004). */
export function PlayerCircle({ nickname, color, shape }: PlayerCircleProps) {
  return (
    <span class={`player-circle player-circle--${shape}`} style={{ backgroundColor: color }} aria-hidden="true">
      {initialOf(nickname)}
    </span>
  );
}
