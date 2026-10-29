import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import '../styles/fit-square.css';

/** Props of `FitSquare`. */
export interface FitSquareProps {
  /** What fills the square: the board. */
  children: ComponentChildren;
  /** What goes right under the square, as the found words; the square leaves room for it. */
  below?: ComponentChildren;
}

/**
 * The largest square that fits the free space of the screen, with `below` right
 * under it, so the board is whole and square on any phone, without scrolling
 * (UI-01 AC 9, AD-016). It measures the free space with a `ResizeObserver`.
 */
export function FitSquare({ children, below }: FitSquareProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState(0);

  useEffect(() => {
    const area = areaRef.current;
    if (area === null) return;
    const measure = () => setSide(squareSide(area, belowRef.current));
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    if (belowRef.current !== null) observer.observe(belowRef.current);
    measure();
    return () => observer.disconnect();
  }, []);

  return (
    <div class="fit-square" ref={areaRef}>
      <div class="fit-square__box" style={{ width: `${side}px`, height: `${side}px` }}>
        {children}
      </div>
      {below !== undefined && (
        <div class="fit-square__below" ref={belowRef}>
          {below}
        </div>
      )}
    </div>
  );
}

/** The side of the square: the area's width, or its height less what goes below, whichever is smaller. */
function squareSide(area: HTMLElement, below: HTMLElement | null): number {
  const belowHeight = below === null ? 0 : below.offsetHeight + marginTopOf(below);
  return Math.max(0, Math.floor(Math.min(area.clientWidth, area.clientHeight - belowHeight)));
}

function marginTopOf(element: HTMLElement): number {
  return Number.parseFloat(getComputedStyle(element).marginTop) || 0;
}
