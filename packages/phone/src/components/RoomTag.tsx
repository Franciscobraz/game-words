import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/room-tag.css';

/** Props of `RoomTag`. */
export interface RoomTagProps {
  code: string;
}

/** The "SALA KBXT" pill at the top of every room screen (UI-01 AC 6). */
export function RoomTag({ code }: RoomTagProps) {
  return (
    <span class="room-tag">
      <span class="room-tag__label">{STRINGS.roomLabel}</span> <span class="room-tag__code">{code}</span>
    </span>
  );
}
