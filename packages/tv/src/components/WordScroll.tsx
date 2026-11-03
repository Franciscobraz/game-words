import type { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef } from 'preact/hooks';
import type { ScrollLayout, ScrollMode } from '../model/word-scroll.ts';
import '../styles/word-scroll.css';

/** Props of `WordScroll`. */
export interface WordScrollProps {
  /** How far the list goes up, in pixels. */
  offsetPx: number;
  /** `auto` moves the list in a linear second toward `offsetPx`; `manual` moves it there in a short step. */
  mode: ScrollMode;
  /** Gets the panel and the word rows, measured after the fonts are in; a stable callback measures once. */
  onLayout(layout: ScrollLayout): void;
  children: ComponentChildren;
}

/**
 * Clips the list and moves it with a `transform` to `offsetPx`, so nothing else on the page moves (WORDCTL-01 AC 1, 5-6).
 * The rows have different heights, so the list measures itself once and hands the layout up; the rules work on it.
 */
export function WordScroll({ offsetPx, mode, onLayout, children }: WordScrollProps) {
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    let mounted = true;
    void document.fonts.ready.then(() => {
      if (!mounted || panel.current === null || list.current === null) return;
      onLayout(measure(panel.current, list.current));
    });
    return () => {
      mounted = false;
    };
  }, [onLayout]);

  return (
    <div class="word-scroll" ref={panel} data-testid="word-scroll">
      <div
        class={`word-scroll__list word-scroll__list--${mode}`}
        ref={list}
        data-testid="word-list"
        style={{ transform: `translateY(${-offsetPx}px)` }}
      >
        {children}
      </div>
      <span class="word-scroll__fade word-scroll__fade--top" aria-hidden="true" />
      <span class="word-scroll__fade word-scroll__fade--bottom" aria-hidden="true" />
    </div>
  );
}

/**
 * The panel, the whole list and each word row, in list order; group titles are not words. The sizes are fractional, so a
 * long list does not drift from its rows; the rows are read without the highlight's scale, which is not layout.
 */
function measure(panel: HTMLElement, list: HTMLElement): ScrollLayout {
  const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-testid="word-row"]'));
  list.classList.add(MEASURING_CLASS);
  const listBox = list.getBoundingClientRect();
  const words = rows.map((row) => {
    const box = row.getBoundingClientRect();
    return { topPx: box.top - listBox.top, heightPx: box.height };
  });
  list.classList.remove(MEASURING_CLASS);
  return { panelPx: panel.getBoundingClientRect().height, listPx: listBox.height, words };
}

/** Takes the highlight's scale off the rows while they are measured, before the browser paints. */
const MEASURING_CLASS = 'word-scroll__list--measuring';
