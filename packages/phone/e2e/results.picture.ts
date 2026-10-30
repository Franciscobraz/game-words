import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath, PICTURE_WIDTH } from './fake-room.ts';
import { ANA, ANA_FOUND, resultsWelcome, SAMPLE_CODE, sampleResults, SCORED_PLAYERS } from './samples.ts';

test('phone-round-result', async ({ page }) => {
  // The capture's state: Ana's phone, Ana hosts, after round 1 of 3: +18 pts, 32 in all, 1º; CORACOES only hers.
  await fakeRoom(page, (msg) => ({
    replies: msg.type === 'hello' ? [resultsWelcome(SCORED_PLAYERS, ANA.id, ANA_FOUND), sampleResults()] : [],
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByRole('button', { name: STRINGS.nextRound(2, 3) })).toBeVisible();

  // The capture draws the whole screen in one window, with the sticky buttons at its foot,
  // so the window is as tall as the page.
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: PICTURE_WIDTH, height });
  await page.screenshot({ path: picturePath('phone-round-result') });
});
