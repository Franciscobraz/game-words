import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

test('phone-lobby', async ({ page }) => {
  // The capture's state: Beto's phone; Ana hosts with 2 wins, Caio is disconnected, Duda watches.
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [lobbyWelcome([ANA, BETO, CAIO, DUDA], BETO.id)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.playersInRoom(4))).toBeVisible();

  await page.screenshot({ path: picturePath('phone-lobby'), fullPage: true });
});
