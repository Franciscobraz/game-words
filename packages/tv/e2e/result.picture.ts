import { expect, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { picturePath, pictureWindow } from './pictures.ts';
import { resultPlayers, roundWelcome, SAMPLE_END, sampleResults } from './samples.ts';

// tv-round-result.png has 1920x1080 px.
test.use(pictureWindow(1));

/** "Tempo!", the 13 words of the capture, the wait, and the six tiles of TERNOS lit. */
const UNTIL_ALL_LIT_MS = 2_000 + 6_500 + 5_000 + 6 * 400;

test('tv-round-result', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const players = resultPlayers();
  const room = await fakeRoom(page, roundWelcome(players, players[0]!.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  room.push(sampleResults());
  await page.clock.runFor(UNTIL_ALL_LIT_MS);
  await expect(page.getByTestId('result-screen')).toBeVisible();
  await expect(page.locator('.board-grid__tile--lit')).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: picturePath('tv-round-result'), animations: 'disabled' });
});
