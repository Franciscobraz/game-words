import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath } from './fake-room.ts';

test('phone-code', async ({ page }) => {
  // The capture's state: "KBX" typed, the fourth box focused, and "Sala não encontrada".
  await fakeRoom(page, () => ({ replies: [{ type: 'error', code: 'room-not-found' }], close: true }));
  await page.goto('/KBXT');
  await expect(page.getByText(STRINGS.roomNotFound)).toBeVisible();

  await page.getByLabel(STRINGS.codeLetter(4)).focus();
  await page.keyboard.press('Backspace');

  await page.screenshot({ path: picturePath('phone-code'), fullPage: true });
});
