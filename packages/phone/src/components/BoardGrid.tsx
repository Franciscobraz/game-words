import { useRef } from 'preact/hooks';
import type { LinePoint } from '../model/board-view.ts';
import { HIT_RADIUS_RATIO, isInsideBoard, type Point, tileAtPoint } from '../model/hit-test.ts';
import '../styles/board-grid.css';

/** Props of `BoardGrid`. */
export interface BoardGridProps {
  /** The tiles' labels, row-major ("C", "Qu"). */
  labels: readonly string[];
  size: number;
  /** The tiles under the finger, in order. */
  path: readonly number[];
  /** The line joining the path's tiles, as shares of the board side. */
  line: readonly LinePoint[];
  /** The player's color, which lights the path (PLAY-01 AC 2). */
  color: string;
  /** A locked board is faded and ignores the finger (PLAY-01 AC 20, SPEC-01 AC 1). */
  locked: boolean;
  /** Name of the board for assistive technology. */
  label: string;
  /** The finger reached a tile's touch zone. */
  onReachTile?: (tile: number) => void;
  /** The finger lifted or left the board (Edge Cases). */
  onRelease?: () => void;
}

/**
 * The board: the tiles, the path lit in the player's color and a line between the
 * centers of its tiles. It turns the finger into tiles with the 35% touch zone and
 * calls `onRelease` when the finger lifts or leaves it (PLAY-01 AC 2-4, 16). It
 * fills its parent, which gives it a square.
 */
export function BoardGrid({ labels, size, path, line, color, locked, label, onReachTile, onRelease }: BoardGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  /** The pointer that swipes; a second finger is ignored. */
  const swipingPointer = useRef<number | null>(null);
  const last = path[path.length - 1];

  function release(): void {
    swipingPointer.current = null;
    onRelease?.();
  }

  /** The finger at `point`: leaving the board releases, a touch zone extends the path. */
  function follow(point: Point): void {
    const rect = gridRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    if (!isInsideBoard(point, rect)) {
      release();
      return;
    }
    const tile = tileAtPoint(point, rect, size, HIT_RADIUS_RATIO);
    if (tile !== null) onReachTile?.(tile);
  }

  function onPointerDown(event: PointerEvent): void {
    if (locked || swipingPointer.current !== null) return;
    event.preventDefault();
    gridRef.current?.setPointerCapture(event.pointerId);
    swipingPointer.current = event.pointerId;
    follow({ x: event.clientX, y: event.clientY });
  }

  function onPointerMove(event: PointerEvent): void {
    if (event.pointerId !== swipingPointer.current) return;
    follow({ x: event.clientX, y: event.clientY });
  }

  function onPointerEnd(event: PointerEvent): void {
    if (event.pointerId !== swipingPointer.current) return;
    release();
  }

  return (
    <div
      ref={gridRef}
      class={`board-grid${locked ? ' board-grid--locked' : ''}`}
      style={{ '--board-size': size, '--path-color': color }}
      role="group"
      aria-label={label}
      aria-disabled={locked}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <svg class="board-grid__line" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={line.map((p) => `${p.x},${p.y}`).join(' ')} />
      </svg>
      {labels.map((tileText, index) => (
        <span key={index} class="board-grid__cell">
          <span class={tileClass(path.includes(index), index === last)}>{tileText}</span>
        </span>
      ))}
    </div>
  );
}

function tileClass(isLit: boolean, isLast: boolean): string {
  if (!isLit) return 'board-grid__tile';
  return `board-grid__tile board-grid__tile--lit${isLast ? ' board-grid__tile--last' : ''}`;
}
