import { useEffect, useRef, useState } from 'preact/hooks';

interface BoardProps {
  /** Rows of tiles ("a".."z" or "qu"); empty while there is no board. */
  board: readonly (readonly string[])[];
  disabled: boolean;
  /** Called on release with the dragged path of row-major tile indices. */
  onSubmit: (path: number[]) => void;
}

function adjacent(a: number, b: number, n: number): boolean {
  return Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs((a % n) - (b % n)) <= 1;
}

/** Tile index under a viewport point, or null. */
function tileAt(x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-index]');
  return el ? Number(el.dataset.index) : null;
}

/**
 * The board. Pointer Events drive the drag, so mouse and touch behave the same:
 * press on a tile, slide through adjacent tiles (sliding back onto the previous
 * tile undoes the last one), release to submit.
 */
export function Board({ board, disabled, onSubmit }: BoardProps) {
  const n = board.length;
  const [path, setPath] = useState<number[]>([]);
  const pathRef = useRef<number[]>([]);
  const dragging = useRef(false);

  const update = (next: number[]) => {
    pathRef.current = next;
    setPath(next);
  };

  useEffect(() => {
    const release = () => {
      if (!dragging.current) return;
      dragging.current = false;
      const submitted = pathRef.current;
      update([]);
      onSubmit(submitted);
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    return () => {
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
    };
  }, [onSubmit]);

  const onPointerDown = (e: PointerEvent) => {
    const i = tileAt(e.clientX, e.clientY);
    if (disabled || i === null) return;
    e.preventDefault();
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    dragging.current = true;
    update([i]);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging.current) return;
    const i = tileAt(e.clientX, e.clientY);
    const current = pathRef.current;
    const last = current[current.length - 1];
    if (i === null || last === undefined || i === last) return;
    if (i === current[current.length - 2]) update(current.slice(0, -1));
    else if (!current.includes(i) && adjacent(i, last, n)) update([...current, i]);
  };

  return (
    <div
      data-testid="board"
      class="board"
      aria-disabled={disabled ? 'true' : 'false'}
      style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {board.flat().map((tile, i) => (
        <div
          key={i}
          data-testid="tile"
          data-index={i}
          data-selected={path.includes(i) ? 'true' : 'false'}
          class="tile"
        >
          {tile === 'qu' ? 'Qu' : tile.toUpperCase()}
        </div>
      ))}
    </div>
  );
}
