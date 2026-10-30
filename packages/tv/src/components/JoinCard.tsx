import type { QrMatrix } from '../model/qr.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/join-card.css';
import { QrCode } from './QrCode.tsx';

/** Props of `JoinCard`. */
export interface JoinCardProps {
  code: string;
  /** The address without the scheme, as a person types it. */
  address: string;
  matrix: QrMatrix;
}

/** How to enter: the QR, the code in large letters and the address to type (TVLOBBY-01 AC 2-3). */
export function JoinCard({ code, address, matrix }: JoinCardProps) {
  return (
    <section class="join-card">
      <h1 class="join-card__title">{STRINGS.joinByPhone}</h1>
      <div class="join-card__qr">
        <QrCode matrix={matrix} withMark />
      </div>
      <p class="join-card__code" data-testid="room-code">
        {code}
      </p>
      <p class="join-card__address" data-testid="room-address">
        {STRINGS.orVisit} <span class="join-card__host">{address}</span> {STRINGS.andTypeCode}
      </p>
    </section>
  );
}
