import { describe, expect, test } from 'vitest';
import { autoOffset, highlightIndex, maxOffset, type ScrollLayout, stepOffset, targetOffset } from './word-scroll.ts';

const ROW_PX = 60;
const PANEL_PX = 600;
const READING_LINE_PX = PANEL_PX / 3;

/** A list of `count` word rows of one height, one under the other, in a panel of 600 px. */
function rowsLayout(count: number): ScrollLayout {
  const words = Array.from({ length: count }, (_, index) => ({ topPx: index * ROW_PX, heightPx: ROW_PX }));
  return { panelPx: PANEL_PX, listPx: count * ROW_PX, words };
}

/** The word whose row holds the reading line when the list is at `offset`. */
function wordOnReadingLine(layout: ScrollLayout, offset: number): number {
  const linePx = offset + READING_LINE_PX;
  return layout.words.findIndex((word) => word.topPx <= linePx && linePx < word.topPx + word.heightPx);
}

describe('maxOffset', () => {
  test('stops with the last word whole at the bottom of the panel', () => {
    expect(maxOffset(rowsLayout(30))).toBe(30 * ROW_PX - PANEL_PX);
  });

  test('keeps a list that fits at the top', () => {
    expect(maxOffset(rowsLayout(10))).toBe(0);
    expect(maxOffset(rowsLayout(3))).toBe(0);
  });
});

describe('highlightIndex', () => {
  test('has no highlight before the list opens or without words', () => {
    expect(highlightIndex(-1, 5)).toBeNull();
    expect(highlightIndex(0, 0)).toBeNull();
  });

  test('moves to the next word at each full second', () => {
    expect(highlightIndex(0, 5)).toBe(0);
    expect(highlightIndex(999, 5)).toBe(0);
    expect(highlightIndex(1_000, 5)).toBe(1);
    expect(highlightIndex(1_999, 5)).toBe(1);
    expect(highlightIndex(2_000, 5)).toBe(2);
  });
});

describe('targetOffset', () => {
  test('puts the middle of the word on the reading line, between the top and the end', () => {
    const layout = rowsLayout(30);

    expect(targetOffset(layout, 10)).toBe(10 * ROW_PX + ROW_PX / 2 - READING_LINE_PX);
    expect(targetOffset(layout, 0)).toBe(0);
    expect(targetOffset(layout, 29)).toBe(maxOffset(layout));
  });
});

describe('autoOffset', () => {
  test('highlights the word on the reading line while the list moves', () => {
    const layout = rowsLayout(30);

    for (const second of [4, 10, 20]) {
      const elapsedMs = second * 1_000;
      const offset = autoOffset(layout, elapsedMs);

      expect(wordOnReadingLine(layout, offset), `${second} s`).toBe(highlightIndex(elapsedMs, layout.words.length));
      const middlePx = layout.words[second]!.topPx + ROW_PX / 2;
      expect(middlePx - offset, `${second} s`).toBe(READING_LINE_PX);
    }
  });

  test('rises one row a second, in a straight line', () => {
    const layout = rowsLayout(30);

    expect(autoOffset(layout, 11_000) - autoOffset(layout, 10_000)).toBe(ROW_PX);
    expect(autoOffset(layout, 10_500) - autoOffset(layout, 10_000)).toBe(ROW_PX / 2);
  });

  test('stops with the last word whole while the highlight goes on to the last word', () => {
    const layout = rowsLayout(30);

    expect(autoOffset(layout, 29_000)).toBe(maxOffset(layout));
    expect(autoOffset(layout, 600_000)).toBe(maxOffset(layout));
    expect(highlightIndex(29_000, 30)).toBe(29);
  });

  test('highlights a list that fits one word a second and stops on the last', () => {
    const layout = rowsLayout(4);

    expect(highlightIndex(999, 4)).toBe(0);
    expect(highlightIndex(1_000, 4)).toBe(1);
    expect(highlightIndex(2_000, 4)).toBe(2);
    expect(highlightIndex(3_000, 4)).toBe(3);
    expect(highlightIndex(60_000, 4)).toBe(3);
    for (const elapsedMs of [0, 999, 1_000, 2_500, 3_000, 60_000]) expect(autoOffset(layout, elapsedMs)).toBe(0);
  });
});

describe('stepOffset', () => {
  test('moves half the panel down or up', () => {
    const layout = rowsLayout(30);

    expect(stepOffset(layout, 500, 'down')).toBe(500 + PANEL_PX / 2);
    expect(stepOffset(layout, 500, 'up')).toBe(500 - PANEL_PX / 2);
  });

  test('stops a step at the top and with the last word whole', () => {
    const layout = rowsLayout(30);
    const end = maxOffset(layout);

    expect(stepOffset(layout, PANEL_PX / 2, 'up')).toBe(0);
    expect(stepOffset(layout, PANEL_PX / 2 - 1, 'up')).toBe(0);
    expect(stepOffset(layout, PANEL_PX / 2 + 1, 'up')).toBe(1);
    expect(stepOffset(layout, 0, 'up')).toBe(0);
    expect(stepOffset(layout, end - PANEL_PX / 2, 'down')).toBe(end);
    expect(stepOffset(layout, end - PANEL_PX / 2 + 1, 'down')).toBe(end);
    expect(stepOffset(layout, end - PANEL_PX / 2 - 1, 'down')).toBe(end - 1);
    expect(stepOffset(layout, end, 'down')).toBe(end);
  });

  test('keeps a list that fits where it is', () => {
    const layout = rowsLayout(5);

    expect(stepOffset(layout, 0, 'down')).toBe(0);
    expect(stepOffset(layout, 0, 'up')).toBe(0);
  });
});
