import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath, pictureWindow } from './fake-room.ts';
import { ANA, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

test.use(pictureWindow('phone-join'));

test('phone-join', async ({ page }) => {
  // The capture's state: Beto typed, cyan picked, the colors of Ana, Caio and Duda locked.
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [lobbyWelcome([ANA, CAIO, DUDA], null)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);

  await page.getByLabel(STRINGS.nicknameLabel).fill('Beto');
  await page.getByRole('button', { name: STRINGS.colorOption(5) }).click();
  await expect(page.getByRole('region', { name: STRINGS.tvPreview })).toContainText('Beto');

  await page.screenshot({ path: picturePath('phone-join'), animations: 'disabled' });
});
