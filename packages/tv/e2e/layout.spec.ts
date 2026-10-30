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
  await page.evaluate(() => document.fonts.ready);

  const origin = new URL(page.url()).origin;
  const loadedFamilies = await page.evaluate(() => {
    const families: string[] = [];
    document.fonts.forEach((font) => {
      if (font.status === 'loaded') families.push(font.family);
    });
    return families;
  });
  expect(loadedFamilies.join()).toContain('Nunito Sans');
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
