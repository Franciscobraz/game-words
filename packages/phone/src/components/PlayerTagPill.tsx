import type { PlayerTag } from '../model/players.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/player-tag.css';

/** The text of each tag (LOBBY-01 AC 3-5, AD-013). */
const TAG_TEXTS: Record<PlayerTag, string> = {
  host: STRINGS.hostTag,
  you: STRINGS.youTag,
  disconnected: STRINGS.disconnectedTag,
  spectator: STRINGS.spectatorTag,
};

/** Props of `PlayerTagPill`. */
export interface PlayerTagPillProps {
  tag: PlayerTag;
}

/** "ANFITRIÃO(Ã)", "VOCÊ", "DESCONECTADO" or "ESPECTADOR(A)" next to a nickname. */
export function PlayerTagPill({ tag }: PlayerTagPillProps) {
  return <span class={`player-tag player-tag--${tag}`}>{TAG_TEXTS[tag]}</span>;
}
