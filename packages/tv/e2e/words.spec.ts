import type { RoundResultsMessage, ServerMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { ANA, BETO, lobbyWelcome, roundWelcome, SAMPLE_BOARD, SAMPLE_END, sampleResults } from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

/** The wait with the last word in view (TVWORDS-01 AC 8). */
const HOLD_MS = 5_000;

const WORDS_START = SAMPLE_END + TIME_UP_MS;

/** `count` shared words, every one a different word of the same length. */
function manyWords(count: number, overrides: Partial<RoundResultsMessage> = {}): RoundResultsMessage {
  const shared = Array.from({ length: count }, (_, index) => ({ word: `w${String(index).padStart(3, '0')}`, points: 1, foundBy: [ANA.id, BETO.id] }));
  return { ...sampleResults(), shared, players: [], ...overrides };
}

/** Opens the TV at the end of the round and pushes `results`, already past "Tempo!". */
async function openWords(page: Page, results: RoundResultsMessage) {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  room.push(results);
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  return room;
}

/** The browser's running transition of the list. */
async function finishScroll(page: Page) {
  await page.getByTestId('word-list').evaluate((list) => {
    for (const animation of list.getAnimations()) animation.finish();
  });
}

test('shows the words after two seconds of "Tempo!"', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();

  room.push(sampleResults());
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

  await expect.poll(async () => (await list.boundingBox())!.y).toBeLessThan(listBefore!.y);

  expect(await totals.boundingBox()).toEqual(totalsBefore);
});

test('scrolls until the last word is in view', async ({ page }) => {
  await openWords(page, manyWords(30));
  const scroll = page.getByTestId('word-scroll');
  const last = page.getByTestId('word-row').last();
  const duration = await page.getByTestId('word-list').evaluate((list) => getComputedStyle(list).transitionDuration);
  expect(duration).toBe('15s');
  const panel = (await scroll.boundingBox())!;
  expect((await last.boundingBox())!.y).toBeGreaterThan(panel.y + panel.height);

  await finishScroll(page);

  const shown = (await last.boundingBox())!;
  expect(shown.y).toBeGreaterThanOrEqual(panel.y);
  expect(shown.y + shown.height).toBeLessThanOrEqual(panel.y + panel.height);

  // Waits the whole scroll and the 5 s by itself, and only then goes on (TVWORDS-01 AC 8).
  await page.clock.runFor(15_000 + HOLD_MS - TICK_MS * 2);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await page.clock.runFor(TICK_MS * 2);
  await expect(page.getByTestId('result-screen')).toBeVisible();
});

test('does not move a list that fits', async ({ page }) => {
  await openWords(page, manyWords(2));
  const list = page.getByTestId('word-list');
  const before = await list.boundingBox();

  await finishScroll(page);

  expect(await list.boundingBox()).toEqual(before);
});

test('says when no word was found', async ({ page }) => {
  await openWords(page, manyWords(0, { possibleWords: 142 }));
  await expect(page.getByText('Nenhuma palavra encontrada')).toBeVisible();
  await expect(page.getByTestId('word-totals')).toContainText('142');

  await page.clock.runFor(HOLD_MS - TICK_MS * 2);
  await expect(page.getByText('Nenhuma palavra encontrada')).toBeVisible();

  await page.clock.runFor(TICK_MS * 2);
  await expect(page.getByTestId('result-screen')).toBeVisible();
});

test('follows the host during the scroll', async ({ page }) => {
  const nextRound: ServerMessage = {
    type: 'round-start',
    id: 2,
    index: 1,
    board: SAMPLE_BOARD,
    startsAt: WORDS_START + 60_000,
    endsAt: WORDS_START + 180_000,
    salt: 'sample-salt',
  };
  const cases: { name: string; results: RoundResultsMessage; message: ServerMessage; screen: string }[] = [
    { name: 'next', results: manyWords(100), message: nextRound, screen: 'countdown-screen' },
    { name: 'play-again', results: manyWords(100, { last: true }), message: nextRound, screen: 'countdown-screen' },
    { name: 'back-to-lobby', results: manyWords(100, { last: true }), message: lobbyWelcome([ANA, BETO], ANA.id), screen: 'lobby-screen' },
  ];

  for (const { name, results, message, screen } of cases) {
    const fresh = await page.context().newPage();
    const room = await openWords(fresh, results);
    if (results.last) room.push({ type: 'podium', ranking: [] });
    await expect(fresh.getByTestId('words-screen'), name).toBeVisible();

    room.push(message);

    await expect(fresh.getByTestId(screen), name).toBeVisible();
    await expect(fresh.getByTestId('words-screen'), name).toHaveCount(0);
    await fresh.close();
  }
});

test('takes the last round through the words before the result', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();

  room.push(manyWords(2, { last: true }));
  room.push({ type: 'podium', ranking: [] });

  await expect(page.getByTestId('time-up')).toBeVisible();
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await page.clock.runFor(1_000 + HOLD_MS);
  await expect(page.getByTestId('result-screen')).toBeVisible();
});

test('restarts the scroll after a reload', async ({ page }) => {
  const results = manyWords(100);
  const room = await openWords(page, results);
  await finishScroll(page);
  const first = page.getByTestId('word-row').first();
  const panelBefore = (await page.getByTestId('word-scroll').boundingBox())!;
  expect((await first.boundingBox())!.y).toBeLessThan(panelBefore.y);

  await page.reload();
  await expect(page.getByTestId('round-screen')).toBeVisible();
  room.push(results);
  await page.clock.runFor(TIME_UP_MS + TICK_MS);

  await expect(page.getByTestId('words-screen')).toBeVisible();
  const panel = (await page.getByTestId('word-scroll').boundingBox())!;
  const firstAgain = (await page.getByTestId('word-row').first().boundingBox())!;
  expect(firstAgain.y).toBeGreaterThanOrEqual(panel.y);
  const elapsed = await page.getByTestId('word-list').evaluate((list) => list.getAnimations()[0]?.currentTime ?? null);
  expect(elapsed).not.toBeNull();
  expect(Number(elapsed)).toBeLessThan(10_000);
});

test('does not restart the scroll when a reconnect brings the same results', async ({ page }) => {
  const results = manyWords(100);
  const room = await openWords(page, results);
  const list = page.getByTestId('word-list');
  await list.evaluate((element) => {
    for (const animation of element.getAnimations()) animation.currentTime = 20_000;
  });

  room.push({ ...roundWelcome([ANA, BETO], ANA.id), phase: 'results' });
  room.push(results);

  await expect(page.getByTestId('words-screen')).toBeVisible();
  const elapsed = await list.evaluate((element) => element.getAnimations()[0]?.currentTime ?? null);
  expect(Number(elapsed)).toBeGreaterThanOrEqual(20_000);
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
