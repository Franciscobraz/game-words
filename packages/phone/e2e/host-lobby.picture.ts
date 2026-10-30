import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath, pictureWindow } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

// The capture draws the whole screen in one window, with the sticky start button at its foot.
test.use(pictureWindow('phone-host-lobby'));

test('phone-host-lobby', async ({ page }) => {
  // The capture's state: Ana's phone, Ana hosts; Caio is disconnected and Duda watches.
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [lobbyWelcome([ANA, BETO, CAIO, DUDA], ANA.id)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();
  await page.screenshot({ path: picturePath('phone-host-lobby'), animations: 'disabled' });
});
