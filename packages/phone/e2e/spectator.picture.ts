import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { picturePath, PICTURE_WIDTH } from './fake-room.ts';
import { openRound } from './round-room.ts';
import { DUDA } from './samples.ts';

/** The page's clock, frozen: the timer reads 01:47. */
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0);

test('phone-spectator', async ({ page }) => {
  // The capture's state: Duda's phone, a spectator in round 1 of 3 with 1 min 47 s left; Ana hosts and Caio is disconnected.
  await page.clock.setFixedTime(NOW);
  await openRound(page, { me: DUDA, startsAt: NOW - 13_000, endsAt: NOW + 107_000 });
  await expect(page.getByText(STRINGS.joinsNextRound)).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText('01:47');

  // The capture draws the whole screen in one window, so the window is as tall as the page.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: PICTURE_WIDTH, height });
  await page.screenshot({ path: picturePath('phone-spectator'), animations: 'disabled' });
});
