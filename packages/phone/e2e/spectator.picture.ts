import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { picturePath, pictureWindow } from './fake-room.ts';
import { openRound } from './round-room.ts';
import { DUDA } from './samples.ts';

/** The page's clock, frozen: the timer reads 01:47. */
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0);

test.use(pictureWindow('phone-spectator'));

test('phone-spectator', async ({ page }) => {
  // The capture's state: Duda's phone, a spectator in round 1 of 3 with 1 min 47 s left; Ana hosts and Caio is disconnected.
  await page.clock.setFixedTime(NOW);
  await openRound(page, { me: DUDA, startsAt: NOW - 13_000, endsAt: NOW + 107_000 });
  await expect(page.getByText(STRINGS.joinsNextRound)).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText('01:47');
  await page.screenshot({ path: picturePath('phone-spectator'), animations: 'disabled' });
});
