import { COUNTDOWN_MS } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, roundWelcome, SAMPLE_END, SAMPLE_START } from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** Opens the TV with the clock stopped at `at`, in the round that starts at `SAMPLE_START`. */
async function openRound(page: Page, at: number, welcome = roundWelcome([ANA, BETO, CAIO], ANA.id)) {
  await page.clock.install({ time: at });
  await page.clock.pauseAt(at);
  const room = await fakeRoom(page, welcome);
  await page.goto('/');
  return room;
}

test('hides the board during the countdown', async ({ page }) => {
  await openRound(page, SAMPLE_START - COUNTDOWN_MS);
  const screen = page.getByTestId('countdown-screen');

  await expect(page.getByText('RODADA 1 DE 3')).toBeVisible();
  await expect(page.getByTestId('countdown-number')).toHaveText('3');
  await expect(screen).toHaveText('RODADA 1 DE 33');
  await expect(page.getByTestId('board')).toHaveCount(0);

  await page.clock.runFor(1_000 + TICK_MS);
  await expect(page.getByTestId('countdown-number')).toHaveText('2');
  await page.clock.runFor(1_000);
  await expect(page.getByTestId('countdown-number')).toHaveText('1');
  await expect(page.getByTestId('board')).toHaveCount(0);
});

test('keeps the countdown at the right number after coming back', async ({ page }) => {
  await openRound(page, SAMPLE_START - 1_500);

  await expect(page.getByTestId('countdown-number')).toHaveText('2');
});

test('shows the board and the time left at the start', async ({ page }) => {
  await openRound(page, SAMPLE_START);

  await expect(page.getByTestId('round-screen')).toBeVisible();
  await expect(page.getByTestId('round-clock')).toHaveText('2:00');
  await expect(page.getByTestId('board').locator('.board-grid__tile').nth(4)).toHaveText('Qu');
  await expect(page.getByText('RODADA 1 DE 3')).toBeVisible();
});

test('turns the timer to the alert color at ten seconds', async ({ page }) => {
  await openRound(page, SAMPLE_END - 10_500);
  const clock = page.getByTestId('round-clock');
  await expect(clock).toHaveText('0:11');
  await expect(clock).not.toHaveClass(/round__clock--alert/);

  await page.clock.runFor(500 + TICK_MS);

  await expect(clock).toHaveText('0:10');
  await expect(clock).toHaveClass(/round__clock--alert/);
  const animation = await clock.evaluate((element) => getComputedStyle(element).animationName);
  expect(animation).toBe('round-clock-pulse');
});

test('updates the word counts without the words', async ({ page }) => {
  const room = await openRound(page, SAMPLE_START + 1_000);
  const beto = page.getByTestId(`round-player-${BETO.id}`);
  await expect(beto).toContainText('0');
  await expect(beto).toContainText('palavras');

  room.push({
    type: 'counts',
    counts: [
      { playerId: ANA.id, count: 14 },
      { playerId: BETO.id, count: 1 },
    ],
  });

  await expect(page.getByTestId(`round-player-${ANA.id}`)).toContainText('14');
  await expect(beto).toContainText('1');
  await expect(beto).toContainText('palavra');
  await expect(beto).not.toContainText('palavras');
  // The whole text of a line: the initial, the nickname, the number and the label, and no word.
  await expect(beto).toHaveText('BBeto1palavra');
});

test('lists only who plays, in the right columns, with the tags', async ({ page }) => {
  const players = [ANA, BETO, CAIO, DUDA];
  await openRound(page, SAMPLE_START + 1_000, roundWelcome(players, ANA.id));

  await expect(page.getByTestId(`round-player-${ANA.id}`)).toContainText('ANFITRIÃO(Ã)');
  await expect(page.getByTestId(`round-player-${CAIO.id}`)).toContainText('DESCONECTADO');
  await expect(page.getByTestId(`round-player-${CAIO.id}`)).toHaveClass(/round-player--dimmed/);
  await expect(page.getByTestId(`round-player-${DUDA.id}`)).toHaveCount(0);
});

test('fits larger boards in the same square', async ({ page }) => {
  const sizes = [4, 5, 6] as const;
  const measures: { board: { width: number; height: number }; tile: number; tiles: number }[] = [];

  for (const size of sizes) {
    const board = Array.from({ length: size }, () => Array.from({ length: size }, () => 'a'));
    const welcome = roundWelcome([ANA], ANA.id, board);
    const fresh = await page.context().newPage();
    await fresh.clock.install({ time: SAMPLE_START + 1_000 });
    await fresh.clock.pauseAt(SAMPLE_START + 1_000);
    await fakeRoom(fresh, { ...welcome, settings: { ...welcome.settings, size } });
    await fresh.goto('/');
    const grid = fresh.getByTestId('board');
    await expect(grid).toBeVisible();
    const box = (await grid.boundingBox())!;
    const tile = (await grid.locator('.board-grid__tile').first().boundingBox())!;
    const last = (await grid.locator('.board-grid__tile').last().boundingBox())!;
    expect(last.y + last.height, `${size}x${size} stays inside`).toBeLessThanOrEqual(box.y + box.height);
    measures.push({ board: { width: box.width, height: box.height }, tile: tile.width, tiles: await grid.locator('.board-grid__tile').count() });
    await fresh.close();
  }

  const [four, five, six] = measures;
  expect(four!.tiles).toBe(16);
  expect(five!.tiles).toBe(25);
  expect(six!.tiles).toBe(36);
  expect(five!.board).toEqual(four!.board);
  expect(six!.board).toEqual(four!.board);
  expect(five!.tile).toBeLessThan(four!.tile);
  expect(six!.tile).toBeLessThan(five!.tile);
});

test('fits the round with ten players at both ends of the screens', async ({ page }) => {
  const players = Array.from({ length: 10 }, (_, index) => ({ ...ANA, id: `p${index}`, nickname: `Maximiliano${index}` }));
  await openRound(page, SAMPLE_START + 1_000, roundWelcome(players, 'p0'));
  await expect(page.getByTestId('round-player-p9')).toBeVisible();

  for (const screen of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(screen);

    const fits = await page.evaluate(() => {
      const root = document.documentElement;
      const lastCard = document.querySelector('[data-testid="round-player-p9"]')!.getBoundingClientRect();
      return root.scrollHeight <= innerHeight && root.scrollWidth <= innerWidth && lastCard.bottom <= innerHeight && lastCard.right <= innerWidth;
    });
    expect(fits, `${screen.width}x${screen.height}`).toBe(true);
  }
});
