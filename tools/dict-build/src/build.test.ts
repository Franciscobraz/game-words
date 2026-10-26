import { createHash } from 'node:crypto';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Dawg } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { type BuildStats, buildDictionary } from './build.ts';
import type { SourceSpec } from './fetch.ts';

const SOURCE: SourceSpec = {
  repo: 'LibreOffice/dictionaries',
  commit: 'fedcba9876543210fedcba9876543210fedcba98',
  dic: 'pt_BR/pt_BR.dic',
  aff: 'pt_BR/pt_BR.aff',
};

/** Serves fixtures/build.dic and build.aff in place of the pinned .dic/.aff. */
const fixtureFetch = (async (input: string | URL | Request) => {
  const ext = String(input).endsWith('.dic') ? 'dic' : 'aff';
  return new Response(await readFile(new URL(`../fixtures/build.${ext}`, import.meta.url)));
}) as typeof fetch;

async function build() {
  const dir = await mkdtemp(join(tmpdir(), 'dict-build-'));
  const result = await buildDictionary({
    source: SOURCE,
    outDir: join(dir, 'dist'),
    workDir: join(dir, 'src'),
    fetchImpl: fixtureFetch,
  });
  return { ...result, dir };
}

// build.dic expands to: pôr, por, casa, casas, ação, Brasil, guarda-chuva, pé.
describe('buildDictionary', () => {
  test('stores duplicate normalized words once', async () => {
    const { binPath } = await build();
    const dawg = Dawg.fromBuffer(new Uint8Array(await readFile(binPath)).buffer);
    expect(dawg.wordCount).toBe(4);
    for (const w of ['acao', 'casa', 'casas', 'por']) expect(dawg.has(w)).toBe(true);
    for (const w of ['pôr', 'brasil', 'pe', 'guardachuva']) expect(dawg.has(w)).toBe(false);
  });

  test('writes bin and stats with per-filter counts', async () => {
    const { dir, binPath, statsPath } = await build();
    expect(binPath).toBe(join(dir, 'dist', 'pt-BR.dict.bin'));
    expect(statsPath).toBe(join(dir, 'dist', 'pt-BR.stats.json'));
    const bin = await readFile(binPath);
    const stats = JSON.parse(await readFile(statsPath, 'utf8')) as BuildStats;

    expect(stats.source).toEqual({ repo: SOURCE.repo, commit: SOURCE.commit });
    expect(stats.counts).toEqual({
      expanded: 8,
      discarded: { uppercase: 1, 'non-letter': 1, length: 1, duplicate: 1 },
      afterUppercase: 7,
      afterNonLetter: 6,
      afterLength: 5,
      afterDedup: 4,
    });
    expect(stats.binBytes).toBe(bin.byteLength);
    expect(stats.sha256).toBe(createHash('sha256').update(bin).digest('hex'));
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

  test('is byte-identical across runs', async () => {
    const first = await build();
    const second = await build();
    const hash = async (p: string) => createHash('sha256').update(await readFile(p)).digest('hex');
    expect(first.dir).not.toBe(second.dir);
    expect(await hash(second.binPath)).toBe(await hash(first.binPath));
  });
});
