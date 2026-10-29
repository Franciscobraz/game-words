import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { createRoom } from './tv.ts';

/** A well-formed code that no test creates; the server answers `room-not-found` for it. */
const UNKNOWN_CODE = 'ZZZZ';

test('opens the join screen for a room path', async ({ page }) => {
  // ENTRY-01 AC 1: `/<code>` of a live room connects to it and shows the join screen.
  const tv = await createRoom();
  try {
    await page.goto(`/${tv.code}`);

    await expect(page.getByText(STRINGS.nicknameLabel)).toBeVisible();
    await expect(page.getByText(tv.code, { exact: true })).toBeVisible();
  } finally {
    tv.close();
  }
});

test('shows the code screen at the root', async ({ page }) => {
  // ENTRY-01 AC 2: `/` shows "Entrar numa sala" with four boxes and "CONTINUAR".
  await page.goto('/');

  await expect(page.getByRole('heading', { name: STRINGS.enterRoom })).toBeVisible();
  for (const position of [1, 2, 3, 4]) await expect(page.getByLabel(STRINGS.codeLetter(position))).toBeVisible();
  await expect(page.getByRole('button', { name: STRINGS.continue })).toBeVisible();
});

test('uppercases a typed letter and moves to the next box', async ({ page }) => {
  // ENTRY-01 AC 3: "k" shows as "K" and the focus goes to the second box.
  await page.goto('/');
  await page.getByLabel(STRINGS.codeLetter(1)).click();

  await page.keyboard.type('k');

  await expect(page.getByLabel(STRINGS.codeLetter(1))).toHaveValue('K');
  await expect(page.getByLabel(STRINGS.codeLetter(2))).toBeFocused();
});

test('continue with four letters opens the join screen', async ({ page }) => {
  // ENTRY-01 AC 4: the four letters of a live room and "CONTINUAR" open its join screen.
  const tv = await createRoom();
  try {
    await page.goto('/');
    await page.getByLabel(STRINGS.codeLetter(1)).click();
    await page.keyboard.type(tv.code.toLowerCase());

    await page.getByRole('button', { name: STRINGS.continue }).click();

    await expect(page.getByText(STRINGS.nicknameLabel)).toBeVisible();
    await expect(page).toHaveURL(`/${tv.code}`);
  } finally {
    tv.close();
  }
});

test('shows room not found for an unknown code', async ({ page }) => {
  // ENTRY-01 AC 5: `room-not-found` shows "Sala não encontrada" below the boxes.
  await page.goto('/');
  await page.getByLabel(STRINGS.codeLetter(1)).click();
  await page.keyboard.type(UNKNOWN_CODE);

  await page.getByRole('button', { name: STRINGS.continue }).click();

  await expect(page.getByRole('alert')).toHaveText(STRINGS.roomNotFound);
  await expect(page.getByRole('heading', { name: STRINGS.enterRoom })).toBeVisible();
  await expect(page.getByLabel(STRINGS.codeLetter(4))).toHaveValue('Z');
});
