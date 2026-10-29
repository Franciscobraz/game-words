import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { SAMPLE_CODE } from './samples.ts';
import { SCREEN_STATES } from './screen-states.ts';

/** The portrait widths the phone works at, and the shortest and tallest heights (UI-01 AC 1, AD-016). */
const WIDTHS = [320, 360, 390, 430, 480] as const;
const HEIGHTS = [568, 932] as const;

/** Outside portrait: a phone on its side and a tablet (Edge Cases, AD-016). */
const OTHER_VIEWPORTS = [
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
] as const;

/** The smallest touch target (UI-01 AC 7). */
const MIN_BUTTON_PX = 48;

/** Lets the screen lay out again after a resize, measured by the board's ResizeObserver too. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

/**
 * What does not fit the window: a page wider than the screen, and text cut by the
 * window's edge, by a box that clips it or by its own ellipsis. Rows made to scroll
 * sideways (the colors, the found words, the quick scoreboard) are left out, and so
 * is what screen readers alone get.
 */
function layoutProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth) problems.push(`page is ${root.scrollWidth}px wide in ${root.clientWidth}px`);

    const scrollsSideways = (el: Element) => ['auto', 'scroll'].includes(getComputedStyle(el).overflowX);
    const clips = (el: Element) => ['hidden', 'clip'].includes(getComputedStyle(el).overflowX);
    const isAside = (el: Element) => el.closest('[aria-hidden="true"], .visually-hidden') !== null;
    const label = (el: Element) => `${el.tagName.toLowerCase()}.${el.className} "${(el.textContent ?? '').trim().slice(0, 30)}"`;

    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      const hasText = Array.from(el.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
      if (!hasText || isAside(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      let insideScroller = false;
      for (let parent = el.parentElement; parent !== null; parent = parent.parentElement) {
        if (scrollsSideways(parent)) {
          insideScroller = true;
          break;
        }
        if (!clips(parent)) continue;
        const box = parent.getBoundingClientRect();
        if (rect.left < box.left - 1 || rect.right > box.right + 1) problems.push(`clipped by its box: ${label(el)}`);
        break;
      }
      if (insideScroller) continue;
      if (rect.left < -1 || rect.right > window.innerWidth + 1) problems.push(`past the window edge: ${label(el)}`);
      if (clips(el) && el.scrollWidth > el.clientWidth + 1) problems.push(`cut by its own width: ${label(el)}`);
    }
    return problems;
  });
}

test('fits every width from 320 to 480 pixels without horizontal scroll', async ({ page }) => {
  // UI-01 AC 1: every screen and state, at each portrait width and at the shortest and tallest heights,
  // shows all its content with no sideways scroll and no text cut.
  test.setTimeout(240_000);
  const failures: string[] = [];
  for (const state of SCREEN_STATES) {
    await page.setViewportSize({ width: 390, height: 844 });
    await state.open(page);
    for (const width of WIDTHS) {
      for (const height of HEIGHTS) {
        await page.setViewportSize({ width, height });
        await settle(page);
        for (const problem of await layoutProblems(page)) failures.push(`${state.name} at ${width}x${height}: ${problem}`);
      }
    }
  }
  expect(failures).toEqual([]);
});

test('scales proportionally on landscape and tablet without horizontal scroll', async ({ page }) => {
  // Edge Cases (AD-016): on its side and on a tablet the screens only take the width; vertical scroll is fine.
  test.setTimeout(120_000);
  const failures: string[] = [];
  for (const state of SCREEN_STATES) {
    await page.setViewportSize({ width: 390, height: 844 });
    await state.open(page);
    for (const viewport of OTHER_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await settle(page);
      for (const problem of await layoutProblems(page)) failures.push(`${state.name} at ${viewport.width}x${viewport.height}: ${problem}`);
    }
  }
  expect(failures).toEqual([]);
});

test('shows only the room tag, preferences and the host menu on top', async ({ page }) => {
  // UI-01 AC 6: on every room screen the top holds "SALA <código>", the preferences icon and, for the host only,
  // the menu (⋮); no screen title and no connection indicator.
  const failures: string[] = [];
  for (const state of SCREEN_STATES.filter((s) => s.topBar !== 'none')) {
    await state.open(page);
    const top = page.locator('header.top-bar');
    await expect(top, state.name).toHaveCount(1);
    const buttons = await top.getByRole('button').evaluateAll((all) => all.map((b) => b.getAttribute('aria-label')));
    const expected = state.topBar === 'host' ? [STRINGS.preferences, STRINGS.hostMenu] : [STRINGS.preferences];
    if (JSON.stringify(buttons) !== JSON.stringify(expected)) failures.push(`${state.name}: buttons ${JSON.stringify(buttons)}`);
    const text = (await top.innerText()).replace(/\s+/g, ' ').trim();
    if (text !== `${STRINGS.roomLabel} ${SAMPLE_CODE}`) failures.push(`${state.name}: top reads "${text}"`);
    if ((await top.locator('h1, h2, h3').count()) > 0) failures.push(`${state.name}: a title in the top`);
  }
  expect(failures).toEqual([]);
});

test('keeps every button at least 48 px tall', async ({ page }) => {
  // UI-01 AC 7: every button on every screen, sheets and menus included, at 320 and 480 px wide.
  test.setTimeout(120_000);
  const failures: string[] = [];
  for (const state of SCREEN_STATES) {
    await page.setViewportSize({ width: 390, height: 844 });
    await state.open(page);
    if (state.topBar === 'host' && (await page.getByRole('dialog').count()) === 0) {
      await page.getByRole('button', { name: STRINGS.hostMenu }).click();
    }
    for (const width of [320, 480]) {
      await page.setViewportSize({ width, height: 844 });
      await settle(page);
      const short = await page.locator('button:visible, [role="button"]:visible').evaluateAll(
        (all, min) =>
          all
            .map((b) => ({ name: b.getAttribute('aria-label') ?? (b.textContent ?? '').trim(), height: b.getBoundingClientRect().height }))
            .filter((b) => b.height < min)
            .map((b) => `"${b.name}" ${b.height.toFixed(1)}px`),
        MIN_BUTTON_PX,
      );
      for (const button of short) failures.push(`${state.name} at ${width}px: ${button}`);
    }
  }
  expect(failures).toEqual([]);
});
