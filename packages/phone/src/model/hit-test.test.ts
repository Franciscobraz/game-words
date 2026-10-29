import { describe, expect, test } from 'vitest';
import { HIT_RADIUS_RATIO, tileAtPoint } from './hit-test.ts';

/** A 4x4 board of 400 px at (20, 100): each tile is 100 px, so the hit circle has a 35 px radius. */
const BOARD_4X4 = { left: 20, top: 100, width: 400, height: 400 };
const TILE_SIDE = 100;

/** Center of the tile at `row`, `column` of the 4x4 board. */
function centerOf(row: number, column: number) {
  return { x: BOARD_4X4.left + (column + 0.5) * TILE_SIDE, y: BOARD_4X4.top + (row + 0.5) * TILE_SIDE };
}

describe('tileAtPoint', () => {
  test('counts a touch only inside the central circle', () => {
    // PLAY-01 AC 2: the radius is 35% of the tile side.
    expect(HIT_RADIUS_RATIO).toBe(0.35);
    const radius = HIT_RADIUS_RATIO * TILE_SIDE;
    const center = centerOf(1, 2);

    // At the center and exactly on the circle, the tile counts (L-001).
    expect(tileAtPoint(center, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(6);
    expect(tileAtPoint({ x: center.x + radius, y: center.y }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(6);
    expect(tileAtPoint({ x: center.x, y: center.y - radius }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(6);

    // Just beyond the circle, still on the tile, it does not.
    expect(tileAtPoint({ x: center.x + radius + 0.01, y: center.y }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBeNull();
    expect(tileAtPoint({ x: center.x, y: center.y - radius - 0.01 }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBeNull();
  });

  test('leaves the corners of a tile out, so a diagonal swipe does not catch the side tiles', () => {
    // A point 30 px right and 30 px down is 42.4 px from the center: inside the tile, outside the circle.
    const center = centerOf(0, 0);
    expect(tileAtPoint({ x: center.x + 30, y: center.y + 30 }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBeNull();
    // 24 px right and 24 px down is 33.9 px away: inside the circle.
    expect(tileAtPoint({ x: center.x + 24, y: center.y + 24 }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(0);
  });

  test('numbers tiles row by row on every board size', () => {
    expect(tileAtPoint(centerOf(0, 0), BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(0);
    expect(tileAtPoint(centerOf(0, 3), BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(3);
    expect(tileAtPoint(centerOf(3, 0), BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(12);
    expect(tileAtPoint(centerOf(3, 3), BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBe(15);

    // A 6x6 board of 360 px at the origin has 60 px tiles: row 5, column 4 is tile 34.
    const board6 = { left: 0, top: 0, width: 360, height: 360 };
    expect(tileAtPoint({ x: 270, y: 330 }, board6, 6, HIT_RADIUS_RATIO)).toBe(34);
  });

  test('finds no tile outside the board', () => {
    expect(tileAtPoint({ x: BOARD_4X4.left - 1, y: 150 }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBeNull();
    expect(tileAtPoint({ x: 150, y: BOARD_4X4.top + BOARD_4X4.height + 1 }, BOARD_4X4, 4, HIT_RADIUS_RATIO)).toBeNull();
  });
});
