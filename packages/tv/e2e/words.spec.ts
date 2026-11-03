import type { RoundResultsMessage, ServerMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import { ANA, BETO, lobbyWelcome, roundWelcome, SAMPLE_END, sampleResults } from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

/** When the list opens, with the results at the end of the round. */
const WORDS_START = SAMPLE_END + TIME_UP_MS;

/** Far longer than any list: the TV must still be on the words after it (WORDCTL-01 AC 3, 9). */
const LONG_WAIT_MS = 120_000;

/** Measures on the screen are in CSS pixels, rounded by the layout. */
const PX_TOLERANCE = 1;

/** `count` shared words, every one a different word of the same length, so every row has the same height. */
function manyWords(count: number, overrides: Partial<RoundResultsMessage> = {}): RoundResultsMessage {
  const shared = Array.from({ length: count }, (_, index) => ({ word: `w${String(index).padStart(3, '0')}`, points: 1, foundBy: [ANA.id, BETO.id] }));
  return { ...sampleResults(), shared, players: [], ...overrides };
}

/** The end of a round as the server sends it to the TV: the results, then the words stage (WORDCTL-01). */
function endRound(room: FakeRoom, results: RoundResultsMessage): void {
  room.push(results);
  room.push({ type: 'phase', phase: 'words' });
}

/** Opens the TV at the end of the round and ends it with `results`, already past "Tempo!". */
async function openWords(page: Page, results: RoundResultsMessage) {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  endRound(room, results);
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return room;
}

/** Moves the page's clock to `elapsedMs` after the list opened. */
async function goTo(page: Page, elapsedMs: number) {
  const now = await page.evaluate(() => Date.now());
  await page.clock.runFor(WORDS_START + elapsedMs - now);
}

/** Ends every running transition, so the list and the rows stand where they are heading. */
async function finishMoves(page: Page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish();
  });
}

/** The panel that clips the list. */
async function panelBox(page: Page) {
  return (await page.getByTestId('word-scroll').boundingBox())!;
}

/** The middle of word row `index`, from the top of the panel. */
async function rowMiddleInPanel(page: Page, index: number) {
  const panel = await panelBox(page);
  const row = (await page.getByTestId('word-row').nth(index).boundingBox())!;
  return row.y + row.height / 2 - panel.y;
}

test('shows the words after two seconds of "Tempo!"', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();

  endRound(room, sampleResults());
  await page.clock.runFor(TIME_UP_MS - TICK_MS);
  await expect(page.getByTestId('time-up')).toBeVisible();
  await expect(page.getByTestId('words-screen')).toHaveCount(0);

  await page.clock.runFor(TICK_MS * 2);
  await expect(page.getByTestId('words-screen')).toBeVisible();
});

test('keeps the totals in place while scrolling', async ({ page }) => {
  await openWords(page, manyWords(100, { possibleWords: 142 }));
  const totals = page.getByTestId('word-totals');
  const list = page.getByTestId('word-list');
  await expect(totals).toContainText('142');
  await expect(totals).toContainText('100');
  const totalsBefore = await totals.boundingBox();
  const listBefore = await list.boundingBox();

  // The list moves with the server clock, which the test holds (WORDCTL-01 AC 1).
  await goTo(page, 5_500);
  await expect.poll(async () => (await list.boundingBox())!.y).toBeLessThan(listBefore!.y);

  expect(await totals.boundingBox()).toEqual(totalsBefore);
});

test('scrolls one line a second', async ({ page }) => {
  // WORDCTL-01 AC 1: measured on the screen, rows of one height go up one row each second.
  await openWords(page, manyWords(100));
  const list = page.getByTestId('word-list');
  const rows = page.getByTestId('word-row');
  // Two rows far from the highlight, whose scale is not layout, with the list standing still.
  await finishMoves(page);
  const rowPitch = (await rows.nth(51).boundingBox())!.y - (await rows.nth(50).boundingBox())!.y;

  await goTo(page, 10_500);
  await finishMoves(page);
  const atTen = (await list.boundingBox())!.y;
  await goTo(page, 11_500);
  await finishMoves(page);
  const atEleven = (await list.boundingBox())!.y;
  await goTo(page, 14_500);
  await finishMoves(page);
  const atFourteen = (await list.boundingBox())!.y;

  expect(atTen - atEleven).toBeCloseTo(rowPitch, 0);
  expect(atTen - atFourteen).toBeCloseTo(4 * rowPitch, 0);
});

test('stops with the last word whole and stays on the words', async ({ page }) => {
  // WORDCTL-01 AC 3, 9: the list ends with its last word whole in the panel, and nothing opens the result by itself.
  await openWords(page, manyWords(30));
  const last = page.getByTestId('word-row').last();
  const panel = await panelBox(page);
  expect((await last.boundingBox())!.y).toBeGreaterThan(panel.y + panel.height);

  await goTo(page, 40_500);
  await finishMoves(page);
  const stopped = (await page.getByTestId('word-list').boundingBox())!;
  const shown = (await last.boundingBox())!;
  expect(shown.y).toBeGreaterThanOrEqual(panel.y);
  expect(shown.y + shown.height).toBeLessThanOrEqual(panel.y + panel.height);
  expect(stopped.y + stopped.height).toBeCloseTo(panel.y + panel.height, 0);

  await page.clock.runFor(LONG_WAIT_MS);
  await finishMoves(page);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await expect(page.getByTestId('result-screen')).toHaveCount(0);
  expect((await page.getByTestId('word-list').boundingBox())!.y).toBe(stopped.y);
});

test('does not move a list that fits', async ({ page }) => {
  await openWords(page, manyWords(2));
  const list = page.getByTestId('word-list');
  const before = await list.boundingBox();

  await goTo(page, 5_500);
  await finishMoves(page);

  expect(await list.boundingBox()).toEqual(before);
});

test('moves half a panel down at the host down and stops the automatic scroll', async ({ page }) => {
  // WORDCTL-01 AC 5, 16: the list goes half a panel past where it was, the word on the reading line half a panel up,
  // and it stays there with no word highlighted while the clock goes on.
  const room = await openWords(page, manyWords(100));
  await goTo(page, 10_000);
  const panel = await panelBox(page);

  room.push({ type: 'scroll', direction: 'down' });
  await page.clock.runFor(TICK_MS);
  await finishMoves(page);

  expect(await rowMiddleInPanel(page, 10)).toBeCloseTo(panel.height / 3 - panel.height / 2, 0);
  const stopped = (await page.getByTestId('word-list').boundingBox())!.y;
  await goTo(page, 30_500);
  await finishMoves(page);
  expect((await page.getByTestId('word-list').boundingBox())!.y).toBe(stopped);
  await expect(page.locator('.word-row--highlighted')).toHaveCount(0);
});

test('moves half a panel up at the host up', async ({ page }) => {
  // WORDCTL-01 AC 6: the word on the reading line goes half a panel down.
  const room = await openWords(page, manyWords(100));
  await goTo(page, 20_000);
  const panel = await panelBox(page);

  room.push({ type: 'scroll', direction: 'up' });
  await page.clock.runFor(TICK_MS);
  await finishMoves(page);

  expect(await rowMiddleInPanel(page, 20)).toBeCloseTo(panel.height / 3 + panel.height / 2, 0);
  await expect(page.locator('.word-row--highlighted')).toHaveCount(0);
});

test('stops the steps of the host at the top and with the last word whole', async ({ page }) => {
  // WORDCTL-01 AC 7: two steps up from near the top end at the top; many steps down end with the last word whole.
  const room = await openWords(page, manyWords(30));
  const panel = await panelBox(page);
  const list = page.getByTestId('word-list');
  await goTo(page, 3_000);

  room.push({ type: 'scroll', direction: 'up' });
  room.push({ type: 'scroll', direction: 'up' });
  await page.clock.runFor(TICK_MS);
  await finishMoves(page);
  expect((await list.boundingBox())!.y).toBeCloseTo(panel.y, 0);

  for (let step = 0; step < 10; step++) room.push({ type: 'scroll', direction: 'down' });
  await page.clock.runFor(TICK_MS);
  await finishMoves(page);
  const end = (await list.boundingBox())!;
  expect(end.y + end.height).toBeCloseTo(panel.y + panel.height, 0);
});

test('shows the result when the host shows it', async ({ page }) => {
  // WORDCTL-01 AC 8-9: the words stay for as long as the host waits, and the phase results opens the result.
  const room = await openWords(page, manyWords(10));
  await page.clock.runFor(LONG_WAIT_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();

  room.push({ type: 'phase', phase: 'results' });

  await expect(page.getByTestId('result-screen')).toBeVisible();
  await expect(page.getByTestId('words-screen')).toHaveCount(0);
});

test('restarts the list from the top with the automatic scroll after a reload', async ({ page }) => {
  // WORDCTL-01 AC 11: the place of the list lives only on the TV, so a reload opens it again from the top.
  const results = manyWords(100);
  const room = await openWords(page, results);
  await goTo(page, 20_500);
  await finishMoves(page);
  const first = page.getByTestId('word-row').first();
  expect((await first.boundingBox())!.y).toBeLessThan((await panelBox(page)).y);

  await page.reload();
  await expect(page.getByTestId('round-screen')).toBeVisible();
  endRound(room, results);
  await page.clock.runFor(TICK_MS);

  await expect(page.getByTestId('words-screen')).toBeVisible();
  await finishMoves(page);
  const panel = await panelBox(page);
  expect((await first.boundingBox())!.y).toBeGreaterThanOrEqual(panel.y);
  await expect(page.getByTestId('word-row').first()).toHaveClass(/word-row--highlighted/);
  await page.clock.runFor(10_000);
  await finishMoves(page);
  expect((await first.boundingBox())!.y).toBeLessThan(panel.y);
});

test('highlights with color and scale only, without moving the other words', async ({ page }) => {
  // WORDCTL-01 AC 13, 17: in a list that fits, the highlight goes from the first word to the second; every row keeps its
  // place in the layout, and the highlighted one differs only in color and scale.
  await openWords(page, manyWords(4));
  const rows = page.getByTestId('word-row');
  const layout = () => rows.evaluateAll((elements) => elements.map((row) => [(row as HTMLElement).offsetTop, (row as HTMLElement).offsetHeight]));
  const style = (index: number) =>
    rows.nth(index).evaluate((row) => ({ background: getComputedStyle(row).backgroundColor, transform: getComputedStyle(row).transform }));
  await finishMoves(page);
  const plainFirst = await style(2);
  const layoutBefore = await layout();
  const othersBefore = [await rows.nth(2).boundingBox(), await rows.nth(3).boundingBox()];
  await expect(rows.nth(0)).toHaveClass(/word-row--highlighted/);
  const highlightedFirst = await style(0);

  await goTo(page, 1_500);
  await finishMoves(page);

  await expect(rows.nth(1)).toHaveClass(/word-row--highlighted/);
  await expect(rows.nth(0)).not.toHaveClass(/word-row--highlighted/);
  expect(highlightedFirst.background).not.toBe(plainFirst.background);
  expect(highlightedFirst.transform).not.toBe('none');
  expect(await style(0)).toEqual(plainFirst);
  expect(await layout()).toEqual(layoutBefore);
  expect([await rows.nth(2).boundingBox(), await rows.nth(3).boundingBox()]).toEqual(othersBefore);
});

test('scrolls to the end and waits while the host is away', async ({ page }) => {
  // Edge Cases: with the host disconnected, the list goes on by itself to its end and waits there.
  const room = await openWords(page, manyWords(30));
  room.push({ type: 'players', players: [{ ...ANA, connected: false }, BETO], hostId: ANA.id });

  await goTo(page, 40_500);
  await page.clock.runFor(LONG_WAIT_MS);
  await finishMoves(page);

  const panel = await panelBox(page);
  const last = (await page.getByTestId('word-row').last().boundingBox())!;
  expect(last.y).toBeGreaterThanOrEqual(panel.y);
  expect(last.y + last.height).toBeLessThanOrEqual(panel.y + panel.height + PX_TOLERANCE);
  await expect(page.getByTestId('words-screen')).toBeVisible();
});

test('says when no word was found and waits for the host', async ({ page }) => {
  // Edge Cases: "Nenhuma palavra encontrada" stays until "Ver resultado".
  const room = await openWords(page, manyWords(0, { possibleWords: 142 }));
  await expect(page.getByText('Nenhuma palavra encontrada')).toBeVisible();
  await expect(page.getByTestId('word-totals')).toContainText('142');

  await page.clock.runFor(LONG_WAIT_MS);
  await expect(page.getByText('Nenhuma palavra encontrada')).toBeVisible();

  room.push({ type: 'phase', phase: 'results' });
  await expect(page.getByTestId('result-screen')).toBeVisible();
});

test('follows the host during the scroll', async ({ page }) => {
  // WORDCTL-01 AC 8, Edge Cases: "Ver resultado" in the middle and at the end of a match, and back to the lobby.
  const cases: { name: string; results: RoundResultsMessage; message: ServerMessage; screen: string }[] = [
    { name: 'show-result', results: manyWords(100), message: { type: 'phase', phase: 'results' }, screen: 'result-screen' },
    { name: 'show-result on the last round', results: manyWords(100, { last: true }), message: { type: 'podium', ranking: [] }, screen: 'result-screen' },
    { name: 'back-to-lobby', results: manyWords(100), message: lobbyWelcome([ANA, BETO], ANA.id), screen: 'lobby-screen' },
  ];

  for (const { name, results, message, screen } of cases) {
    const fresh = await page.context().newPage();
    const room = await openWords(fresh, results);
    await expect(fresh.getByTestId('words-screen'), name).toBeVisible();

    room.push(message);

    await expect(fresh.getByTestId(screen), name).toBeVisible();
    await expect(fresh.getByTestId('words-screen'), name).toHaveCount(0);
    await fresh.close();
  }
});

test('takes the last round through the words before the result', async ({ page }) => {
  // WORDCTL-01 AC 9, SYNC-01 AC 3: the podium waits for "Ver resultado" like any round.
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();

  endRound(room, manyWords(2, { last: true }));

  await expect(page.getByTestId('time-up')).toBeVisible();
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await page.clock.runFor(LONG_WAIT_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  room.push({ type: 'podium', ranking: [] });
  await expect(page.getByTestId('result-screen')).toBeVisible();
});

test('does not restart the scroll when a reconnect brings the same results', async ({ page }) => {
  // TVEXIT-01 AC 7: a reconnect on the words keeps the plan, so the list goes on from where it was.
  const results = manyWords(100);
  const room = await openWords(page, results);
  await goTo(page, 20_500);
  await finishMoves(page);
  const first = page.getByTestId('word-row').first();
  const before = (await first.boundingBox())!.y;

  room.push({ ...roundWelcome([ANA, BETO], ANA.id), phase: 'words' });
  room.push(results);
  await page.clock.runFor(TICK_MS);
  await finishMoves(page);

  await expect(page.getByTestId('words-screen')).toBeVisible();
  expect((await first.boundingBox())!.y).toBeLessThanOrEqual(before);
});

test('keeps the words of a player removed during the scroll', async ({ page }) => {
  const room = await openWords(page, manyWords(100));
  const circles = page.getByTestId('word-row').first().locator('.player-circle');
  await expect(circles).toHaveCount(2);

  room.push({ type: 'players', players: [ANA], hostId: ANA.id });

  await expect(page.getByTestId('word-row')).toHaveCount(100);
  await expect(circles).toHaveCount(2);
});

test('fits the words with a long list at both ends of the screens', async ({ page }) => {
  for (const screen of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }]) {
    const fresh = await page.context().newPage();
    await fresh.setViewportSize(screen);
    await openWords(fresh, manyWords(100));
    const { pageFits, totalsBottom, panelBottom } = await fresh.evaluate(() => {
      const root = document.documentElement;
      return {
        pageFits: root.scrollHeight <= innerHeight && root.scrollWidth <= innerWidth,
        totalsBottom: document.querySelector('[data-testid="word-totals"]')!.getBoundingClientRect().bottom,
        panelBottom: document.querySelector('[data-testid="word-scroll"]')!.getBoundingClientRect().bottom,
      };
    });
    expect(pageFits, `${screen.width}x${screen.height}`).toBe(true);
    expect(totalsBottom).toBeLessThan(panelBottom);
    expect(panelBottom).toBeLessThanOrEqual(screen.height);
    await fresh.close();
  }
});
