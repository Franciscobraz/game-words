import type { PlayerInfo } from '@bwords/core';
import { expect, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { picturePath, pictureWindow } from './pictures.ts';
import { ANA, BETO, CAIO, DUDA, roundWelcome, SAMPLE_END, SAMPLE_START, samplePlayer } from './samples.ts';

// tv-round.png has 1920x1080 px.
test.use(pictureWindow(1));

/** Time left in the capture: "1:44". */
const CAPTURE_REMAINING_MS = 104_000;

/** The ten players the capture draws; Duda plays here, she is not a spectator. */
const PLAYERS: PlayerInfo[] = [
  ANA,
  BETO,
  CAIO,
  { ...DUDA, spectator: false },
  samplePlayer('p5', 'Lucas', '#FDBA74'),
  samplePlayer('p6', 'Mariana', '#A855F7'),
  samplePlayer('p7', 'Pedro', '#F43F5E'),
  samplePlayer('p8', 'Camila', '#14B8A6'),
  samplePlayer('p9', 'Rafael', '#84CC16'),
  samplePlayer('p10', 'Bia', '#3B82F6'),
];

/** The words the capture draws for each player, in the order above. */
const WORD_COUNTS = [14, 11, 8, 7, 6, 5, 4, 3, 2, 1];

test('tv-round', async ({ page }) => {
  const at = SAMPLE_END - CAPTURE_REMAINING_MS;
  expect(at).toBeGreaterThan(SAMPLE_START);
  await page.clock.install({ time: at });
  await page.clock.pauseAt(at);
  const room = await fakeRoom(page, roundWelcome(PLAYERS, ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('board')).toBeVisible();
  room.push({ type: 'counts', counts: PLAYERS.map(({ id }, index) => ({ playerId: id, count: WORD_COUNTS[index]! })) });
  await expect(page.getByTestId('round-player-p10')).toContainText('palavra');
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: picturePath('tv-round'), animations: 'disabled' });
});
