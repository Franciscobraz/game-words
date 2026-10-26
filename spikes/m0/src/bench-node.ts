/**
 * Local Node benchmark (M0 spike, disposable): heap after loading the dictionary, load time, and the
 * wall time of 100 6x6 solves and 20 6x6 generations. Run with --expose-gc for a settled heap reading.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Dawg, LanguagePack, buildDawg, buildSpellings, generateBoard, solve } from '@bwords/core';
import { BOARD_SIZE, GENERATE_SEEDS, SOLVE_SEEDS, randomBoard } from './boards.ts';

const BIN = fileURLToPath(new URL('../../../tools/dict-build/dist/pt-BR.dict.bin', import.meta.url));
const OUT = fileURLToPath(new URL('../results/node.json', import.meta.url));

/** M1 adapter: the spike only has the dictionary, so the pack has no common words, profanity or minimums. */
function dictOnlyPack(dict: ArrayBuffer, dawg: Dawg): LanguagePack {
  const empty = buildDawg([], [...dawg.letterWeights]);
  return LanguagePack.fromBuffers({
    dict,
    common: empty,
    profanity: empty,
    spellings: buildSpellings([]),
    meta: { id: 'pt-BR', minCommonWords: {} },
  });
}

const mb = (bytes: number) => Math.round((bytes / 2 ** 20) * 10) / 10;
const ms = (n: number) => Math.round(n * 100) / 100;
const gc = (globalThis as { gc?: () => void }).gc;

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
}

const summary = (values: number[]) => ({
  p50Ms: ms(percentile(values, 50)),
  p95Ms: ms(percentile(values, 95)),
  maxMs: ms(Math.max(...values)),
});

gc?.();
const before = process.memoryUsage();
const t0 = performance.now();
const file = await readFile(BIN);
// Use the file's own ArrayBuffer when it is not a pooled slice, so the dictionary is held once.
const buf =
  file.byteOffset === 0 && file.buffer.byteLength === file.byteLength
    ? (file.buffer as ArrayBuffer)
    : file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
const dawg = Dawg.fromBuffer(buf);
const loadMs = performance.now() - t0;
gc?.();
const after = process.memoryUsage();
// Built after the measurements, so load time and memory stay comparable with M0.
const pack = dictOnlyPack(buf, dawg);

const solves = SOLVE_SEEDS.map((seed) => {
  const board = randomBoard(seed, dawg.letterWeights);
  const t = performance.now();
  const words = solve(board, dawg, 3).size;
  return { seed, ms: ms(performance.now() - t), words };
});

const generations = GENERATE_SEEDS.map((seed) => {
  const t = performance.now();
  const g = generateBoard(BOARD_SIZE, seed, pack);
  return { seed, ms: ms(performance.now() - t), attempts: g.attempts, words: g.wordCount };
});

const result = {
  node: process.version,
  gcSettled: gc !== undefined,
  binBytes: buf.byteLength,
  words: dawg.wordCount,
  heapUsedMb: mb(after.heapUsed),
  heapUsedDeltaMb: mb(after.heapUsed - before.heapUsed),
  arrayBuffersMb: mb(after.arrayBuffers),
  /** Heap plus the dictionary's ArrayBuffer (held outside the JS heap). */
  memoryMb: mb(after.heapUsed + after.arrayBuffers),
  rssMb: mb(after.rss),
  loadMs: ms(loadMs),
  solve: { count: solves.length, ...summary(solves.map((s) => s.ms)), runs: solves },
  generate: {
    count: generations.length,
    ...summary(generations.map((g) => g.ms)),
    meanAttempts: generations.reduce((a, g) => a + g.attempts, 0) / generations.length,
    runs: generations,
  },
};

await mkdir(fileURLToPath(new URL('../results', import.meta.url)), { recursive: true });
await writeFile(OUT, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `heap ${result.heapUsedMb} MB (+${result.arrayBuffersMb} MB buffers), load ${result.loadMs} ms, ` +
    `solve p50/p95 ${result.solve.p50Ms}/${result.solve.p95Ms} ms, ` +
    `generate p50/p95 ${result.generate.p50Ms}/${result.generate.p95Ms} ms -> ${OUT}`,
);
