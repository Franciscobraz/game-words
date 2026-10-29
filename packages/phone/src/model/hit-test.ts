/** A point on the screen, in CSS pixels. */
export interface Point {
  x: number;
  y: number;
}

/** Where the board sits on the screen, in CSS pixels, as `getBoundingClientRect` gives it. */
export interface BoardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Radius of a tile's touch zone, as a share of the tile side. The zone is a little
 * smaller than the tile, so a diagonal swipe does not catch the tiles beside it
 * (spec assumption "Zona de toque da peça").
 */
export const HIT_RADIUS_RATIO = 0.35;

/**
 * The row-major index of the tile whose central circle holds `point`, or null when
 * the point is outside the board or between the circles (PLAY-01 AC 2). The circle
 * has a radius of `hitRatio` times the tile side, edge included.
 */
export function tileAtPoint(point: Point, board: BoardRect, size: number, hitRatio: number): number | null {
  const tileWidth = board.width / size;
  const tileHeight = board.height / size;
  const column = Math.floor((point.x - board.left) / tileWidth);
  const row = Math.floor((point.y - board.top) / tileHeight);
  if (column < 0 || column >= size || row < 0 || row >= size) return null;

  const centerX = board.left + (column + 0.5) * tileWidth;
  const centerY = board.top + (row + 0.5) * tileHeight;
  const radius = hitRatio * Math.min(tileWidth, tileHeight);
  const distance = Math.hypot(point.x - centerX, point.y - centerY);
  return distance <= radius ? row * size + column : null;
}
