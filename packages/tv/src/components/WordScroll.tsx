import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import '../styles/word-scroll.css';

/** Props of `WordScroll`. */
export interface WordScrollProps {
  durationMs: number;
  children: ComponentChildren;
}

/**
 * Clips the list and moves it once, in one `transform` transition lasting `durationMs`, until its last line is in view
 * (TVWORDS-01 AC 6-8). The list only moves when it does not fit; the browser runs the transition, so nothing here ticks.
 */
export function WordScroll({ durationMs, children }: WordScrollProps) {
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [distancePx, setDistancePx] = useState(0);

  // Runs before the first paint: reading the sizes settles the list at the top, so the change below starts a transition.
  useLayoutEffect(() => {
    if (panel.current === null || list.current === null) return;
    setDistancePx(Math.max(0, list.current.offsetHeight - panel.current.clientHeight));
  }, []);

  return (
    <div class="word-scroll" ref={panel} data-testid="word-scroll">
      <div
        class="word-scroll__list"
        ref={list}
        data-testid="word-list"
        style={{ transform: `translateY(${-distancePx}px)`, transitionDuration: `${durationMs}ms` }}
      >
        {children}
      </div>
      <span class="word-scroll__fade word-scroll__fade--top" aria-hidden="true" />
      <span class="word-scroll__fade word-scroll__fade--bottom" aria-hidden="true" />
    </div>
  );
}
