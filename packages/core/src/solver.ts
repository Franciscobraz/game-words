import type { Dawg } from './dawg.ts';

/** Square board, one row per array. Tiles are single letters a-z or "Qu" (Q only appears as Qu). */
export type Board = readonly (readonly string[])[];

export const BOARD_SIZES: readonly number[] = [4, 5, 6];

/** Letter codes (0 = a) spelled by each tile, row-major. Throws on an invalid board. */
export function boardTiles(board: Board): number[][] {
  const n = board.length;
  if (!BOARD_SIZES.includes(n) || board.some((row) => row.length !== n)) {
    throw new Error(`Invalid board size: expected a square board of side ${BOARD_SIZES.join(', ')}`);
  }
  return board.flat().map((tile) => {
    const t = tile.toLowerCase();
    if (t === 'qu') return [16, 20];
    if (/^[a-pr-z]$/.test(t)) return [t.charCodeAt(0) - 97];
    throw new Error(`Invalid tile "${tile}": expected a-z or Qu`);
  });
}

/** All dictionary words of at least `minLength` letters formed by chaining adjacent tiles (8 directions), each tile used once. */
export function solve(board: Board, dawg: Dawg, minLength = 3): Set<string> {
  const tiles = boardTiles(board);
  const n = board.length;
  const neighbors = tiles.map((_, i) => {
    const r = Math.floor(i / n);
    const c = i % n;
    const out: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = c + dc;
        if ((dr || dc) && rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
      }
    }
    return out;
  });

  const found = new Set<string>();
  const used = new Uint8Array(tiles.length);
  const letters: number[] = [];

  const visit = (cell: number, node: number) => {
    let edge = -1;
    for (const letter of tiles[cell]!) {
      edge = dawg.edge(node, letter);
      if (edge < 0) return;
      node = dawg.child(edge);
    }
    used[cell] = 1;
    letters.push(...tiles[cell]!);
    if (letters.length >= minLength && dawg.isWord(edge)) found.add(String.fromCharCode(...letters.map((l) => l + 97)));
    if (node >= 0) {
      for (const next of neighbors[cell]!) if (!used[next]) visit(next, node);
    }
    letters.length -= tiles[cell]!.length;
    used[cell] = 0;
  };

  for (let cell = 0; cell < tiles.length; cell++) visit(cell, dawg.root);
  return found;
}
