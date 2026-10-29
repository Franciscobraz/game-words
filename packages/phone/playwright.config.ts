import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');

/** Where `wrangler dev` of `@bwords/server` listens. */
const SERVER_PORT = 8787;

/** The phone's Vite dev server. */
const PHONE_URL = 'http://localhost:5175';

/**
 * E2E of the phone against the real server (design, Tech Decisions): a 390×844
 * touch phone, `wrangler dev` with the built pt-BR pack, and the phone's Vite.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: PHONE_URL,
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  },
  webServer: [
    {
      command: 'npm run dev -w @bwords/server',
      cwd: root,
      // The Worker answers 404 on `/`, so readiness is the open port.
      port: SERVER_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -w @bwords/phone',
      cwd: root,
      url: PHONE_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
