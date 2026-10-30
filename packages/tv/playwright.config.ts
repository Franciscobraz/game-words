import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../..');

/** Where `wrangler dev` of `@bwords/server` listens. */
const SERVER_PORT = 8787;

/** The TV's Vite dev server. */
const TV_URL = 'http://localhost:5176';

/**
 * E2E of the TV against the real server (design, Tech Decisions): a 1920×1080 screen,
 * `wrangler dev` with the built pt-BR pack, and the TV's Vite.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: TV_URL,
    viewport: { width: 1920, height: 1080 },
  },
  webServer: [
    {
      command: 'npm run dev -w @bwords/server',
      cwd: root,
      // Readiness is the open port, as in the phone's config.
      port: SERVER_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -w @bwords/tv',
      cwd: root,
      url: TV_URL,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
