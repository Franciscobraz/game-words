import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unstable_dev, type Unstable_DevWorker } from 'wrangler';
import { writeFixtureAssets } from '../../../vitest.config.ts';
import { FIXTURE_CLIENT_FILES } from '../test/fixture-clients.ts';
import { FIXTURE_PACK_ID, fixturePackFiles } from '../test/fixture-pack.ts';

// Runs the real `wrangler dev` stack, because the workerd test pool does not route through static assets.
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Ways of asking for a pack file that try to walk out of a client's folder; a fetch keeps the encoded ones as they are. */
const WAYS_OUT = [
  `/tv/assets/../../${FIXTURE_PACK_ID}/dict.bin`,
  `/tv/assets/..%2f..%2f${FIXTURE_PACK_ID}%2fdict.bin`,
  `/phone/assets/%2e%2e/%2e%2e/${FIXTURE_PACK_ID}/dict.bin`,
  `/phone/assets/..%5c..%5c${FIXTURE_PACK_ID}%5cdict.bin`,
  `/phone/${FIXTURE_PACK_ID}/dict.bin`,
  `/${FIXTURE_PACK_ID}/`,
] as const;

describe('static assets', { timeout: 60_000 }, () => {
  let worker: Unstable_DevWorker;

  /** The response itself, even when the assets binding answers with a redirect. */
  const get = (path: string) => worker.fetch(path, { redirect: 'manual' });

  /** Asserts a real page of a client: 200, HTML, and the bytes of that client's `index.html`. */
  async function expectPage(path: string, client: 'tv' | 'phone'): Promise<void> {
    const res = await get(path);
    expect(res.status, path).toBe(200);
    expect(res.headers.get('content-type'), path).toContain('text/html');
    expect(await res.text(), path).toBe(FIXTURE_CLIENT_FILES[`${client}/index.html`]);
  }

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

  it('serves the tv at /tv', async () => {
    await expectPage('/tv', 'tv');
    await expectPage('/tv/', 'tv');
  });

  it('serves the phone at the root and at a room code', async () => {
    await expectPage('/', 'phone');
    await expectPage('/KBXT', 'phone');
    await expectPage('/kbxt', 'phone');
  });

  it('serves the client files', async () => {
    const files = Object.entries(FIXTURE_CLIENT_FILES).filter(([path]) => !path.endsWith('index.html'));
    expect(files).toHaveLength(6);
    for (const [path, content] of files) {
      const res = await get(`/${path}`);
      expect(res.status, path).toBe(200);
      expect(await res.text(), path).toBe(content);
    }
  });

  it('never serves the language pack', async () => {
    const packFiles = Object.keys(fixturePackFiles()).map((file) => `/${FIXTURE_PACK_ID}/${file}`);
    expect(packFiles).toContain(`/${FIXTURE_PACK_ID}/dict.bin`);
    for (const path of [...packFiles, ...WAYS_OUT]) {
      const res = await get(path);
      expect(res.status, path).toBe(404);
    }
  });
});
