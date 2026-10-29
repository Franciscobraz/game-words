import { defineConfig } from '@playwright/test';
import base from './playwright.config.ts';

/**
 * The pictures of the screens with a capture (`captures/<capture>.running.png`):
 * 390 px wide at 2x, the size the captures were drawn at, with the capture's sample
 * data. Run on demand: `npx playwright test -c packages/phone/playwright.pictures.config.ts`.
 */
export default defineConfig({
  ...base,
  testMatch: '**/*.picture.ts',
  use: { ...base.use, viewport: { width: 390, height: 884 }, deviceScaleFactor: 2 },
});
