import { type QrMatrix, qrPath } from '../model/qr.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/qr-code.css';

/** Props of `QrCode`. */
export interface QrCodeProps {
  matrix: QrMatrix;
  /** Puts the "B" over the center, which the code's error correction H pays for (TVLOBBY-01 AC 2). */
  withMark: boolean;
}

/** A QR code drawn as SVG, dark on the parent's light card, filling that parent (TVLOBBY-01 AC 2). */
export function QrCode({ matrix, withMark }: QrCodeProps) {
  return (
    <div class="qr-code" role="img" aria-label={STRINGS.roomQr} data-testid="room-qr">
      <svg class="qr-code__modules" viewBox={`0 0 ${matrix.length} ${matrix.length}`} shape-rendering="crispEdges" aria-hidden="true">
        <path d={qrPath(matrix)} />
      </svg>
      {withMark && (
        <span class="qr-code__mark" aria-hidden="true">
          {STRINGS.brandMark}
        </span>
      )}
    </div>
  );
}
