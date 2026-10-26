import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LanguagePack, type PackMeta, boardSolutions, generateBoard } from '@bwords/core';
import { beforeAll, describe, expect, test } from 'vitest';
import { type BuildStats, buildPack } from './build.ts';
import { CALIBRATION_BOARDS, CALIBRATION_SEED } from './calibrate.ts';
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
      top: 50000,
    },
  },
};

const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
// Every 3-letter a-z word goes into extra.txt, so any board has enough words for the generator's
// 40/80/120 minimum; the common ones are those that start with a vowel.
const ALL3 = [...LETTERS].flatMap((a) => [...LETTERS].flatMap((b) => [...LETTERS].map((c) => a + b + c)));
const FREQUENCY = ALL3.filter((w) => 'aeiou'.includes(w[0]!))
  .map((w) => `${w} 1`)
  .join('\n');

const fixtureFetch = (async (input: string | URL | Request) => {
  const url = String(input);
  if (url.endsWith('.txt')) return new Response(FREQUENCY);
  const ext = url.endsWith('.dic') ? 'dic' : 'aff';
  return new Response(await readFile(new URL(`../fixtures/build.${ext}`, import.meta.url)));
}) as typeof fetch;

/** Nearest-rank percentile of an ascending list: the value at rank ceil(p/100 * n). */
const rank = (sorted: number[], p: number) => sorted[Math.ceil((p / 100) * sorted.length) - 1]!;

let meta: PackMeta;
let stats: BuildStats;
/** Ascending common-word counts of the 1,000 seeded boards of each size, counted here from the boards. */
const counts = new Map<number, number[]>();

beforeAll(async () => {
  const dir = await mkdtemp(join(tmpdir(), 'calibrate-'));
  const langDir = join(dir, 'languages', 'pt-BR');
  await mkdir(langDir, { recursive: true });
  await writeFile(join(langDir, 'pack.json'), JSON.stringify(CONFIG));
  await writeFile(join(langDir, 'extra.txt'), `${ALL3.join('\n')}\n`);
  await writeFile(join(langDir, 'blocklist.txt'), '');
  await writeFile(join(langDir, 'profanity.txt'), '');
  await buildPack('pt-BR', {
    languagesDir: join(dir, 'languages'),
    outRoot: join(dir, 'dist'),
    workDir: join(dir, 'src'),
    fetchImpl: fixtureFetch,
  });
  const out = join(dir, 'dist', 'pt-BR');
  const buffer = async (name: string) => new Uint8Array(await readFile(join(out, name))).buffer;
  meta = JSON.parse(await readFile(join(out, 'meta.json'), 'utf8')) as PackMeta;
  stats = JSON.parse(await readFile(join(out, 'stats.json'), 'utf8')) as BuildStats;
  const pack = LanguagePack.fromBuffers({
    dict: await buffer('dict.bin'),
    common: await buffer('common.bin'),
    profanity: await buffer('profanity.bin'),
    spellings: await buffer('spellings.bin'),
    meta,
  });

  for (const size of [4, 5, 6]) {
    const list: number[] = [];
    for (let i = 0; i < CALIBRATION_BOARDS; i++) {
      // Calibration draws boards with no common-word minimum and the profanity filter off.
      const { board } = generateBoard(size, CALIBRATION_SEED + i, pack, { minCommonWords: 0, filterProfanity: false });
      list.push(boardSolutions(board, pack, { minLength: 3, filterProfanity: false }).common.size);
    }
    counts.set(size, list.sort((a, b) => a - b));
  }
}, 120_000);

describe('calibrate', () => {
  test('stores the 10th percentile as the minimum', () => {
    expect(CALIBRATION_BOARDS).toBe(1000);
    expect(stats.calibration.boards).toBe(1000);
    expect(stats.calibration.seeds).toEqual({ first: CALIBRATION_SEED, last: CALIBRATION_SEED + 999 });
    const expected: Record<string, number> = {};
    for (const [size, list] of counts) {
      expect(list).toHaveLength(1000);
      // Rank ceil(0.10 * 1000) = 100: the 100th smallest count.
      expected[size] = list[99]!;
      const min = meta.minCommonWords[size]!;
      // At most 10% of the boards fall below the minimum, and at least 10% are at or below it.
      expect(list.filter((n) => n < min).length).toBeLessThan(100);
      expect(list.filter((n) => n <= min).length).toBeGreaterThanOrEqual(100);
    }
    expect(meta.minCommonWords).toEqual(expected);
    // The fixture boards differ in common words, so the minimum is a real cut and not the lowest count.
    for (const [size, list] of counts) expect(meta.minCommonWords[size]).toBeGreaterThan(list[0]!);
  });

  test('reports the common-word distribution', () => {
    for (const [size, list] of counts) {
      expect(stats.calibration.sizes[size]).toEqual({
        min: list[0],
        median: rank(list, 50),
        max: list[999],
        minCommonWords: rank(list, 10),
      });
    }
    expect(Object.keys(stats.calibration.sizes)).toEqual(['4', '5', '6']);
  });
});
