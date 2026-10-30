import { defineConfig } from '@playwright/test';
import base from './playwright.config.ts';
import { PICTURE_WIDTH } from './e2e/fake-room.ts';

/**
 * The pictures of the screens with a capture (`captures/<capture>.running.png`), each in a
 * window of its capture's size (`pictureWindow`), with the capture's sample data; the default
 * window below serves the pictures of screens without a capture. Run on demand: `npx playwright test -c packages/phone/playwright.pictures.config.ts`;
 * `PICTURE_WIDTH=320` or `480` shoots the same screens at that width into `test-results/pictures/`.
 */
export default defineConfig({
  ...base,
  testMatch: '**/*.picture.ts',
  // Playwright empties its output folder on each run; a folder of its own keeps the pictures of other widths.
  outputDir: 'test-results/picture-runs',
  use: { ...base.use, viewport: { width: PICTURE_WIDTH, height: 884 }, deviceScaleFactor: 2 },
});
