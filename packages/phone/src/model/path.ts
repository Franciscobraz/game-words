import { type Board, boardTiles } from '@bwords/core';

/** A swipe: row-major tile indices, in the order the finger went over them. */
export type Path = readonly number[];

/** Code of the letter "a"; `boardTiles` gives each letter as its distance from it. */
const LETTER_A_CODE = 97;

/** Whether tiles `a` and `b` of a `size`×`size` board touch, in any of the 8 directions (PLAY-01 AC 2). */
export function isNeighbor(size: number, a: number, b: number): boolean {
  if (a === b) return false;
  const rowDistance = Math.abs(Math.floor(a / size) - Math.floor(b / size));
  const columnDistance = Math.abs((a % size) - (b % size));
  return rowDistance <= 1 && columnDistance <= 1;
}

/**
 * The path after the finger reaches `tile` (PLAY-01 AC 2-4). An empty path starts
 * there. Going back to the tile before the last drops the last one. A neighbor of
 * the last tile not yet in the path joins it. Anything else leaves the path as it is.
 */
export function extendPath(path: Path, tile: number, size: number): Path {
  if (path.length === 0) return [tile];
  if (path.length >= 2 && path[path.length - 2] === tile) return path.slice(0, -1);
  const last = path[path.length - 1]!;
  if (path.includes(tile) || !isNeighbor(size, last, tile)) return path;
  return [...path, tile];
}

/** The normalized word a path spells, with "Qu" as the two letters q-u (PLAY-01 AC 5). */
export function wordOfPath(board: Board, path: Path): string {
  const tiles = boardTiles(board);
  const codes = path.flatMap((tile) => tiles[tile]!.map((letter) => letter + LETTER_A_CODE));
  return String.fromCharCode(...codes);
}
