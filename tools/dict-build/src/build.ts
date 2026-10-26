import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type DiscardReason, buildDawg, classifyForm, mulberry32 } from '@bwords/core';
import { type SourceSpec, fetchSource } from './fetch.ts';
import { loadPackConfig } from './pack.ts';
import { type ExpandOptions, expandForms } from './unmunch.ts';

export const SAMPLE_SIZE = 50;
export const SAMPLE_SEED = 20261026;
const DAWG_HEADER_BYTES = 16 + 26 * 8;

export interface BuildOptions {
  source: SourceSpec;
  /** Where pt-BR.dict.bin and pt-BR.stats.json are written. */
  outDir: string;
  /** Where the .dic/.aff are downloaded. */
  workDir: string;
  fetchImpl?: typeof fetch;
  unmunch?: ExpandOptions;
}

export interface BuildStats {
  source: { repo: string; commit: string };
  counts: {
    expanded: number;
    discarded: Record<DiscardReason | 'duplicate', number>;
    afterUppercase: number;
    afterNonLetter: number;
    afterLength: number;
    afterDedup: number;
  };
  binBytes: number;
  edgeCount: number;
  sha256: string;
  letterWeights: number[];
  peakHeapMb: number;
  durationMs: number;
  samples: { seed: number; accepted: string[]; discarded: { form: string; reason: DiscardReason }[] };
}

export interface BuildResult {
  binPath: string;
  statsPath: string;
  stats: BuildStats;
}

/** Seeded reservoir sampling (Algorithm R): a uniform sample of `size` items from a stream. */
class Reservoir<T> {
  readonly items: T[] = [];
  private seen = 0;
  private readonly size: number;
  private readonly rng: () => number;

  constructor(size: number, seed: number) {
    this.size = size;
    this.rng = mulberry32(seed);
  }

  offer(item: T) {
    this.seen++;
    if (this.items.length < this.size) {
      this.items.push(item);
    } else {
      const j = Math.floor(this.rng() * this.seen);
      if (j < this.size) this.items[j] = item;
    }
  }
}

/** Copies a string so a stored word does not keep the decoded output chunk alive as a sliced string. */
function copy(s: string): string {
  return Buffer.from(s, 'utf8').toString('utf8');
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Downloads the pinned VERO, expands it with unmunch, filters, dedups and writes the DAWG plus build stats. */
export async function buildDictionary(opts: BuildOptions): Promise<BuildResult> {
  const started = Date.now();
  let peakHeap = 0;
  const sampleHeap = () => {
    peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed);
  };
  const timer = setInterval(sampleHeap, 250);
  try {
    const { dicPath, affPath } = await fetchSource(opts.source, opts.workDir, opts.fetchImpl);

    const discarded: Record<DiscardReason | 'duplicate', number> = {
      uppercase: 0,
      'non-letter': 0,
      length: 0,
      duplicate: 0,
    };
    // Only the normalized words are kept; the raw unmunch output is streamed (it passes 1 GB for pt_BR).
    // An array sorted and deduped in place costs far less heap than a Set of ~12M strings.
    const sorted: string[] = [];
    const discardedSample = new Reservoir<{ form: string; reason: DiscardReason }>(SAMPLE_SIZE, SAMPLE_SEED + 1);
    let expanded = 0;

    for await (const form of expandForms(dicPath, affPath, opts.unmunch)) {
      expanded++;
      if (expanded % 1_000_000 === 0) sampleHeap();
      const c = classifyForm(form);
      if (c.ok) {
        sorted.push(copy(c.word));
      } else {
        discarded[c.reason]++;
        discardedSample.offer({ form: copy(form), reason: c.reason });
      }
    }
    sampleHeap();

    sorted.sort();
    let unique = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (unique === 0 || sorted[i] !== sorted[unique - 1]) sorted[unique++] = sorted[i]!;
    }
    discarded.duplicate = sorted.length - unique;
    sorted.length = unique;
    sampleHeap();

    const acceptedSample = new Reservoir<string>(SAMPLE_SIZE, SAMPLE_SEED);
    for (const w of sorted) acceptedSample.offer(w);

    const letterCounts = new Array<number>(26).fill(0);
    let letters = 0;
    for (const w of sorted) {
      for (let i = 0; i < w.length; i++) letterCounts[w.charCodeAt(i) - 97]!++;
      letters += w.length;
    }
    const letterWeights = letterCounts.map((n) => (letters ? n / letters : 0));

    const bytes = new Uint8Array(buildDawg(sorted, letterWeights));
    sampleHeap();

    const afterUppercase = expanded - discarded.uppercase;
    const afterNonLetter = afterUppercase - discarded['non-letter'];
    const afterLength = afterNonLetter - discarded.length;
    const stats: BuildStats = {
      source: { repo: opts.source.repo, commit: opts.source.commit },
      counts: { expanded, discarded, afterUppercase, afterNonLetter, afterLength, afterDedup: sorted.length },
      binBytes: bytes.byteLength,
      edgeCount: (bytes.byteLength - DAWG_HEADER_BYTES) / 4,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      letterWeights,
      peakHeapMb: round1(peakHeap / 2 ** 20),
      durationMs: Date.now() - started,
      samples: { seed: SAMPLE_SEED, accepted: acceptedSample.items, discarded: discardedSample.items },
    };

    await mkdir(opts.outDir, { recursive: true });
    const binPath = join(opts.outDir, 'pt-BR.dict.bin');
    const statsPath = join(opts.outDir, 'pt-BR.stats.json');
    await writeFile(binPath, bytes);
    await writeFile(statsPath, `${JSON.stringify(stats, null, 2)}\n`);
    return { binPath, statsPath, stats };
  } finally {
    clearInterval(timer);
  }
}

if (import.meta.main) {
  const root = new URL('..', import.meta.url);
  try {
    const source = (await loadPackConfig(fileURLToPath(new URL('../../languages/pt-BR', root)))).sources.vero;
    const { binPath, stats } = await buildDictionary({
      source,
      outDir: fileURLToPath(new URL('dist', root)),
      workDir: join(tmpdir(), 'bwords-dict-build', source.commit),
    });
    const c = stats.counts;
    console.log(`${binPath}: ${c.afterDedup} words, ${stats.binBytes} bytes, sha256 ${stats.sha256}`);
    console.log(
      `forms ${c.expanded} -> uppercase ${c.afterUppercase} -> non-letter ${c.afterNonLetter}` +
        ` -> length ${c.afterLength} -> dedup ${c.afterDedup}; peak heap ${stats.peakHeapMb} MB;` +
        ` ${(stats.durationMs / 1000).toFixed(1)} s`,
    );
  } catch (err) {
    console.error(`dict:build failed: ${(err as Error).message}`);
    process.exit(1);
  }
}
