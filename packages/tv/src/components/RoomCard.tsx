import type { QrMatrix } from '../model/qr.ts';
import '../styles/room-card.css';
import { QrCode } from './QrCode.tsx';

/** Props of `RoomCard`. */
export interface RoomCardProps {
  /** Null on the words' page, which only shows the code (tv-words.png). */
  label: string | null;
  code: string;
  /** The small QR of the game's screens; the lobby has its own large one (tv-round.png). */
  matrix: QrMatrix | null;
  /** The lobby's card is large and the code sits beside the label; in the game it sits under it (tv-lobby.png, tv-round.png). */
  size: 'large' | 'medium' | 'small' | 'result';
}

/** The card with the room's code at the top of the screen. */
export function RoomCard({ label, code, matrix, size }: RoomCardProps) {
  return (
    <div class={`room-card room-card--${size}`}>
      <div class="room-card__text">
        {label !== null && <span class="room-card__label">{label}</span>}
        <span class="room-card__code">{code}</span>
      </div>
      {matrix !== null && (
        <span class="room-card__qr">
          <QrCode matrix={matrix} withMark={false} />
        </span>
      )}
    </div>
  );
}
