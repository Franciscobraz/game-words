import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath, pictureWindow } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

test.use(pictureWindow('phone-host-actions'));

test('phone-host-actions', async ({ page }) => {
  // The capture's state: Ana hosts and tapped Beto; the sheet rises over her lobby.
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [lobbyWelcome([ANA, BETO, CAIO, DUDA], ANA.id)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();

  await page.getByRole('button', { name: STRINGS.playerActions('Beto') }).click();
  await expect(page.getByRole('dialog', { name: STRINGS.playerActions('Beto') })).toBeVisible();

  await page.screenshot({ path: picturePath('phone-host-actions'), animations: 'disabled' });
});
