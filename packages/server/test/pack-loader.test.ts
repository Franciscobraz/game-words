import { describe, expect, it } from 'vitest';
import { loadPack } from '../src/pack-loader.ts';
import { fixturePackFiles } from './fixture-pack.ts';

/** A Fetcher that serves the fixture pack under any id, logs each path and answers 404 to `missing`. */
function fakeAssets(missing: string[] = []) {
  const served = fixturePackFiles();
  const log: string[] = [];
  const assets = {
    async fetch(input: RequestInfo | URL) {
      const path = new URL(input instanceof Request ? input.url : String(input)).pathname;
      log.push(path);
      const name = path.split('/').pop()!;
      const body = served[name];
      return body && !missing.includes(name) ? new Response(body.slice()) : new Response('Not found', { status: 404 });
    },
  } as unknown as Fetcher;
  return { assets, log };
}

let ids = 0;
/** A pack id no other test used, so the per-isolate cache starts empty. */
const freshId = () => `test-${++ids}`;

describe('loadPack', () => {
  it('fetches each file once for two calls', async () => {
    const { assets, log } = fakeAssets();
    const id = freshId();
    const [a, b] = await Promise.all([loadPack(assets, id), loadPack(assets, id)]);
    const c = await loadPack(assets, id);
    expect(b).toBe(a);
    expect(c).toBe(a);
    expect(log.sort()).toEqual([`/${id}/common.bin`, `/${id}/dict.bin`, `/${id}/meta.json`, `/${id}/profanity.bin`]);
    expect(a.isWord('jkw')).toBe(true);
    expect(a.isProfane('zzzz')).toBe(true);
  });

  it('rejects with the name of a file that answers 404', async () => {
    const { assets } = fakeAssets(['profanity.bin']);
    const id = freshId();
    await expect(loadPack(assets, id)).rejects.toThrow(`${id}/profanity.bin`);
  });

  it('fetches spellings.bin only the first time spellings are asked for', async () => {
    const { assets, log } = fakeAssets();
    const id = freshId();
    const plain = await loadPack(assets, id);
    expect(log).not.toContain(`/${id}/spellings.bin`);
    expect(plain.spellings('jkw')).toEqual(['jkw']);

    const full = await loadPack(assets, id, { spellings: true });
    await loadPack(assets, id, { spellings: true });
    expect(full.spellings('jkw')).toEqual(['jkw', 'jḱw']);
    expect(log.filter((p) => p === `/${id}/spellings.bin`)).toHaveLength(1);
    // The other files were not fetched again.
    expect(log.filter((p) => p === `/${id}/dict.bin`)).toHaveLength(1);
  });
});
