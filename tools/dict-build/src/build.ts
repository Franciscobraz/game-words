import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Dawg, type DiscardReason, LanguagePack, buildDawg, buildSpellings, classifyForm, mulberry32 } from '@bwords/core';
import { type Calibration, calibrate } from './calibrate.ts';
import { type CleanupReport, cleanupVero } from './cleanup.ts';
import { fetchSource } from './fetch.ts';
import { loadCommonWords } from './frequency.ts';
import { applyLists, readWordList } from './lists.ts';
import { type FrequencySource, loadPackConfig } from './pack.ts';
import type { ExpandOptions } from './unmunch.ts';

export const SAMPLE_SIZE = 50;
export const SAMPLE_SEED = 20261026;
const DAWG_HEADER_BYTES = 16 + 26 * 8;
/** Binary files of `dist/<id>/`, whose SHA-256 goes into `meta.json`. */
export const PACK_FILES = ['dict.bin', 'common.bin', 'profanity.bin', 'spellings.bin'] as const;
/**
 * Appended to a word pushed from an accented form. It sorts below every letter, so after the sort the
 * plain form comes right before its marked copies ("faca", "faca\x01", "facas").
 */
const ACCENTED = '\x01';

const REPO_ROOT = new URL('../../../', import.meta.url);

export interface BuildOptions {
  /** Directory holding `<id>/pack.json` and the lists (default `<repo>/languages`). */
  languagesDir?: string;
  /** The pack is written to `<outRoot>/<id>/` (default `tools/dict-build/dist`). */
  outRoot?: string;
  /** Where the .dic/.aff are downloaded and the cleaned .aff written (default a temp dir per VERO commit). */
  workDir?: string;
  fetchImpl?: typeof fetch;
  unmunch?: ExpandOptions;
  /** Board calibration over the built pack (default `calibrate`). */
  calibrate?: (pack: LanguagePack) => Calibration;
}

export interface BuildStats {
  id: string;
  source: { repo: string; commit: string };
  frequency: FrequencySource;
  counts: {
    expanded: number;
    discarded: Record<DiscardReason | 'duplicate', number>;
    afterUppercase: number;
    afterNonLetter: number;
    afterLength: number;
    afterDedup: number;
    /** Words in dict.bin, after extra.txt and blocklist.txt. */
    words: number;
  };
  cleanup: CleanupReport;
  lists: { extraAdded: number; blocklistRemoved: number };
  common: number;
  profanity: number;
  spellings: { bytes: number; entries: number };
  calibration: Calibration;
  /** Size in bytes of each binary file. */
  files: Record<(typeof PACK_FILES)[number], number>;
  binBytes: number;
  edgeCount: number;
  sha256: string;
  letterWeights: number[];
  samples: { seed: number; accepted: string[]; discarded: { form: string; reason: DiscardReason }[] };
  /** Run measurement, not reproducible. */
  peakHeapMb: number;
  /** Run measurement, not reproducible. */
  durationMs: number;
}

export interface BuildResult {
  outDir: string;
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
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

function addSpelling(map: Map<string, Set<string>>, word: string, spelling: string) {
  let set = map.get(word);
  if (!set) map.set(word, (set = new Set()));
  set.add(spelling);
}

/** Index of `word` in a sorted unique array, or -1. */
function indexOf(sorted: readonly string[], word: string): number {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const w = sorted[mid]!;
    if (w === word) return mid;
    if (w < word) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

/**
 * Builds `languages/<id>/` into `<outRoot>/<id>/`: config, the pinned VERO expanded and cleaned, the
 * extra and blocklist lists, then the dictionary, display spellings, common and profanity sets, and the
 * board calibration over them, written as dict.bin, common.bin, profanity.bin, spellings.bin, meta.json and stats.json. The same inputs give
 * the same files; only `durationMs` and `peakHeapMb` in stats.json change between runs.
 */
export async function buildPack(id: string, opts: BuildOptions = {}): Promise<BuildResult> {
  const started = Date.now();
  let peakHeap = 0;
  const sampleHeap = () => {
    peakHeap = Math.max(peakHeap, process.memoryUsage().heapUsed);
  };
  const timer = setInterval(sampleHeap, 250);
  try {
    const languagesDir = opts.languagesDir ?? fileURLToPath(new URL('languages', REPO_ROOT));
    const packDir = join(languagesDir, id);
    const config = await loadPackConfig(packDir);
    const lists = applyLists({
      extra: await readWordList(join(packDir, 'extra.txt')),
      blocklist: await readWordList(join(packDir, 'blocklist.txt')),
    });
    const profanityList = await readWordList(join(packDir, 'profanity.txt'));

    const vero = config.sources.vero;
    const workDir = opts.workDir ?? join(tmpdir(), 'bwords-dict-build', vero.commit);
    const { dicPath, affPath } = await fetchSource(vero, workDir, opts.fetchImpl);
    const cleanup = await cleanupVero(dicPath, affPath, join(workDir, 'cleanup'), opts.unmunch);

    const discarded: Record<DiscardReason | 'duplicate', number> = {
      uppercase: 0,
      'non-letter': 0,
      length: 0,
      duplicate: 0,
    };
    // Only the normalized words are kept; the raw unmunch output is streamed (it passes 1 GB for pt_BR).
    // An array sorted and deduped in place costs far less heap than a Set of ~12M strings. A word that
    // came from an accented form is pushed with the ACCENTED mark, which tells whether the source also
    // has the plain form.
    const sorted: string[] = [];
    const spellings = new Map<string, Set<string>>();
    const discardedSample = new Reservoir<{ form: string; reason: DiscardReason }>(SAMPLE_SIZE, SAMPLE_SEED + 1);
    let expanded = 0;

    for await (const form of cleanup.forms) {
      expanded++;
      if (expanded % 1_000_000 === 0) sampleHeap();
      const c = classifyForm(form);
      if (!c.ok) {
        discarded[c.reason]++;
        discardedSample.offer({ form: copy(form), reason: c.reason });
        continue;
      }
      const spelling = form.normalize('NFC');
      if (spelling === c.word) {
        sorted.push(copy(c.word));
      } else {
        sorted.push(copy(c.word + ACCENTED));
        addSpelling(spellings, copy(c.word), copy(spelling));
      }
    }
    sampleHeap();

    sorted.sort();
    const pushed = sorted.length;
    const plain = new Set<string>();
    let unique = 0;
    let lastPlain = '';
    for (let i = 0; i < sorted.length; i++) {
      let w = sorted[i]!;
      if (w.endsWith(ACCENTED)) {
        w = w.slice(0, -1);
        if (w === lastPlain) plain.add(w);
      } else {
        lastPlain = w;
      }
      if (unique === 0 || w !== sorted[unique - 1]) sorted[unique++] = w;
    }
    sorted.length = unique;
    discarded.duplicate = pushed - unique;
    const afterDedup = unique;
    sampleHeap();

    // extra.txt and blocklist.txt.
    let extraAdded = 0;
    const added: string[] = [];
    for (const e of lists.extra) {
      if (indexOf(sorted, e.word) < 0 && !added.includes(e.word)) {
        added.push(e.word);
        extraAdded++;
      }
      const spelling = e.spelling.normalize('NFC');
      if (spelling === e.word) plain.add(e.word);
      else addSpelling(spellings, e.word, spelling);
    }
    let blocklistRemoved = 0;
    const blocked = new Set(lists.blocked);
    let words = sorted;
    if (added.length > 0 || blocked.size > 0) {
      words = [...sorted, ...added].filter((w) => {
        if (!blocked.has(w)) return true;
        blocklistRemoved++;
        return false;
      });
      words.sort();
    }
    for (const w of blocked) spellings.delete(w);

    const acceptedSample = new Reservoir<string>(SAMPLE_SIZE, SAMPLE_SEED);
    for (const w of words) acceptedSample.offer(w);

    const letterCounts = new Array<number>(26).fill(0);
    let letters = 0;
    for (const w of words) {
      for (let i = 0; i < w.length; i++) letterCounts[w.charCodeAt(i) - 97]!++;
      letters += w.length;
    }
    const letterWeights = letterCounts.map((n) => (letters ? n / letters : 0));

    const dictBytes = new Uint8Array(buildDawg(words, letterWeights));
    const dict = Dawg.fromBuffer(dictBytes.buffer);
    sampleHeap();

    // A key's spellings include the plain form when the source or extra.txt has it.
    const spellingEntries: [string, string[]][] = [];
    for (const [word, set] of spellings) {
      spellingEntries.push([word, plain.has(word) ? [word, ...set] : [...set]]);
    }
    const spellingsBytes = new Uint8Array(buildSpellings(spellingEntries));
    spellings.clear();
    plain.clear();

    const profane = new Set<string>();
    for (const e of profanityList) {
      const c = classifyForm(e.word);
      if (!c.ok) throw new Error(`profanity.txt line ${e.line}: "${e.word}" fails the ${c.reason} filter`);
      if (!dict.has(c.word)) throw new Error(`profanity.txt line ${e.line}: "${e.word}" is not in the dictionary`);
      profane.add(c.word);
    }
    const profanityBytes = new Uint8Array(buildDawg([...profane].sort(), letterWeights));

    const common = await loadCommonWords(config.sources.frequency, dict, opts.fetchImpl);
    const commonBytes = new Uint8Array(buildDawg(common, letterWeights));
    sampleHeap();

    const binaries: Record<(typeof PACK_FILES)[number], Uint8Array> = {
      'dict.bin': dictBytes,
      'common.bin': commonBytes,
      'profanity.bin': profanityBytes,
      'spellings.bin': spellingsBytes,
    };
    const calibration = (opts.calibrate ?? calibrate)(
      LanguagePack.fromBuffers({
        dict: dictBytes.buffer,
        common: commonBytes.buffer,
        profanity: profanityBytes.buffer,
        spellings: spellingsBytes.buffer,
        meta: { id: config.id, minCommonWords: {} },
      }),
    );
    sampleHeap();

    const meta = {
      id: config.id,
      letterWeights,
      minCommonWords: Object.fromEntries(Object.entries(calibration.sizes).map(([size, c]) => [size, c.minCommonWords])),
      sha256: Object.fromEntries(PACK_FILES.map((f) => [f, sha256(binaries[f])])),
    };

    const afterUppercase = expanded - discarded.uppercase;
    const afterNonLetter = afterUppercase - discarded['non-letter'];
    const afterLength = afterNonLetter - discarded.length;
    const stats: BuildStats = {
      id: config.id,
      source: { repo: vero.repo, commit: vero.commit },
      frequency: config.sources.frequency,
      counts: { expanded, discarded, afterUppercase, afterNonLetter, afterLength, afterDedup, words: words.length },
      cleanup: cleanup.report(),
      lists: { extraAdded, blocklistRemoved },
      common: common.length,
      profanity: profane.size,
      spellings: { bytes: spellingsBytes.byteLength, entries: spellingEntries.length },
      calibration,
      files: Object.fromEntries(PACK_FILES.map((f) => [f, binaries[f].byteLength])) as BuildStats['files'],
      binBytes: dictBytes.byteLength,
      edgeCount: (dictBytes.byteLength - DAWG_HEADER_BYTES) / 4,
      sha256: meta.sha256['dict.bin']!,
      letterWeights,
      samples: { seed: SAMPLE_SEED, accepted: acceptedSample.items, discarded: discardedSample.items },
      peakHeapMb: 0,
      durationMs: 0,
    };

    const outDir = join(opts.outRoot ?? fileURLToPath(new URL('tools/dict-build/dist', REPO_ROOT)), id);
    await mkdir(outDir, { recursive: true });
    for (const f of PACK_FILES) await writeFile(join(outDir, f), binaries[f]);
    await writeFile(join(outDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);
    sampleHeap();
    stats.peakHeapMb = round1(peakHeap / 2 ** 20);
    stats.durationMs = Date.now() - started;
    await writeFile(join(outDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
    return { outDir, stats };
  } finally {
    clearInterval(timer);
  }
}

if (import.meta.main) {
  const id = process.argv[2];
  try {
    if (!id) throw new Error('usage: npm run dict:build -- <language id>, e.g. pt-BR');
    const { outDir, stats } = await buildPack(id);
    const c = stats.counts;
    console.log(
      `${outDir}: ${c.words} words (${stats.common} common, ${stats.profanity} profane), ` +
        `${stats.spellings.entries} spellings entries; dict ${stats.binBytes} bytes, sha256 ${stats.sha256}`,
    );
    console.log(
      `forms ${c.expanded} -> uppercase ${c.afterUppercase} -> non-letter ${c.afterNonLetter}` +
        ` -> length ${c.afterLength} -> dedup ${c.afterDedup} -> lists ${c.words};` +
        ` cleanup: ${stats.cleanup.forbidden.count} forbidden, ${stats.cleanup.enclitic.count} enclitic;` +
        ` peak heap ${stats.peakHeapMb} MB; ${(stats.durationMs / 1000).toFixed(1)} s`,
    );
    for (const [size, c] of Object.entries(stats.calibration.sizes)) {
      console.log(`${size}x${size}: min common words ${c.minCommonWords} (common min ${c.min}, median ${c.median}, max ${c.max})`);
    }
  } catch (err) {
    console.error(`dict:build failed: ${(err as Error).message}`);
    process.exit(1);
  }
}
