import { describe, expect, test } from 'vitest';
import { extendPath, isNeighbor, wordOfPath } from './path.ts';

/**
 * Tiles are row-major: on a 4x4 board, tile 5 is row 1, column 1, and its eight
 * neighbors are 0, 1, 2 (above), 4, 6 (beside) and 8, 9, 10 (below).
 */
const CENTER_4X4 = 5;
const NEIGHBORS_OF_5_IN_4X4 = [0, 1, 2, 4, 6, 8, 9, 10];

/** On a 6x6 board, tile 14 is row 2, column 2. */
const CENTER_6X6 = 14;
const NEIGHBORS_OF_14_IN_6X6 = [7, 8, 9, 13, 15, 19, 20, 21];

describe('isNeighbor', () => {
  test('accepts the eight directions around a tile in 4x4 and 6x6', () => {
    for (const tile of NEIGHBORS_OF_5_IN_4X4) expect(isNeighbor(4, CENTER_4X4, tile)).toBe(true);
    for (const tile of NEIGHBORS_OF_14_IN_6X6) expect(isNeighbor(6, CENTER_6X6, tile)).toBe(true);
  });

  test('refuses the tile itself and tiles two steps away', () => {
    expect(isNeighbor(4, CENTER_4X4, CENTER_4X4)).toBe(false);
    expect(isNeighbor(4, CENTER_4X4, 7)).toBe(false);
    expect(isNeighbor(4, CENTER_4X4, 13)).toBe(false);
    expect(isNeighbor(6, CENTER_6X6, 16)).toBe(false);
    expect(isNeighbor(6, CENTER_6X6, 26)).toBe(false);
  });

  test('does not wrap around the edges of the board', () => {
    // 4x4: tile 3 ends row 0 and tile 4 starts row 1; they are not neighbors.
    expect(isNeighbor(4, 3, 4)).toBe(false);
    expect(isNeighbor(4, 7, 8)).toBe(false);
    expect(isNeighbor(4, 3, 8)).toBe(false);
    // 6x6: tile 5 ends row 0 and tile 6 starts row 1.
    expect(isNeighbor(6, 5, 6)).toBe(false);
    expect(isNeighbor(6, 11, 12)).toBe(false);
  });

  test('gives corners three neighbors and borders five', () => {
    const neighborsOf = (size: number, tile: number) =>
      Array.from({ length: size * size }, (_, other) => other).filter((other) => isNeighbor(size, tile, other));

    expect(neighborsOf(4, 0)).toEqual([1, 4, 5]);
    expect(neighborsOf(4, 15)).toEqual([10, 11, 14]);
    expect(neighborsOf(4, 1)).toEqual([0, 2, 4, 5, 6]);
    expect(neighborsOf(6, 35)).toEqual([28, 29, 34]);
    expect(neighborsOf(6, 30)).toEqual([24, 25, 31]);
    expect(neighborsOf(6, 12)).toEqual([6, 7, 13, 18, 19]);
  });
});

describe('extendPath', () => {
  test('starts the path on the first tile touched', () => {
    expect(extendPath([], 7, 4)).toEqual([7]);
  });

  test('extends the path with a neighbor in any of the eight directions', () => {
    // PLAY-01 AC 2: from the middle, each of the 8 neighbors joins the path.
    for (const tile of NEIGHBORS_OF_5_IN_4X4) expect(extendPath([CENTER_4X4], tile, 4)).toEqual([CENTER_4X4, tile]);
    for (const tile of NEIGHBORS_OF_14_IN_6X6) expect(extendPath([CENTER_6X6], tile, 6)).toEqual([CENTER_6X6, tile]);

    // From a corner and along a border, the neighbors that exist.
    expect(extendPath([0], 5, 4)).toEqual([0, 5]);
    expect(extendPath([15], 10, 4)).toEqual([15, 10]);
    expect(extendPath([12], 6, 6)).toEqual([12, 6]);
    expect(extendPath([12], 19, 6)).toEqual([12, 19]);
  });

  test('drops the last tile when the finger returns to the one before', () => {
    // PLAY-01 AC 3: 0 → 1 → 2, back over 1, leaves 0 → 1.
    expect(extendPath([0, 1, 2], 1, 4)).toEqual([0, 1]);
    // And again, back to the first tile.
    expect(extendPath([0, 1], 0, 4)).toEqual([0]);
  });

  test('ignores tiles that are not neighbors or already used', () => {
    // PLAY-01 AC 4: a tile two steps away, or across the edge, leaves the path as it was.
    expect(extendPath([0, 1], 3, 4)).toEqual([0, 1]);
    expect(extendPath([3], 4, 4)).toEqual([3]);
    // A tile already in the path, other than the one before the last, is ignored.
    expect(extendPath([0, 1, 5, 4], 0, 4)).toEqual([0, 1, 5, 4]);
    // The last tile again changes nothing.
    expect(extendPath([0, 1], 1, 4)).toEqual([0, 1]);
  });

  test('never changes the path it receives', () => {
    const path = [0, 1] as const;
    extendPath(path, 2, 4);
    extendPath(path, 0, 4);
    expect(path).toEqual([0, 1]);
  });
});

describe('wordOfPath', () => {
  const BOARD = [
    ['c', 'a', 's', 'a'],
    ['Qu', 'e', 'r', 'o'],
    ['l', 'u', 'z', 'i'],
    ['m', 'a', 'r', 'e'],
  ];

  test('builds the word with Qu as q and u', () => {
    // PLAY-01 AC 5: Qu (4) → e (5) → r (6) → o (7) spells "quero".
    expect(wordOfPath(BOARD, [4, 5, 6, 7])).toBe('quero');
  });

  test('spells the letters of the path in order, in lower case', () => {
    expect(wordOfPath(BOARD, [0, 1, 2, 3])).toBe('casa');
    expect(wordOfPath(BOARD, [3, 2, 1, 0])).toBe('asac');
    expect(wordOfPath(BOARD, [])).toBe('');
  });
});
