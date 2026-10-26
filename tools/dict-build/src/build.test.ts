import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Dawg, LanguagePack, type PackMeta } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { type BuildStats, PACK_FILES, buildPack } from './build.ts';
import type { Calibration } from './calibrate.ts';
import type { PackConfig } from './pack.ts';

const CONFIG: PackConfig = {
  id: 'pt-BR',
  name: 'Português (Brasil)',
  alphabet: 'abcdefghijklmnopqrstuvwxyz',
  compoundTiles: [{ tile: 'Qu', letters: 'qu' }],
  normalization: 'strip-diacritics',
  minWordLength: 3,
  sources: {
    vero: {
      repo: 'LibreOffice/dictionaries',
      commit: 'fedcba9876543210fedcba9876543210fedcba98',
      dic: 'pt_BR/pt_BR.dic',
      aff: 'pt_BR/pt_BR.aff',
    },
    frequency: {
      repo: 'hermitdave/FrequencyWords',
      commit: '525f9b560de45753a5ea01069454e72e9aa541c6',
      path: 'content/2018/pt_br/pt_br_full.txt',
      top: 2,
    },
  },
};

/** "gato" is not in any fixture dictionary, so the top 2 of build.dic are "casa" and "por". */
const FREQUENCY = ['casa 900', 'gato 700', 'por 500', 'acao 100'].join('\n');

type Pair = 'build' | 'enclitic';

/**
 * The fixture dictionaries have a handful of words, so no board reaches the generator's 40/80/120 word
 * minimum and the real calibration would throw. It is covered by calibrate.test.ts.
 */
const CALIBRATION: Calibration = {
  boards: 1000,
  seeds: { first: 1, last: 1000 },
  percentile: 'nearest-rank P10',
  minLength: 3,
  sizes: { 4: { min: 1, median: 2, max: 3, minCommonWords: 1 } },
};

/** Serves fixtures/<pair>.dic/.aff in place of the pinned VERO and FREQUENCY as the frequency list. */
const fixtureFetch = (pair: Pair) =>
  (async (input: string | URL | Request) => {
    const url = String(input);
    if (url.endsWith('.txt')) return new Response(FREQUENCY);
    const ext = url.endsWith('.dic') ? 'dic' : 'aff';
    return new Response(await readFile(new URL(`../fixtures/${pair}.${ext}`, import.meta.url)));
  }) as typeof fetch;

interface Lists {
  extra?: string;
  blocklist?: string;
  profanity?: string;
}

/** Writes a languages/pt-BR/ with CONFIG and the given lists into a temp dir and builds it. */
async function build(lists: Lists = {}, pair: Pair = 'build') {
  const dir = await mkdtemp(join(tmpdir(), 'dict-build-'));
  const langDir = join(dir, 'languages', 'pt-BR');
  await mkdir(langDir, { recursive: true });
  await writeFile(join(langDir, 'pack.json'), JSON.stringify(CONFIG));
  for (const name of ['extra', 'blocklist', 'profanity'] as const) {
    await writeFile(join(langDir, `${name}.txt`), `# ${name}\n${lists[name] ?? ''}`);
  }
  const result = await buildPack('pt-BR', {
    languagesDir: join(dir, 'languages'),
    outRoot: join(dir, 'dist'),
    workDir: join(dir, 'src'),
    fetchImpl: fixtureFetch(pair),
    calibrate: () => CALIBRATION,
  });
  const out = join(dir, 'dist', 'pt-BR');
  const file = (name: string) => readFile(join(out, name));
  const buffer = async (name: string) => new Uint8Array(await file(name)).buffer;
  const load = async () =>
    LanguagePack.fromBuffers({
      dict: await buffer('dict.bin'),
      common: await buffer('common.bin'),
      profanity: await buffer('profanity.bin'),
      spellings: await buffer('spellings.bin'),
      meta: JSON.parse(await readFile(join(out, 'meta.json'), 'utf8')) as PackMeta,
    });
  const stats = async () => JSON.parse(await readFile(join(out, 'stats.json'), 'utf8')) as BuildStats;
  return { ...result, dir, out, file, load, stats };
}

const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

// build.dic expands to: pôr, por, casa, casas, ação, Brasil, guarda-chuva, pé.
describe('buildPack', () => {
  test('stores duplicate normalized words once', async () => {
    const { out } = await build();
    const dawg = Dawg.fromBuffer(new Uint8Array(await readFile(join(out, 'dict.bin'))).buffer);
    expect(dawg.wordCount).toBe(4);
    for (const w of ['acao', 'casa', 'casas', 'por']) expect(dawg.has(w)).toBe(true);
    for (const w of ['pôr', 'brasil', 'pe', 'guardachuva']) expect(dawg.has(w)).toBe(false);
  });

  test('writes bin and stats with per-filter counts', async () => {
    const { dir, outDir, file } = await build();
    expect(outDir).toBe(join(dir, 'dist', 'pt-BR'));
    const bin = await file('dict.bin');
    const stats = JSON.parse((await file('stats.json')).toString('utf8')) as BuildStats;

    expect(stats.source).toEqual({ repo: CONFIG.sources.vero.repo, commit: CONFIG.sources.vero.commit });
    expect(stats.counts).toEqual({
      expanded: 8,
      discarded: { uppercase: 1, 'non-letter': 1, length: 1, duplicate: 1 },
      afterUppercase: 7,
      afterNonLetter: 6,
      afterLength: 5,
      afterDedup: 4,
      words: 4,
    });
    expect(stats.binBytes).toBe(bin.byteLength);
    expect(stats.sha256).toBe(sha256(bin));
    expect(stats.peakHeapMb).toBeGreaterThan(0);
    expect(stats.samples.accepted.sort()).toEqual(['acao', 'casa', 'casas', 'por']);
    expect(stats.samples.discarded.sort((a, b) => a.form.localeCompare(b.form))).toEqual([
      { form: 'Brasil', reason: 'uppercase' },
      { form: 'guarda-chuva', reason: 'non-letter' },
      { form: 'pé', reason: 'length' },
    ]);
    // Letter frequency over the stored words: acao casa casas por = 16 letters, 6 of them "a".
    expect(stats.letterWeights[0]).toBeCloseTo(6 / 16);
    expect(stats.letterWeights.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  test('writes every pack file', async () => {
    const { out, file, load } = await build();
    expect((await readdir(out)).sort()).toEqual(
      ['common.bin', 'dict.bin', 'meta.json', 'profanity.bin', 'spellings.bin', 'stats.json'].sort(),
    );
    const pack = await load();
    expect(pack.meta.id).toBe('pt-BR');
    for (const name of PACK_FILES) {
      expect((pack.meta.sha256 as Record<string, string>)[name]).toBe(sha256(await file(name)));
    }
    expect(pack.meta.letterWeights).toEqual(Array.from(pack.dict.letterWeights));
    for (const w of ['acao', 'casa', 'casas', 'por']) expect(pack.isWord(w)).toBe(true);
    expect(['acao', 'casa', 'casas', 'por'].filter((w) => pack.isCommon(w))).toEqual(['casa', 'por']);
    expect(pack.isProfane('casa')).toBe(false);
    expect(pack.spellings('por')).toEqual(['por', 'pôr']);
    expect(pack.spellings('acao')).toEqual(['ação']);
    expect(pack.spellings('casa')).toEqual(['casa']);
  });

  test('is byte-identical across runs', async () => {
    const lists = { extra: 'rolê\nfaça\n', blocklist: 'casas\n', profanity: 'casa\n' };
    const first = await build(lists);
    const second = await build(lists);
    expect(first.dir).not.toBe(second.dir);
    for (const name of PACK_FILES) {
      expect(sha256(await second.file(name)), name).toBe(sha256(await first.file(name)));
    }
    // stats.json differs only in the run measurements (time and peak heap).
    const stable = async (b: typeof first) => {
      const { durationMs, peakHeapMb, ...rest } = await b.stats();
      expect(durationMs).toBeGreaterThanOrEqual(0);
      expect(peakHeapMb).toBeGreaterThan(0);
      return sha256(new TextEncoder().encode(JSON.stringify(rest)));
    };
    expect(await stable(second)).toBe(await stable(first));
  });

  test('adds extra words to the dictionary', async () => {
    const { load } = await build({ extra: 'rolê\n' });
    const pack = await load();
    expect(pack.isWord('role')).toBe(true);
    expect(pack.isWord('rolê')).toBe(false);
    for (const w of ['acao', 'casa', 'casas', 'por']) expect(pack.isWord(w)).toBe(true);
    expect(pack.dict.wordCount).toBe(5);
  });

  test('keeps extra spellings for display', async () => {
    const { load } = await build({ extra: 'rolê\nfaça\nfaca\n' });
    const pack = await load();
    expect(pack.spellings('role')).toEqual(['rolê']);
    expect(pack.spellings('faca')).toEqual(['faca', 'faça']);
    expect(pack.spellings('por')).toEqual(['por', 'pôr']);
  });

  test('removes blocklisted words with their spellings', async () => {
    const { load, stats } = await build({ blocklist: 'pôr\n' });
    const pack = await load();
    expect(pack.isWord('por')).toBe(false);
    expect(pack.spellings('por')).toEqual(['por']);
    expect(pack.isCommon('por')).toBe(false);
    for (const w of ['acao', 'casa', 'casas']) expect(pack.isWord(w)).toBe(true);
    expect(pack.spellings('acao')).toEqual(['ação']);
    expect((await stats()).spellings.entries).toBe(1);
  });

  test('counts extra and blocklist changes', async () => {
    // "casa" is already in the dictionary and "xyz" is not: neither changes it.
    const { stats } = await build({ extra: 'rolê\ncasa\n', blocklist: 'casas\nxyz\n' });
    const s = await stats();
    expect(s.lists).toEqual({ extraAdded: 1, blocklistRemoved: 1 });
    expect(s.counts.words).toBe(4);
  });

  test('reports each cleanup with examples', async () => {
    const { stats, load } = await build({}, 'enclitic');
    expect((await stats()).cleanup).toEqual({
      forbidden: { count: 1, examples: ['menas'] },
      enclitic: {
        count: 9,
        examples: ['comemo', 'comermo', 'compô', 'comê', 'damo', 'darmo', 'enfronhamo', 'enfronharmo', 'enfronhá'],
      },
    });
    const pack = await load();
    expect(pack.isWord('enfronhamo')).toBe(false);
    expect(pack.isWord('menas')).toBe(false);
    expect(pack.isWord('enfronhamos')).toBe(true);
    expect(pack.isWord('compo')).toBe(false);
    expect(pack.isWord('comemos')).toBe(true);
  });

  test('marks profanity without removing it', async () => {
    const { load, stats } = await build({ profanity: 'casa\n' });
    const pack = await load();
    expect(pack.isWord('casa')).toBe(true);
    expect(pack.isProfane('casa')).toBe(true);
    expect(pack.isProfane('casas')).toBe(false);
    expect(pack.isCommon('casa')).toBe(true);
    expect((await stats()).profanity).toBe(1);
  });

  test('fails on profanity outside the dictionary', async () => {
    await expect(build({ profanity: 'casa\ngato\n' })).rejects.toThrow(/profanity\.txt line 3: "gato" is not in the dictionary/);
  });

  test('reports spellings size', async () => {
    const { file, stats } = await build();
    expect((await stats()).spellings).toEqual({ bytes: (await file('spellings.bin')).byteLength, entries: 2 });
  });
});
