/** The time between one tile lighting and the next (TVRES-01 AC 5). */
export const TILE_LIGHT_MS = 400;

/** The tiles of `path` lit `elapsedMs` after the screen opened: the first at once, and one more every `TILE_LIGHT_MS` (TVRES-01 AC 5). */
export function litTiles(path: readonly number[], elapsedMs: number): readonly number[] {
  if (elapsedMs < 0) return [];
  return path.slice(0, 1 + Math.floor(elapsedMs / TILE_LIGHT_MS));
}
