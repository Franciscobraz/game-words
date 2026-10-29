import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { createRoom } from './tv.ts';

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
