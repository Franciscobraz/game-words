import { type Board, boardTiles } from './solver.ts';

/**
 * A path of row-major tile indices that spells `word` (normalized letters a-z) on the
 * board: adjacent tiles in any of the 8 directions, each used once, with "Qu" read as
 * the two letters q-u. Returns null when the word is not on the board or would take a
 * single tile, which is not a path.
 */
export function findPath(board: Board, word: string): number[] | null {
  const tiles = boardTiles(board);
  const n = board.length;
  const letters = [...word].map((ch) => ch.charCodeAt(0) - 97);
  const used = new Uint8Array(tiles.length);
  const path: number[] = [];

  const visit = (cell: number, at: number): boolean => {
    const tile = tiles[cell]!;
    for (let k = 0; k < tile.length; k++) if (letters[at + k] !== tile[k]) return false;
    const next = at + tile.length;
    used[cell] = 1;
    path.push(cell);
    if (next === letters.length) {
      if (path.length >= 2) return true;
    } else {
      const r = Math.floor(cell / n);
      const c = cell % n;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr;
          const cc = c + dc;
          const i = rr * n + cc;
          if ((dr || dc) && rr >= 0 && rr < n && cc >= 0 && cc < n && !used[i] && visit(i, next)) return true;
        }
      }
    }
    path.pop();
    used[cell] = 0;
    return false;
  };

  if (letters.length === 0) return null;
  for (let cell = 0; cell < tiles.length; cell++) if (visit(cell, 0)) return path;
  return null;
}
