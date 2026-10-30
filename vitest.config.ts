import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { configDefaults, defineConfig } from 'vitest/config';
import { FIXTURE_CLIENT_FILES } from './packages/server/test/fixture-clients.ts';
import { FIXTURE_PACK_ID, fixturePackFiles } from './packages/server/test/fixture-pack.ts';

/**
 * The server tests serve the fixture pack and minimal clients as the Worker's static
 * assets, in place of the built ones (git-ignored, and too big for a test): their files
 * are written here and the `assets` override points the `ASSETS` binding at them.
 */
export function writeFixtureAssets(): string {
  const dir = resolve(import.meta.dirname, 'node_modules/.cache/bwords-server-test-assets');
  mkdirSync(join(dir, FIXTURE_PACK_ID), { recursive: true });
  for (const [name, bytes] of Object.entries(fixturePackFiles())) writeFileSync(join(dir, FIXTURE_PACK_ID, name), bytes);
  for (const [path, text] of Object.entries(FIXTURE_CLIENT_FILES)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'core',
          include: ['{packages,tools,spikes}/*/src/**/*.test.ts', 'packages/server/e2e/**/*.test.ts'],
          exclude: [...configDefaults.exclude, 'packages/server/test/**'],
        },
      },
      {
        plugins: [
          cloudflareTest({
            wrangler: { configPath: './packages/server/wrangler.jsonc' },
            miniflare: { assets: { directory: writeFixtureAssets(), binding: 'ASSETS' } },
          }),
        ],
        test: {
          name: 'server',
          include: ['packages/server/test/**/*.test.ts'],
        },
      },
    ],
  },
});
