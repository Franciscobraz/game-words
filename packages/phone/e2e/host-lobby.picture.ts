import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

test('phone-host-lobby', async ({ page }) => {
  // The capture's state: Ana's phone, Ana hosts; Caio is disconnected and Duda watches.
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [lobbyWelcome([ANA, BETO, CAIO, DUDA], ANA.id)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();

  // The capture draws the whole screen in one window, with the sticky start button at its foot,
  // so the window is as tall as the page (a full-page shot would leave the button mid-page).
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: 390, height });
  await page.screenshot({ path: picturePath('phone-host-lobby') });
});
