import { expect, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { picturePath, pictureWindow } from './pictures.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome } from './samples.ts';

// tv-lobby.png has 3840x2160 px.
test.use(pictureWindow(2));

test('tv-lobby', async ({ page }) => {
  // The capture's state: Ana hosts with 2 wins, Caio is disconnected, Duda watches.
  await fakeRoom(page, lobbyWelcome([ANA, BETO, CAIO, DUDA], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('player-p4')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: picturePath('tv-lobby'), animations: 'disabled' });
});
