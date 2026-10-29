import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

/** Beto's phone in the lobby of KBXT. */
async function openLobby(page: Page): Promise<void> {
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [lobbyWelcome([ANA, BETO, CAIO, DUDA], BETO.id)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.playersInRoom(4))).toBeVisible();
}

const sheetOf = (page: Page) => page.getByRole('dialog', { name: STRINGS.preferences });

test('opens the preferences with both switches off', async ({ page }) => {
  // PREF-01 AC 1: the person icon opens a bottom sheet with "Vibrar" and "Som ao acertar", both off, and "Fechar".
  await openLobby(page);

  await page.getByRole('button', { name: STRINGS.preferences }).click();

  const sheet = sheetOf(page);
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('switch', { name: STRINGS.vibrate })).toHaveAttribute('aria-checked', 'false');
  await expect(sheet.getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'false');
  await sheet.getByRole('button', { name: STRINGS.close }).click();
  await expect(sheet).toBeHidden();
});

test('keeps a switched preference after a reload', async ({ page }) => {
  // PREF-01 AC 2, in the browser: "Som ao acertar" turned on is still on when the page loads again.
  await openLobby(page);
  await page.getByRole('button', { name: STRINGS.preferences }).click();
  await sheetOf(page).getByRole('switch', { name: STRINGS.hitSound }).click();
  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  await expect(page.getByText(STRINGS.playersInRoom(4))).toBeVisible();
  await page.getByRole('button', { name: STRINGS.preferences }).click();

  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'true');
  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.vibrate })).toHaveAttribute('aria-checked', 'false');
});

test('hides Vibrar without navigator.vibrate', async ({ page }) => {
  // PREF-01 AC 3: a browser with no vibration shows only "Som ao acertar".
  await page.addInitScript(() => {
    delete (Navigator.prototype as { vibrate?: unknown }).vibrate;
  });
  await openLobby(page);

  await page.getByRole('button', { name: STRINGS.preferences }).click();

  const sheet = sheetOf(page);
  await expect(sheet.getByRole('switch', { name: STRINGS.hitSound })).toBeVisible();
  await expect(sheet.getByRole('switch', { name: STRINGS.vibrate })).toHaveCount(0);
});
