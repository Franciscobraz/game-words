import type { ScrollDirection } from '@bwords/core';

/**
 * The list of words as the screen measured it once: the panel that clips it, the whole list, and each word row in list
 * order. Group titles are not words, so they are never highlighted.
 */
export interface ScrollLayout {
  panelPx: number;
  listPx: number;
  words: readonly { topPx: number; heightPx: number }[];
}

/** The highlight moves to the next word every second (WORDCTL-01 AC 13-14, AD-024). */
export const HIGHLIGHT_STEP_MS = 1_000;

/** The reading line sits a third of the panel from its top (WORDCTL-01 AC 13). */
export const READING_LINE_RATIO = 1 / 3;

/** A step of the host moves the list half the panel (WORDCTL-01 AC 5-6). */
export const MANUAL_STEP_RATIO = 0.5;

/** The furthest the list goes up: the last word whole at the bottom of the panel; 0 for a list that fits (WORDCTL-01 AC 2-3). */
export function maxOffset(layout: ScrollLayout): number {
  return Math.max(0, layout.listPx - layout.panelPx);
}

/**
 * The word highlighted `elapsedMs` after the list opened: one a second, in list order, staying on the last one
 * (WORDCTL-01 AC 13-14). Null before the list opens and for a list with no words.
 */
export function highlightIndex(elapsedMs: number, wordCount: number): number | null {
  if (elapsedMs < 0 || wordCount === 0) return null;
  return Math.min(Math.floor(elapsedMs / HIGHLIGHT_STEP_MS), wordCount - 1);
}

/** The offset that puts the middle of word `index` on the reading line, kept between the top and the last word whole. */
export function targetOffset(layout: ScrollLayout, index: number): number {
  const word = layout.words[index];
  if (word === undefined) return 0;
  const middlePx = word.topPx + word.heightPx / 2;
  return clampOffset(layout, middlePx - layout.panelPx * READING_LINE_RATIO);
}

/**
 * Where the list is `elapsedMs` after it opened, while it moves by itself: during second `i` it goes in a straight line
 * from word `i` to word `i + 1` on the reading line, so with rows of one height it rises one row a second
 * (WORDCTL-01 AC 1-3, 13).
 */
export function autoOffset(layout: ScrollLayout, elapsedMs: number): number {
  const index = highlightIndex(elapsedMs, layout.words.length);
  if (index === null) return targetOffset(layout, 0);
  const from = targetOffset(layout, index);
  if (index === layout.words.length - 1) return from;
  const to = targetOffset(layout, index + 1);
  const fraction = (elapsedMs - index * HIGHLIGHT_STEP_MS) / HIGHLIGHT_STEP_MS;
  return from + (to - from) * fraction;
}

/** The offset after one step of the host, half the panel down or up, stopping at the top or the last word whole (WORDCTL-01 AC 5-7). */
export function stepOffset(layout: ScrollLayout, offset: number, direction: ScrollDirection): number {
  const stepPx = layout.panelPx * MANUAL_STEP_RATIO;
  return clampOffset(layout, direction === 'down' ? offset + stepPx : offset - stepPx);
}

function clampOffset(layout: ScrollLayout, offset: number): number {
  return Math.min(Math.max(offset, 0), maxOffset(layout));
}
