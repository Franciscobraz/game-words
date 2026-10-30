import { defineConfig } from '@playwright/test';
import base from './playwright.config.ts';

/**
 * The pictures of the screens with a capture (`captures/<capture>.running.png`), each in a window of its
 * capture's size, with the capture's sample data. Run on demand: `npx playwright test -c packages/tv/playwright.pictures.config.ts`.
 */
export default defineConfig({
  ...base,
  testMatch: '**/*.picture.ts',
  // Playwright empties its output folder on each run; a folder of its own keeps the results of the other runs.
  outputDir: 'test-results/picture-runs',
});
