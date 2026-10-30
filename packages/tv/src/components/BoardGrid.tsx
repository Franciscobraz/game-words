import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/board-grid.css';

/** Props of `BoardGrid`. */
export interface BoardGridProps {
  /** The tiles' labels, row-major ("C", "Qu"). */
  labels: readonly string[];
  size: number;
}

/**
 * The board, still: on the TV no path is drawn (docs/screens.md §4). It fills its parent, which gives it a square
 * and sets `--board-side`, so a 5x5 or a 6x6 stays in the same square with smaller tiles (TVPLAY-01 AC 11).
 */
export function BoardGrid({ labels, size }: BoardGridProps) {
  return (
    <div class="board-grid" role="img" aria-label={STRINGS.board} style={{ '--board-size': size }} data-testid="board">
      {labels.map((label, index) => (
        <div class="board-grid__cell" key={index}>
          <span class="board-grid__tile">{label}</span>
        </div>
      ))}
    </div>
  );
}
