import { expect, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { readQr } from './read-qr.ts';
import { ANA, BETO, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

/** The two ends of the TV's screens (AD-016). */
const SCREENS = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
] as const;

test('the qr code reads the room address', async ({ page }) => {
  await fakeRoom(page, lobbyWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  const qr = page.getByTestId('room-qr');
  const expected = `${new URL(page.url()).origin}/${SAMPLE_CODE}`;

  for (const screen of SCREENS) {
    await page.setViewportSize(screen);

    await expect(qr.locator('.qr-code__mark')).toHaveText('B');
    expect(await readQr(page, qr), `${screen.width}x${screen.height}`).toBe(expected);
  }
});
