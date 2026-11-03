import { expect, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { picturePath, pictureWindow } from './pictures.ts';
import { ANA, roundWelcome, SAMPLE_END, wordsCaptureResults, wordsCapturePlayers } from './samples.ts';

// m4-1-playtest's tv-words.png is the 1920x1080 frame inside a 64 px margin; the TV fills the window (AD-030).
test.use(pictureWindow(2));

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** Mid-way through the list: CERA, the 6th word, on the reading line, with Ana, Beto and Caio ahead as in the capture (WORDCTL-01 AC 13). */
const MID_LIST_MS = 5 * 1_000;

test('tv-words', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome(wordsCapturePlayers(), ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  room.push(wordsCaptureResults());
  room.push({ type: 'phase', phase: 'words' });
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  await page.clock.runFor(MID_LIST_MS);
  await expect(page.locator('.word-row--highlighted')).toContainText('CERA');
  // The list and the cards stand where they are heading: the panel already ordered by the points so far (WORDCTL-01 AC 24).
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish();
  });

  await page.screenshot({ path: picturePath('tv-words', 'm4-1-playtest'), animations: 'disabled' });
});
