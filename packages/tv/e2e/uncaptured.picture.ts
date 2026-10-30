import { expect, test } from '@playwright/test';
import { pictureWindow, uncapturedPath } from './pictures.ts';
import { stateNamed } from './screen-states.ts';

/**
 * Pictures at 1920x1080 of the screens and states no capture draws (T36, TVUI-01), in `captures/uncaptured/`,
 * for the user to judge (AD-022).
 */
test.use(pictureWindow(1));

const PICTURES: { picture: string; state: string }[] = [
  { picture: 'tv-opening-failed', state: 'opening failed' },
  { picture: 'tv-empty-lobby', state: 'empty lobby' },
  { picture: 'tv-lobby-sound-notice', state: 'lobby of the capture with the sound notice' },
  { picture: 'tv-countdown', state: 'countdown' },
  { picture: 'tv-time-up', state: 'time up with 10' },
  { picture: 'tv-reconnecting', state: 'reconnecting over the round' },
  { picture: 'tv-no-connection', state: 'no-connection over the round' },
  { picture: 'tv-no-connection-ok-hint', state: 'gave-up over the lobby' },
  { picture: 'tv-expired', state: 'expired room' },
  { picture: 'tv-other-tab', state: 'another tab' },
  { picture: 'tv-words-none-found', state: 'words with no word found' },
];

for (const { picture, state } of PICTURES) {
  test(picture, async ({ page }) => {
    await stateNamed(state).open(page);
    await page.screenshot({ path: uncapturedPath(picture), animations: 'disabled' });
  });
}

test('tv-last-result', async ({ page }) => {
  await stateNamed('last result of the capture').open(page);
  await expect(page.getByTestId('confetti')).toBeVisible();

  // Playwright's `animations: 'disabled'` would send the confetti to the end of its fall, out of the card: it stops in
  // the middle, and everything else ends.
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      const target = (animation.effect as KeyframeEffect).target;
      if (target?.closest('[data-testid="confetti"]') === null) {
        animation.finish();
        continue;
      }
      animation.pause();
      animation.currentTime = Number(animation.effect?.getComputedTiming().duration) / 2;
    }
  });
  await page.screenshot({ path: uncapturedPath('tv-last-result') });
});
