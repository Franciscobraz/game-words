import qrcode from 'qrcode-generator';

/** The modules of a QR code, by row; true is dark. */
export type QrMatrix = readonly (readonly boolean[])[];

/** The address a phone opens to join the room: the phone's route on the TV's own origin (TVLOBBY-01 AC 2). */
export function roomUrl(origin: string, code: string): string {
  return `${origin}/${code}`;
}

/** The address as the lobby writes it, without the scheme (TVLOBBY-01 AC 3). */
export function displayAddress(origin: string): string {
  return origin.replace(/^[a-z]+:\/\//, '');
}

/**
 * The QR of `url` with the highest error correction, H, so it still reads with the "B" over its center (TVLOBBY-01 AC 2).
 * The type number 0 lets the library pick the smallest code that fits.
 */
export function qrMatrix(url: string): QrMatrix {
  const code = qrcode(0, 'H');
  code.addData(url);
  code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => code.isDark(row, column)));
}

/** The dark modules as one SVG path, one unit per module: a single element, however large the code. */
export function qrPath(matrix: QrMatrix): string {
  return matrix.flatMap((row, y) => row.flatMap((isDark, x) => (isDark ? [`M${x} ${y}h1v1h-1z`] : []))).join('');
}
