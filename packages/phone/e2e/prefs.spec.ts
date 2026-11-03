import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

/** Beto's phone in the lobby of room `code`, KBXT by default. */
async function openLobby(page: Page, code = SAMPLE_CODE): Promise<void> {
  await fakeRoom(page, (msg) => ({
    replies: msg.type === 'hello' ? [{ ...lobbyWelcome([ANA, BETO, CAIO, DUDA], BETO.id), code }] : [],
  }));
  await page.goto(`/${code}`);
  await expect(page.getByText(STRINGS.playersInRoom(4))).toBeVisible();
}

/** Another room the same browser enters later. */
const OTHER_CODE = 'MNPQ';

const sheetOf = (page: Page) => page.getByRole('dialog', { name: STRINGS.preferences });

test('opens the preferences with both switches on', async ({ page }) => {
  // PREF-01 AC 1, FEEDBACK-02 AC 1: the person icon opens a bottom sheet with "Vibrar" and "Som ao acertar", both on
  // in a browser with no saved choice, and "Fechar".
  await openLobby(page);

  await page.getByRole('button', { name: STRINGS.preferences }).click();

  const sheet = sheetOf(page);
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('switch', { name: STRINGS.vibrate })).toHaveAttribute('aria-checked', 'true');
  await expect(sheet.getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'true');
  await sheet.getByRole('button', { name: STRINGS.close }).click();
  await expect(sheet).toBeHidden();
});

test('keeps a switched preference after a reload', async ({ page }) => {
  // PREF-01 AC 2, in the browser: "Som ao acertar" turned off is still off when the page loads again.
  await openLobby(page);
  await page.getByRole('button', { name: STRINGS.preferences }).click();
  await sheetOf(page).getByRole('switch', { name: STRINGS.hitSound }).click();
  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'false');

  await page.reload();
  await expect(page.getByText(STRINGS.playersInRoom(4))).toBeVisible();
  await page.getByRole('button', { name: STRINGS.preferences }).click();

  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'false');
  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.vibrate })).toHaveAttribute('aria-checked', 'true');
});

test('keeps the preferences of another room', async ({ page }) => {
  // FEEDBACK-02 AC 4: Beto turns "Som ao acertar" off in KBXT; entering MNPQ later in the same browser, the sheet
  // shows his choice, with "Vibrar" still on.
  await openLobby(page);
  await page.getByRole('button', { name: STRINGS.preferences }).click();
  await sheetOf(page).getByRole('switch', { name: STRINGS.hitSound }).click();
  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'false');

  await openLobby(page, OTHER_CODE);
  await expect(page.getByText(OTHER_CODE, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: STRINGS.preferences }).click();

  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.hitSound })).toHaveAttribute('aria-checked', 'false');
  await expect(sheetOf(page).getByRole('switch', { name: STRINGS.vibrate })).toHaveAttribute('aria-checked', 'true');
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
