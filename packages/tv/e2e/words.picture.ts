import { expect, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { picturePath, pictureWindow } from './pictures.ts';
import { ANA, BETO, CAIO, roundWelcome, SAMPLE_END, sampleResults } from './samples.ts';

// tv-words.png has 1920x1080 px.
test.use(pictureWindow(1));

/** How far the capture's frame is into the scroll: CASA sits at this height, in px. */
const CAPTURE_CASA_TOP_PX = 329;

/** The capture's players; it draws Beto in a lighter blue. */
const PLAYERS = [ANA, { ...BETO, color: '#7DD3FC' }, { ...CAIO, connected: true }];

test('tv-words', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome(PLAYERS, ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  room.push(sampleResults());
  await page.clock.runFor(2_200);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  // The frame of the capture: the one transition is stopped by hand, at the moment CASA reaches its place.
  await page.getByTestId('word-list').evaluate((list, casaTopPx) => {
    const [scroll] = list.getAnimations();
    if (scroll === undefined) throw new Error('The list is not scrolling');
    scroll.pause();
    scroll.currentTime = 0;
    const casa = Array.from(list.querySelectorAll('[data-testid="word-row"]')).find((row) => row.textContent?.startsWith('CASA'))!;
    const fromTop = casa.getBoundingClientRect().top - casaTopPx;
    const distance = -new DOMMatrix(list.style.transform).m42;
    const durationMs = Number(scroll.effect!.getComputedTiming().duration);
    scroll.currentTime = (fromTop / distance) * durationMs;
  }, CAPTURE_CASA_TOP_PX);

  // Playwright's `animations: 'disabled'` would run the transition to its end.
  await page.screenshot({ path: picturePath('tv-words') });
});
