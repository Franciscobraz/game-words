import { expect, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { picturePath, pictureWindow } from './pictures.ts';
import { resultPlayers, resultRoundResults, roundWelcome, SAMPLE_END } from './samples.ts';

// m4-1-playtest's tv-round-result.png has 3840x2160 px.
test.use(pictureWindow(2));

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** The six tiles of TERNOS lit, one every 400 ms (TVRES-01 AC 5). */
const UNTIL_ALL_LIT_MS = 6 * 400;

test('tv-round-result', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const players = resultPlayers();
  const room = await fakeRoom(page, roundWelcome(players, players[0]!.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  room.push(resultRoundResults());
  room.push({ type: 'phase', phase: 'words' });
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();

  // The host's "Ver resultado" (WORDCTL-01 AC 8).
  room.push({ type: 'phase', phase: 'results' });
  await page.clock.runFor(UNTIL_ALL_LIT_MS);
  await expect(page.getByTestId('result-screen')).toBeVisible();
  await expect(page.locator('.board-grid__tile--lit')).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: picturePath('tv-round-result', 'm4-1-playtest'), animations: 'disabled' });
});
