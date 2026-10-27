import { buildSpellings, LanguagePack, type PackMeta } from '@bwords/core';

/** Origin of the static assets; any host works for the ASSETS binding. */
const ASSETS_ORIGIN = 'https://assets.local';

/** A pack whose `spellings(word)` is always `[word]`, until the real map is loaded. */
const NO_SPELLINGS = buildSpellings([]);

export interface LoadPackOptions {
  /**
   * Also load `spellings.bin` (6.79 MB in pt-BR), which only the results need.
   * Default false: boards and solutions work without it.
   */
  spellings?: boolean;
}

// Per isolate: every room of the isolate shares the files and the packs.
const files = new Map<string, Promise<ArrayBuffer>>();
const packs = new Map<string, Promise<LanguagePack>>();

/** Keeps the promise of `key` until it rejects, so a failed load can be tried again. */
function cached<T>(map: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
  let promise = map.get(key);
  if (!promise) {
    promise = load();
    map.set(key, promise);
    promise.catch(() => map.delete(key));
  }
  return promise;
}

function fetchFile(assets: Fetcher, id: string, name: string): Promise<ArrayBuffer> {
  return cached(files, `${id}/${name}`, async () => {
    const res = await assets.fetch(`${ASSETS_ORIGIN}/${id}/${name}`);
    if (!res.ok) throw new Error(`Language pack file ${id}/${name} failed: HTTP ${res.status}`);
    return res.arrayBuffer();
  });
}

/**
 * The language pack `<id>/` of the static assets, fetched once per isolate. Without
 * `spellings`, `spellings.bin` is not fetched and the pack has no display spellings;
 * the first load with `spellings` fetches it and reuses the other files.
 */
export function loadPack(assets: Fetcher, id: string, options: LoadPackOptions = {}): Promise<LanguagePack> {
  const withSpellings = options.spellings === true;
  return cached(packs, withSpellings ? `${id}+spellings` : id, async () => {
    const [dict, common, profanity, meta, spellings] = await Promise.all([
      fetchFile(assets, id, 'dict.bin'),
      fetchFile(assets, id, 'common.bin'),
      fetchFile(assets, id, 'profanity.bin'),
      fetchFile(assets, id, 'meta.json'),
      withSpellings ? fetchFile(assets, id, 'spellings.bin') : NO_SPELLINGS,
    ]);
    return LanguagePack.fromBuffers({
      dict,
      common,
      profanity,
      spellings,
      meta: JSON.parse(new TextDecoder().decode(meta)) as PackMeta,
    });
  });
}
