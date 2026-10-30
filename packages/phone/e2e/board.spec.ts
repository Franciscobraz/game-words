import { wordPoints } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { boardOf, openRound, slideOver, swipe, tileCenter } from './round-room.ts';
import { SAMPLE_WORDS } from './samples.ts';

/** A round that opened a second ago and lasts two more minutes. */
function openNow(page: Page, found: string[] = []) {
  const now = Date.now();
  return openRound(page, { startsAt: now - 1_000, endsAt: now + 120_000, found });
}

const foundList = (page: Page) => page.getByRole('region', { name: STRINGS.foundWords }).getByRole('listitem');

test('shows the feedback within 100 ms of release', async ({ page }) => {
  // PLAY-01 AC 6-7: lifting the finger on CASA shows "VÁLIDA (+2 PTS)" in under 100 ms, judged on the phone.
  await openNow(page);
  await expect(boardOf(page)).toBeVisible();
  await page.evaluate(() => {
    const marks: { released?: number; shown?: number } = {};
    (window as unknown as { marks: typeof marks }).marks = marks;
    window.addEventListener('pointerup', () => (marks.released = performance.now()), { capture: true });
    new MutationObserver(() => {
      if (marks.shown === undefined && document.querySelector('[role="status"]') !== null) marks.shown = performance.now();
    }).observe(document.body, { childList: true, subtree: true });
  });

  await swipe(page, SAMPLE_WORDS.casa);

  await expect(page.getByRole('status')).toHaveText(STRINGS.validWord(wordPoints('casa')));
  const marks = await page.evaluate(() => (window as unknown as { marks: { released: number; shown: number } }).marks);
  expect(marks.shown - marks.released).toBeLessThan(100);
});

test('lists found words newest first with the total', async ({ page }) => {
  // PLAY-01 AC 14, 17: CASA then LUA go to the front of "PALAVRAS ENCONTRADAS" with "+N", the total and the tally follow.
  await openNow(page);

  await swipe(page, SAMPLE_WORDS.casa);
  await expect(foundList(page)).toHaveText([`CASA${STRINGS.plusPoints(wordPoints('casa'))}`]);
  await swipe(page, SAMPLE_WORDS.lua);

  await expect(foundList(page)).toHaveText([
    `LUA${STRINGS.plusPoints(wordPoints('lua'))}`,
    `CASA${STRINGS.plusPoints(wordPoints('casa'))}`,
  ]);
  await expect(page.getByText(STRINGS.foundTotal(2))).toBeVisible();
  await expect(page.getByText(STRINGS.roundTally(2, wordPoints('casa') + wordPoints('lua')))).toBeVisible();
});

test('leaving the board releases the path', async ({ page }) => {
  // Edge Cases: the finger slides over L, U, A and off the board; that counts as lifting it, so LUA is judged.
  const room = await openNow(page);
  await slideOver(page, SAMPLE_WORDS.lua);
  const box = await boardOf(page).boundingBox();
  if (box === null) throw new Error('The board is not on screen');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 40, { steps: 4 });

  await expect(page.getByRole('status')).toHaveText(STRINGS.validWord(wordPoints('lua')));
  await expect(foundList(page)).toHaveText([`LUA${STRINGS.plusPoints(wordPoints('lua'))}`]);
  // Coming back onto the board with the button still down does not start a new path.
  const casaStart = await tileCenter(page, SAMPLE_WORDS.casa[0]);
  await page.mouse.move(casaStart.x, casaStart.y, { steps: 4 });
  await page.mouse.up();
  await expect.poll(() => room.sent().filter((msg) => msg.type === 'submit').length).toBe(1);
});

test('locks the board and shows Tempo after endsAt', async ({ page }) => {
  // PLAY-01 AC 20: at `endsAt` the timer reads 00:00, "Tempo!" shows, and a swipe adds and sends nothing.
  const now = Date.now();
  const room = await openRound(page, { startsAt: now - 1_000, endsAt: now + 1_500 });
  await expect(boardOf(page)).toBeVisible();
  await expect(page.getByRole('alert')).toBeHidden();

  await expect(page.getByRole('alert')).toHaveText(STRINGS.timeUp, { timeout: 5_000 });
  await expect(page.getByRole('timer')).toHaveText('00:00');
  await swipe(page, SAMPLE_WORDS.casa);

  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(foundList(page)).toHaveCount(0);
  await page.waitForTimeout(700);
  expect(room.sent().filter((msg) => msg.type === 'submit')).toEqual([]);
});

test('does not scroll or zoom while swiping', async ({ page }) => {
  // PLAY-01 AC 16: a real touch swipe up the board, on a page made taller than the screen, and a pinch on it,
  // neither scroll nor zoom; the swipe still forms the word.
  await openNow(page);
  await expect(boardOf(page)).toBeVisible();
  await page.evaluate(() => {
    document.body.style.paddingBottom = '200vh';
  });
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', points: { x: number; y: number }[]) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, id) => ({ ...p, id })) });

  // QUERO is the second row; the swipe goes from the bottom row up through it, as a scroll gesture would.
  const lua = await tileCenter(page, SAMPLE_WORDS.lua[0]);
  await touch('touchStart', [lua]);
  for (const tile of [8, ...SAMPLE_WORDS.quero]) {
    const to = await tileCenter(page, tile);
    await touch('touchMove', [to]);
  }
  await touch('touchEnd', []);

  // L, T, Qu, E, R, O is not a word: the phone judged the swipe, so the finger drew a path and did not scroll.
  await expect(page.getByRole('status')).toHaveText(STRINGS.invalidWord);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  const a = await tileCenter(page, 5);
  const b = await tileCenter(page, 10);
  await touch('touchStart', [a, b]);
  await touch('touchMove', [
    { x: a.x - 60, y: a.y - 60 },
    { x: b.x + 60, y: b.y + 60 },
  ]);
  await touch('touchEnd', []);
  expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('fits the whole board on screens from 320x568 to 480x932', async ({ page }) => {
  // UI-01 AC 9: with the round open, the board is square and whole on screen, and the page does not scroll.
  await openNow(page);
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 480, height: 932 },
  ]) {
    await page.setViewportSize(viewport);
    await expect
      .poll(async () => {
        const box = await boardOf(page).boundingBox();
        return box === null ? null : Math.abs(box.width - box.height) <= 1 && box.width > viewport.width / 2;
      })
      .toBe(true);
    const box = (await boardOf(page).boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    const found = (await page.getByRole('region', { name: STRINGS.foundWords }).boundingBox())!;
    expect(found.y + found.height).toBeLessThanOrEqual(viewport.height);
    const scroll = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth }));
    expect(scroll.height).toBeLessThanOrEqual(viewport.height);
    expect(scroll.width).toBeLessThanOrEqual(viewport.width);
  }
});

test('colors each verdict and shakes an invalid word', async ({ page }) => {
  // PLAY-01 AC 7-10, phone-feedbacks.png: valid green, already found yellow, invalid red with the word shaking,
  // too short grey; each pill's background is its theme token.
  await openNow(page);
  await expect(boardOf(page)).toBeVisible();
  const verdicts = [
    { tiles: SAMPLE_WORDS.casa, kind: 'valid', token: '--color-valid' },
    { tiles: [0, 5, 6], kind: 'invalid', token: '--color-invalid' },
    { tiles: SAMPLE_WORDS.casa, kind: 'already-found', token: '--color-already-found' },
    { tiles: [0, 1], kind: 'too-short', token: '--color-too-short' },
  ];

  for (const { tiles, kind, token } of verdicts) {
    await swipe(page, tiles);
    const pill = page.getByRole('status');
    await expect(pill).toHaveClass(`feedback-pill feedback-pill--${kind}`);
    const background = await pill.evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(background).toBe(await tokenColor(page, token));
    const word = page.locator('.word-rack__word');
    const animation = await word.evaluate((element) => getComputedStyle(element).animationName);
    expect(animation).toBe(kind === 'invalid' ? 'word-rack-shake' : 'none');
    await expect(pill).toHaveCount(0);
  }
});

/** The computed color of a theme token, read the way the browser resolves it on a background. */
function tokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  }, token);
}
