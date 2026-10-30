import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath, PICTURE_WIDTH } from './fake-room.ts';
import { ANA, ANA_FOUND, PODIUM_PLAYERS, resultsWelcome, SAMPLE_CODE, SAMPLE_PODIUM, sampleResults, SCORED_PLAYERS } from './samples.ts';

test('phone-podium', async ({ page }) => {
  // The capture's state: Ana's phone, Ana hosts and wins with 46 points and her 3rd win; CORACOES is her longest word.
  // The phone saw the last round only, so the summary counts its 4 words (POD-01 AC 6).
  await fakeRoom(page, (msg) => ({
    replies:
      msg.type === 'hello'
        ? [
            resultsWelcome(SCORED_PLAYERS, ANA.id, ANA_FOUND, 2),
            sampleResults(2, true),
            { type: 'players', players: PODIUM_PLAYERS, hostId: ANA.id },
            SAMPLE_PODIUM,
          ]
        : [],
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByRole('button', { name: STRINGS.playAgain })).toBeVisible();

  // The capture draws the whole screen in one window, with the fixed buttons at its foot,
  // so the window is as tall as the page. Each piece of confetti stops at its own point of the fall,
  // as the capture freezes them.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: PICTURE_WIDTH, height });
  await page.evaluate(() => {
    document.getAnimations().forEach((animation, index) => {
      animation.pause();
      animation.currentTime = 400 + ((index * 1_370) % 2_800);
    });
  });
  await page.screenshot({ path: picturePath('phone-podium') });
});
