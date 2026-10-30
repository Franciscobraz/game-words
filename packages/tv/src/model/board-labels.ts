/** The tile "qu" reads "Qu"; any other tile is its letter in upper case. */
function tileLabel(tile: string): string {
  const lower = tile.toLowerCase();
  return lower === 'qu' ? 'Qu' : lower.toUpperCase();
}

/** The labels of the board's tiles, row-major (TVPLAY-01 AC 2). */
export function boardLabels(board: readonly (readonly string[])[]): string[] {
  return board.flat().map(tileLabel);
}
