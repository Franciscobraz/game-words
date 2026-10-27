import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unstable_dev, type Unstable_DevWorker } from 'wrangler';
import { writeFixtureAssets } from '../../../vitest.config.ts';
import { FIXTURE_PACK_ID } from '../test/fixture-pack.ts';

// Runs the real `wrangler dev` stack, because the workerd test pool does not route through static assets.
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

describe('static assets', { timeout: 60_000 }, () => {
  let worker: Unstable_DevWorker;

  beforeAll(async () => {
    worker = await unstable_dev(here('../src/worker.ts'), {
      config: here('../wrangler.jsonc'),
      assets: writeFixtureAssets(),
      experimental: { disableExperimentalWarning: true },
    });
  });

  afterAll(() => worker?.stop());

  it.each(['dict.bin', 'common.bin', 'profanity.bin', 'spellings.bin', 'meta.json'])(
    'answers 404 to any language pack file over HTTP: %s',
    async (file) => {
      const res = await worker.fetch(`/${FIXTURE_PACK_ID}/${file}`);
      expect(res.status).toBe(404);
    },
  );

  it('still serves the rooms API', async () => {
    const res = await worker.fetch('/api/rooms', { method: 'POST' });
    expect(res.status).toBe(200);
  });
});
