import { type ClientMessage, type ServerMessage, type Settings, wordPoints } from '@bwords/core';
import { type CDPSession, expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom } from './fake-room.ts';
import { boardOf, openRound, tileCenter } from './round-room.ts';
import { ANA, BETO, lobbyWelcome, SAMPLE_CODE, SAMPLE_WORDS } from './samples.ts';
import { SCREEN_STATES } from './screen-states.ts';

// A mobile browser reads the viewport meta and zooms on a double tap or a pinch; desktop Chrome does neither (design,
// Tech Decisions). The proof on a real iPhone is the user's walk (C109).
test.use({ isMobile: true });

/** Where a double tap lands on each screen: near the top, in the middle and near the bottom. */
const TAP_SPOTS = [
  { x: 0.5, y: 0.15 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: 0.85 },
] as const;

/** The pinch: the fingers start this far from the middle and move apart in steps. */
const PINCH_START_PX = 20;
const PINCH_STEP_PX = 10;
const PINCH_STEPS = 10;

/** The page's zoom: 1 when nothing zoomed in. */
function zoomOf(page: Page): Promise<number> {
  return page.evaluate(() => window.visualViewport?.scale ?? 1);
}

/** Two taps of one finger at `point`, one right after the other, from the touch screen. */
async function doubleTap(cdp: CDPSession, point: { x: number; y: number }): Promise<void> {
  for (let tap = 0; tap < 2; tap += 1) {
    await touch(cdp, 'touchStart', [point]);
    await touch(cdp, 'touchEnd', []);
  }
}

/** Touch points of fingers on the screen, as the browser gets them from a touch screen. */
function touch(cdp: CDPSession, type: 'touchStart' | 'touchMove' | 'touchEnd', points: readonly { x: number; y: number }[]) {
  return cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p, id) => ({ x: Math.round(p.x), y: Math.round(p.y), id })) });
}

/** Two fingers that start close around `at` and move apart: the gesture that zooms in. */
async function pinchOut(cdp: CDPSession, at: { x: number; y: number }): Promise<void> {
  const fingers = (spread: number) => [
    { x: at.x - spread, y: at.y },
    { x: at.x + spread, y: at.y },
  ];
  await touch(cdp, 'touchStart', fingers(PINCH_START_PX));
  for (let step = 1; step <= PINCH_STEPS; step += 1) await touch(cdp, 'touchMove', fingers(PINCH_START_PX + step * PINCH_STEP_PX));
  await touch(cdp, 'touchEnd', []);
}

/** Whether the browser is told not to zoom on a double tap at `point`: the element there, or one around it, has a touch action. */
function blocksDoubleTapZoom(page: Page, point: { x: number; y: number }): Promise<boolean> {
  return page.evaluate(({ x, y }) => {
    for (let el = document.elementFromPoint(x, y); el !== null; el = el.parentElement) {
      if (getComputedStyle(el).touchAction !== 'auto') return true;
    }
    return false;
  }, point);
}

/** Lets the browser finish any zoom animation before the scale is read. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

for (const state of SCREEN_STATES) {
  test(`keeps the zoom at one after a double tap anywhere: ${state.name}`, async ({ page }) => {
    // NOZOOM-01 AC 1.
    await state.open(page);
    const cdp = await page.context().newCDPSession(page);
    const window = page.viewportSize()!;

    for (const spot of TAP_SPOTS) {
      const point = { x: Math.round(window.width * spot.x), y: Math.round(window.height * spot.y) };
      // Chromium already skips the double tap zoom on a page sized to the phone; Safari on iOS needs the touch action.
      expect(await blocksDoubleTapZoom(page, point), `${state.name} at ${spot.x},${spot.y}`).toBe(true);
      await doubleTap(cdp, point);
      await settle(page);
      expect(await zoomOf(page), `${state.name} at ${spot.x},${spot.y}`).toBe(1);
    }
  });
}

test('keeps the zoom at one after a pinch', async ({ page }) => {
  // NOZOOM-01 AC 2: two fingers spread over the top bar and over the board, then one finger still swipes a word.
  const now = Date.now();
  await openRound(page, { startsAt: now - 1_000, endsAt: now + 120_000 });
  await expect(boardOf(page)).toBeVisible();
  const cdp = await page.context().newCDPSession(page);
  const window = page.viewportSize()!;
  const board = (await boardOf(page).boundingBox())!;

  for (const at of [
    { x: window.width / 2, y: window.height * 0.08 },
    { x: board.x + board.width / 2, y: board.y + board.height / 2 },
  ]) {
    await pinchOut(cdp, at);
    await settle(page);
    expect(await zoomOf(page), `pinch at ${Math.round(at.x)},${Math.round(at.y)}`).toBe(1);
  }

  await touch(cdp, 'touchStart', [await tileCenter(page, SAMPLE_WORDS.casa[0]!)]);
  for (const tile of SAMPLE_WORDS.casa.slice(1)) await touch(cdp, 'touchMove', [await tileCenter(page, tile)]);
  await touch(cdp, 'touchEnd', []);
  await expect(page.getByRole('status')).toHaveText(STRINGS.validWord(wordPoints('casa')));
});

test('counts each tap of a double tap', async ({ page }) => {
  // NOZOOM-01 AC 3: a double tap on "+" of the rounds takes them from 1 to 3; the room echoes each change.
  const welcome = lobbyWelcome([ANA, BETO], ANA.id);
  let settings: Settings = { ...welcome.settings, rounds: 1 };
  const room = await fakeRoom(page, (msg: ClientMessage) => {
    if (msg.type === 'hello') return { replies: [{ ...welcome, settings }] };
    if (msg.type !== 'settings') return { replies: [] };
    settings = { ...settings, ...msg.patch };
    const reply: ServerMessage = { type: 'settings', settings };
    return { replies: [reply] };
  });
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();
  const rounds = page.getByLabel(STRINGS.rounds, { exact: true });
  await expect(rounds).toHaveText('1');
  const plus = (await page.getByRole('button', { name: STRINGS.increase(STRINGS.rounds) }).boundingBox())!;
  const cdp = await page.context().newCDPSession(page);

  await doubleTap(cdp, { x: Math.round(plus.x + plus.width / 2), y: Math.round(plus.y + plus.height / 2) });

  await expect(rounds).toHaveText('3');
  expect(room.sent().filter((msg) => msg.type === 'settings')).toEqual([
    { type: 'settings', patch: { rounds: 2 } },
    { type: 'settings', patch: { rounds: 3 } },
  ]);
  expect(await zoomOf(page)).toBe(1);
});
