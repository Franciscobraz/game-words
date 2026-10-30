import { expect, test } from '@playwright/test';

/** The two ends of the TV's screens, and the root font size each one gets (TVUI-01 AC 1, design: TV escalada por rem). */
const ROOT_FONT_PX = [
  { width: 1920, height: 1080, fontSize: 16 },
  { width: 1280, height: 720, fontSize: 1280 / 120 },
] as const;

/** Sub-pixel rounding the browser may apply to a computed font size. */
const FONT_DIGITS = 2;

test('loads nothing from another origin', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();

  // Asking for the face directly: a browser only fetches a font once some text on the screen uses it.
  const facesLoaded = await page.evaluate(async () => (await document.fonts.load('700 16px "Nunito Sans"', 'BWords')).length);
  const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  const origin = new URL(page.url()).origin;
  expect(facesLoaded).toBeGreaterThan(0);
  expect(fontFamily).toContain('Nunito Sans');
  expect(requests.filter((url) => /\.woff2?(\?|$)/.test(url)).length).toBeGreaterThan(0);
  expect(requests.filter((url) => !url.startsWith('data:') && new URL(url).origin !== origin)).toEqual([]);
});

test('scales the root font with the screen', async ({ page }) => {
  await page.goto('/');

  for (const { width, height, fontSize } of ROOT_FONT_PX) {
    await page.setViewportSize({ width, height });
    const computed = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(computed, `${width}x${height}`).toBeCloseTo(fontSize, FONT_DIGITS);
  }
});
