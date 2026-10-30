import type { PlayerInfo } from '@bwords/core';
import { type Browser, expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { resultPlayers } from './samples.ts';
import { manySpellings, playerStates, SCREEN_STATES, type ScreenState, stateNamed, twelveLetterPlayers, wordStates } from './screen-states.ts';

/** The two ends of the TV's screens, and the root font size each one gets (TVUI-01 AC 1, design: TV escalada por rem). */
const ROOT_FONT_PX = [
  { width: 1920, height: 1080, fontSize: 16 },
  { width: 1280, height: 720, fontSize: 1280 / 120 },
] as const;

/** Sub-pixel rounding the browser may apply to a computed font size. */
const FONT_DIGITS = 2;

/** The screens the TV works at, 720p to 1080p (TVUI-01 AC 1, AD-016). */
const SIZES = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
] as const;

/** Texts of the Stitch screens that have no data behind them (AD-005, AD-022) and the removed fast mode (AD-020). */
const DECORATIVE_TEXTS = [
  'ARENA TV',
  'AO VIVO',
  'EDIÇÃO FESTA EM FAMÍLIA',
  'Display 1080p',
  'Sem controle remoto',
  'CONECTE-SE AGORA',
  'Mínimo 2 para iniciar',
  'APENAS 1 JOGADOR',
  'TEMPO RESTANTE',
  'Assistindo',
  '(offline)',
  'bwords.exemplo',
  'Fast mode',
  'Modo rápido',
] as const;

/** The logo in capitals, as the lobby capture wrote it; it is "BWords" everywhere (AD-022). */
const BRAND_IN_CAPITALS = 'BWORDS';

/** A sub-pixel difference is not a cut. */
const TOLERANCE_PX = 1;

/** Opens `state` on a page of its own: each state has its clock and its room. */
async function withState(browser: Browser, state: ScreenState, check: (page: Page) => Promise<void>): Promise<void> {
  const context = await browser.newContext({ viewport: SIZES[0] });
  const page = await context.newPage();
  try {
    await state.open(page);
    await check(page);
  } finally {
    await context.close();
  }
}

/** Each of `SIZES` in turn: the layout scales in `rem`, so a resize is the same as opening at that size. */
async function atEverySize(page: Page, check: (size: string) => Promise<void>): Promise<void> {
  for (const size of SIZES) {
    await page.setViewportSize(size);
    await check(`${size.width}x${size.height}`);
  }
}

/**
 * What does not fit the window: a page that scrolls, an element past its edge, text cut by a box that clips it, and two
 * texts on top of each other. The word list is made to run past its panel, so only its sides count, and what covers
 * the screen on purpose ("Tempo!", the connection banner, the confetti) is not an overlap.
 */
function layoutProblems(page: Page): Promise<string[]> {
  return page.evaluate((tolerance) => {
    const problems: string[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth) problems.push(`page is ${root.scrollWidth}px wide in ${root.clientWidth}px`);
    if (root.scrollHeight > root.clientHeight) problems.push(`page is ${root.scrollHeight}px tall in ${root.clientHeight}px`);

    const clips = (el: Element) => getComputedStyle(el).overflowX !== 'visible' || getComputedStyle(el).overflowY !== 'visible';
    const isAside = (el: Element) => el.closest('[aria-hidden="true"]') !== null;
    const isInWordList = (el: Element) => el.closest('[data-testid="word-list"]') !== null;
    const isOverlay = (el: Element) => el.closest('[data-testid="time-up"], [data-testid="connection-banner"]') !== null;
    const label = (el: Element) => `${el.tagName.toLowerCase()}.${el.getAttribute('class') ?? ''} "${(el.textContent ?? '').trim().slice(0, 30)}"`;
    const textNodes = (el: Element) => Array.from(el.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');

    function clippingBox(el: Element): DOMRect | null {
      for (let parent = el.parentElement; parent !== null; parent = parent.parentElement) {
        if (clips(parent)) return parent.getBoundingClientRect();
      }
      return null;
    }

    const texts: { el: Element; rects: DOMRect[] }[] = [];
    for (const el of Array.from(document.body.querySelectorAll('*'))) {
      if (isAside(el)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const pastSides = rect.left < -tolerance || rect.right > window.innerWidth + tolerance;
      const pastEnds = !isInWordList(el) && (rect.top < -tolerance || rect.bottom > window.innerHeight + tolerance);
      if (pastSides || pastEnds) problems.push(`past the window: ${label(el)}`);

      const nodes = textNodes(el);
      if (nodes.length === 0) continue;
      const box = clippingBox(el);
      if (box !== null && (rect.left < box.left - tolerance || rect.right > box.right + tolerance)) problems.push(`cut at the sides: ${label(el)}`);
      if (box !== null && !isInWordList(el) && (rect.top < box.top - tolerance || rect.bottom > box.bottom + tolerance)) problems.push(`cut at the ends: ${label(el)}`);
      if (isInWordList(el) || isOverlay(el)) continue;

      const rects = nodes.flatMap((node) => {
        const range = document.createRange();
        range.selectNode(node);
        return Array.from(range.getClientRects());
      });
      texts.push({ el, rects });
    }

    // A text's box is taller than its letters, more so with a tight line height: only the letters' band counts.
    const lettersBand = (rect: DOMRect) => ({ top: rect.top + rect.height * 0.25, bottom: rect.bottom - rect.height * 0.25 });
    const crosses = (a: DOMRect, b: DOMRect) => {
      const bandA = lettersBand(a);
      const bandB = lettersBand(b);
      return a.left < b.right - tolerance && b.left < a.right - tolerance && bandA.top < bandB.bottom && bandB.top < bandA.bottom;
    };
    texts.forEach((a, index) => {
      for (const b of texts.slice(index + 1)) {
        if (a.rects.some((rectA) => b.rects.some((rectB) => crosses(rectA, rectB)))) problems.push(`on top of each other: ${label(a.el)} and ${label(b.el)}`);
      }
    });
    return problems;
  }, TOLERANCE_PX);
}

/** The screen's text, as the eye reads it. */
const screenText = (page: Page) => page.evaluate(() => document.body.innerText);

/** Whether `text` is on the screen in one piece: not cut by a box, and not past the window. */
function isWholeOnScreen(page: Page, text: string): Promise<boolean> {
  return page.evaluate((wanted) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
      if (!(node.textContent ?? '').includes(wanted)) continue;
      const range = document.createRange();
      range.selectNode(node);
      const box = range.getBoundingClientRect();
      if (box.width > 0 && box.left >= 0 && box.top >= 0 && box.right <= window.innerWidth && box.bottom <= window.innerHeight) return true;
    }
    return false;
  }, text);
}

test('loads nothing from another origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();

  // Asking for the face directly: a browser only fetches a font once some text on the screen uses it.
  const facesLoaded = await page.evaluate(async () => (await document.fonts.load('700 16px "Nunito Sans"', 'BWords')).length);
  const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  const origin = new URL(page.url()).origin;
  expect(facesLoaded).toBeGreaterThan(0);
  expect(fontFamily).toContain('Nunito Sans');
  expect(requests.filter((url) => /\.woff2?(\?|$)/.test(url)).length).toBeGreaterThan(0);
  expect(requests.filter((url) => !url.startsWith('data:') && new URL(url).origin !== origin)).toEqual([]);
});

test('scales the root font with the screen', async ({ page }) => {
  await page.goto('/');

  for (const { width, height, fontSize } of ROOT_FONT_PX) {
    await page.setViewportSize({ width, height });
    const computed = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(computed, `${width}x${height}`).toBeCloseTo(fontSize, FONT_DIGITS);
  }
});

test('fits every screen from 720p to 1080p', async ({ browser }) => {
  // TVUI-01 AC 1: every screen and state, the sound notice and the connection banner included, with no scroll and no text cut.
  test.setTimeout(300_000);
  const failures: string[] = [];
  for (const state of SCREEN_STATES) {
    await withState(browser, state, (page) =>
      atEverySize(page, async (size) => {
        for (const problem of await layoutProblems(page)) failures.push(`${state.name} at ${size}: ${problem}`);
      }),
    );
  }
  expect(failures).toEqual([]);
});

test('has none of the decorative texts', async ({ browser }) => {
  // TVUI-01 AC 7, FAST-01 AC 3: no screen carries the Stitch's decoration, and the logo with the "B" stays.
  test.setTimeout(240_000);
  const failures: string[] = [];
  for (const state of SCREEN_STATES) {
    await withState(browser, state, async (page) => {
      const text = await screenText(page);
      const found = DECORATIVE_TEXTS.filter((decorative) => text.toLowerCase().includes(decorative.toLowerCase()));
      for (const decorative of found) failures.push(`${state.name}: "${decorative}"`);
      if (text.includes(BRAND_IN_CAPITALS)) failures.push(`${state.name}: "${BRAND_IN_CAPITALS}"`);
    });
  }
  expect(failures).toEqual([]);

  await withState(browser, stateNamed('lobby of the capture'), async (page) => {
    await expect(page.getByText(STRINGS.brand, { exact: true })).toBeVisible();
    await expect(page.getByText(STRINGS.brandMark, { exact: true }).first()).toBeVisible();
  });
});

test('shows a twelve letter nickname whole', async ({ browser }) => {
  // Edge Cases: with one, a few and ten players, each nickname of 12 wide letters is on the screen in one piece.
  test.setTimeout(240_000);
  const failures: string[] = [];
  for (const count of [1, 3, 4, 10]) {
    const players = twelveLetterPlayers(count);
    for (const state of playerStates(players)) {
      await withState(browser, state, (page) =>
        atEverySize(page, async (size) => {
          for (const { nickname } of players) {
            if (!(await isWholeOnScreen(page, nickname))) failures.push(`${state.name} at ${size}: ${nickname}`);
          }
          for (const problem of await layoutProblems(page)) failures.push(`${state.name} at ${size}: ${problem}`);
        }),
      );
    }
  }
  expect(failures).toEqual([]);
});

test('fits ten players on every screen', async ({ browser }) => {
  // Edge Cases: all ten are on the screen, with no scroll; the words' rows carry ten circles.
  test.setTimeout(240_000);
  const players = resultPlayers();
  const failures: string[] = [];
  for (const state of playerStates(players)) {
    await withState(browser, state, (page) =>
      atEverySize(page, async (size) => {
        for (const { nickname } of players) {
          if (!(await isWholeOnScreen(page, nickname))) failures.push(`${state.name} at ${size}: ${nickname}`);
        }
        for (const problem of await layoutProblems(page)) failures.push(`${state.name} at ${size}: ${problem}`);
      }),
    );
  }
  for (const state of wordStates(players)) {
    await withState(browser, state, (page) =>
      atEverySize(page, async (size) => {
        for (const problem of await layoutProblems(page)) failures.push(`${state.name} at ${size}: ${problem}`);
      }),
    );
  }
  expect(failures).toEqual([]);
});

test('shows a single card for one player', async ({ browser }) => {
  // Edge Cases: one player gets only the card of the first place, between the rounds and at the end.
  for (const name of ['result with 1', 'last result with 1']) {
    await withState(browser, stateNamed(name), async (page) => {
      await expect(page.locator('.podium-card')).toHaveCount(1);
      await expect(page.locator('.podium-card')).toContainText(STRINGS.place(1));
      await expect(page.getByTestId('result-rest')).toHaveCount(0);
      await atEverySize(page, async (size) => {
        expect(await layoutProblems(page), `${name} at ${size}`).toEqual([]);
      });
    });
  }
});

/** Where the parts of a word's row sit. */
interface RowGeometry {
  rowRight: number;
  rowBottom: number;
  spellingsRight: number;
  spellingsText: string;
  circles: { left: number; right: number; width: number; bottom: number }[];
  pointsRight: number;
}

/** Measures the `index`-th word row of the list. */
function rowGeometry(page: Page, index: number): Promise<RowGeometry> {
  return page.getByTestId('word-row').nth(index).evaluate((row) => {
    const spellings = row.querySelector('.word-row__spellings');
    const points = row.querySelector('.word-row__points');
    if (spellings === null || points === null) throw new Error('A word row without its parts');
    const box = row.getBoundingClientRect();
    return {
      rowRight: box.right,
      rowBottom: box.bottom,
      spellingsRight: spellings.getBoundingClientRect().right,
      spellingsText: spellings.textContent ?? '',
      circles: Array.from(row.querySelectorAll('.word-row__finder')).map((finder) => {
        const circle = finder.getBoundingClientRect();
        return { left: circle.left, right: circle.right, width: circle.width, bottom: circle.bottom };
      }),
      pointsRight: points.getBoundingClientRect().right,
    };
  });
}

/** The first word row has many spellings, the second has none; the same finders, so the circles line up. */
async function expectCirclesInPlace(page: Page, players: readonly PlayerInfo[], spellings: readonly string[], size: string) {
  // Stopped where the rows are, at the top of the list: this check is about the columns, not the scroll.
  await page.getByTestId('word-list').evaluate((list) => {
    for (const animation of list.getAnimations()) animation.pause();
  });
  const crowded = await rowGeometry(page, 0);
  const plain = await rowGeometry(page, 1);

  for (const spelling of spellings) expect(crowded.spellingsText, `${size}: ${spelling}`).toContain(spelling);
  expect(crowded.circles, size).toHaveLength(players.length);
  crowded.circles.forEach((circle, index) => {
    const same = plain.circles[index];
    if (same === undefined) throw new Error(`No circle ${index} in the plain row`);
    expect(circle.left, `${size}: circle ${index}`).toBeCloseTo(same.left, 0);
    expect(circle.width, `${size}: circle ${index}`).toBeCloseTo(same.width, 0);
    expect(circle.bottom, `${size}: circle ${index}`).toBeLessThanOrEqual(crowded.rowBottom);
  });
  expect(crowded.spellingsRight, size).toBeLessThanOrEqual(crowded.circles[0]!.left);
  expect(crowded.pointsRight, size).toBeCloseTo(plain.pointsRight, 0);
  expect(crowded.pointsRight, size).toBeLessThanOrEqual(crowded.rowRight);
}

test('keeps the circles in place with many spellings', async ({ browser }) => {
  // Edge Cases: every spelling on the row of its word, with the circles and the points where the other rows have them.
  test.setTimeout(120_000);
  for (const players of [resultPlayers(), resultPlayers().slice(0, 2), twelveLetterPlayers(10)]) {
    const spellings = manySpellings(players).shared[0]?.spellings;
    if (spellings === undefined) throw new Error('The sample has no spellings');
    const state = wordStates(players).find(({ name }) => name.endsWith('many spellings'));
    if (state === undefined) throw new Error('No state with many spellings');
    await withState(browser, state, (page) =>
      atEverySize(page, async (size) => {
        await expectCirclesInPlace(page, players, spellings, size);
        expect(await layoutProblems(page), size).toEqual([]);
      }),
    );
  }
});
