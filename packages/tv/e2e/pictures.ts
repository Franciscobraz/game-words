import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const captures = join(dirname(fileURLToPath(import.meta.url)), '../../../.specs/features/m4-tv/captures');

/** A capture's window: 1920×1080, at the scale that gives the capture's pixel size. */
export function pictureWindow(scale: 1 | 2): { viewport: { width: number; height: number }; deviceScaleFactor: number } {
  return { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale };
}

/** Where the picture of `capture` goes, beside the capture. */
export function picturePath(capture: string): string {
  return join(captures, `${capture}.running.png`);
}
