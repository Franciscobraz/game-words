import { describe, expect, test } from 'vitest';
import { buildDawg } from './dawg.ts';
import { generateBoard } from './generator.ts';
import { LanguagePack, type PackMeta } from './pack.ts';
import { solve } from './solver.ts';
import { buildSpellings } from './spellings.ts';

// Rough pt-BR letter frequencies (a..z), in percent.
const PT_WEIGHTS = [
  14.6, 1.0, 3.9, 5.0, 12.6, 1.0, 1.3, 1.3, 6.2, 0.4, 0.02, 2.8, 4.7, 5.0, 10.7, 2.5, 1.2, 6.5, 7.8, 4.3, 4.6, 1.7,
  0.01, 0.2, 0.01, 0.5,
];

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Every 3-letter string: any board easily meets the minimum, so draws are never rejected. */
const ALL_TRIGRAMS = [...ALPHABET].flatMap((a) => [...ALPHABET].flatMap((b) => [...ALPHABET].map((c) => a + b + c)));

interface PackLists {
  common?: string[];
  profanity?: string[];
  minCommonWords?: PackMeta['minCommonWords'];
}

/** A fixture pack; without lists it has no common words, no profanity and no common-word minimum. */
function dict(words: string[], weights: number[], lists: PackLists = {}): LanguagePack {
  const dawg = (ws: string[]) => buildDawg([...new Set(ws)].sort(), weights);
  return LanguagePack.fromBuffers({
    dict: dawg(words),
    common: dawg(lists.common ?? []),
    profanity: dawg(lists.profanity ?? []),
    spellings: buildSpellings(new Map()),
    meta: { id: 'test', minCommonWords: lists.minCommonWords ?? {} },
  });
}

/** 700 random 3-4 letter words drawn by PT_WEIGHTS: many boards fall short of the minimum. */
function sparseWords(): string[] {
  let s = 7;
  const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
  const total = PT_WEIGHTS.reduce((a, b) => a + b, 0);
  const set = new Set<string>();
  while (set.size < 700) {
    const len = 3 + Math.floor(rnd() * 2);
    let w = '';
    for (let i = 0; i < len; i++) {
      let x = rnd() * total;
      let l = 0;
      while (l < 25 && (x -= PT_WEIGHTS[l]!) >= 0) l++;
      w += ALPHABET[l];
    }
    set.add(w);
  }
  return [...set];
}

function sparseDict(): LanguagePack {
  return dict(sparseWords(), PT_WEIGHTS);
}

/** Every row, column and diagonal of the board as tile lists, in both directions. */
function straightLines(board: readonly (readonly string[])[]): string[][] {
  const n = board.length;
  const lines: string[][] = [];
  for (let i = 0; i < n; i++) {
    lines.push(board[i]!.map((t) => t));
    lines.push(board.map((row) => row[i]!));
  }
  for (let k = -(n - 1); k <= n - 1; k++) {
    const diag: string[] = [];
    const anti: string[] = [];
    for (let r = 0; r < n; r++) {
      if (r - k >= 0 && r - k < n) diag.push(board[r]![r - k]!);
      if (r + k >= 0 && r + k < n) anti.push(board[r]![n - 1 - (r + k)]!);
    }
    lines.push(diag, anti);
  }
  return [...lines, ...lines.map((l) => [...l].reverse())];
}

/** Profane words of 4+ letters spelled by consecutive tiles of a straight line. */
function straightProfanity(board: readonly (readonly string[])[], profanity: Set<string>): string[] {
  const hits: string[] = [];
  for (const line of straightLines(board)) {
    for (let i = 0; i < line.length; i++) {
      for (let j = i + 1; j <= line.length; j++) {
        const word = line.slice(i, j).join('');
        if (word.length >= 4 && profanity.has(word)) hits.push(word);
      }
    }
  }
  return hits;
}

function permutations(s: string): string[] {
  if (s.length <= 1) return [s];
  return [...s].flatMap((c, i) => permutations(s.slice(0, i) + s.slice(i + 1)).map((rest) => c + rest));
}

function letterOf(tile: string): string {
  return tile === 'qu' ? 'q' : tile;
}

describe('generateBoard', () => {
  test('weights letters by dictionary frequency', () => {
    const weights = PT_WEIGHTS.map((w) => w + 1);
    const d = dict(ALL_TRIGRAMS, weights);
    const counts = new Map<string, number>();
    let tiles = 0;
    for (let seed = 0; seed < 2000; seed++) {
      for (const tile of generateBoard(4, seed, d).board.flat()) {
        counts.set(letterOf(tile), (counts.get(letterOf(tile)) ?? 0) + 1);
        tiles++;
      }
    }
    const total = weights.reduce((a, b) => a + b, 0);
    for (let l = 0; l < 26; l++) {
      const expected = weights[l]! / total;
      const actual = (counts.get(ALPHABET[l]!) ?? 0) / tiles;
      expect(actual, ALPHABET[l]).toBeGreaterThanOrEqual(expected * 0.8);
      expect(actual, ALPHABET[l]).toBeLessThanOrEqual(expected * 1.2);
    }
  });

  test('caps copies of a letter at 4', () => {
    const weights = new Array<number>(26).fill(0.004);
    weights[0] = 0.9; // "a" would fill most of the board without the cap
    const d = dict(ALL_TRIGRAMS, weights);
    for (const size of [4, 5, 6]) {
      for (let seed = 0; seed < 30; seed++) {
        const counts = new Map<string, number>();
        for (const tile of generateBoard(size, seed, d).board.flat()) counts.set(tile, (counts.get(tile) ?? 0) + 1);
        expect(Math.max(...counts.values())).toBeLessThanOrEqual(4);
        expect(counts.get('a')).toBe(4);
      }
    }
  });

  test('emits Q only as Qu', () => {
    const weights = new Array<number>(26).fill(1);
    weights[16] = 25; // "q" is half of the draws
    const d = dict(ALL_TRIGRAMS, weights);
    for (let seed = 0; seed < 30; seed++) {
      const tiles = generateBoard(6, seed, d).board.flat();
      expect(tiles.filter((t) => t === 'qu')).toHaveLength(4);
      for (const t of tiles) expect(t).toMatch(/^([a-pr-z]|qu)$/);
    }
  });

  test('meets the minimum word count per size', () => {
    const d = sparseDict();
    const minimum: Record<number, number> = { 4: 40, 5: 80, 6: 120 };
    for (const size of [4, 5, 6]) {
      const attempts: number[] = [];
      for (let seed = 0; seed < 10; seed++) {
        const result = generateBoard(size, seed, d);
        expect(result.board).toHaveLength(size);
        for (const row of result.board) expect(row).toHaveLength(size);
        const words = solve(result.board, d.dict, 3).size;
        expect(words).toBeGreaterThanOrEqual(minimum[size]!);
        expect(result.wordCount).toBe(words);
        attempts.push(result.attempts);
      }
      // Some first draws fell short and were redrawn.
      expect(Math.max(...attempts)).toBeGreaterThan(1);
    }
  });

  test('returns the same board for the same seed', () => {
    const d = sparseDict();
    for (const size of [4, 5, 6]) {
      const a = generateBoard(size, 42, d);
      const b = generateBoard(size, 42, sparseDict());
      expect(b).toEqual(a);
      expect(generateBoard(size, 43, d).board).not.toEqual(a.board);
    }
  });

  test('throws after 200 attempts', () => {
    const d = dict(['abc', 'casa'], PT_WEIGHTS);
    expect(() => generateBoard(4, 1, d)).toThrow(/200 attempts/);
  });

  test('meets the common-word minimum', () => {
    const common = sparseWords();
    const minCommonWords = { 4: 40, 5: 70, 6: 100 };
    // Every trigram is a word, so only the common-word minimum rejects boards.
    const d = dict([...ALL_TRIGRAMS, ...common], PT_WEIGHTS, { common, minCommonWords });
    for (const size of [4, 5, 6] as const) {
      const attempts: number[] = [];
      for (let seed = 0; seed < 10; seed++) {
        const result = generateBoard(size, seed, d);
        const commonCount = [...solve(result.board, d.dict, 3)].filter((w) => d.isCommon(w)).length;
        expect(commonCount).toBeGreaterThanOrEqual(minCommonWords[size]);
        expect(result.commonCount).toBe(commonCount);
        attempts.push(result.attempts);
      }
      // Some first draws fell short of the minimum and were redrawn.
      expect(Math.max(...attempts)).toBeGreaterThan(1);
    }
  });

  test('throws after 200 attempts when the common-word minimum is unreachable', () => {
    const d = dict(ALL_TRIGRAMS, PT_WEIGHTS, { common: ['abc', 'casa'], minCommonWords: { 4: 3 } });
    expect(() => generateBoard(4, 1, d)).toThrow(/200 attempts/);
  });

  test('rejects boards with straight-line profanity', () => {
    // Few letters, so profanity often lands in a straight line. "quao" spells 4 letters with 3 tiles;
    // "ora" is profane but shorter than 4 letters, so it may stay.
    const weights = new Array<number>(26).fill(0);
    for (const l of 'amorq') weights[l.charCodeAt(0) - 97] = 3;
    for (const l of 'eistu') weights[l.charCodeAt(0) - 97] = 1;
    const profanity = [...permutations('amor'), 'quao', 'ora'];
    const profane = new Set(profanity);
    const d = dict([...ALL_TRIGRAMS, ...profanity], weights, { profanity });
    let unfilteredHits = 0;
    let quHits = 0;
    let shortKept = 0;
    let redrawn = 0;
    for (const size of [4, 5, 6]) {
      for (let seed = 0; seed < 50; seed++) {
        const off = straightProfanity(generateBoard(size, seed, d, { filterProfanity: false }).board, profane);
        if (off.length > 0) unfilteredHits++;
        if (off.includes('quao')) quHits++;

        const on = generateBoard(size, seed, d, { filterProfanity: true });
        expect(straightProfanity(on.board, profane), JSON.stringify(on.board)).toEqual([]);
        if (on.attempts > 1) redrawn++;
        if (straightLines(on.board).some((line) => line.join('').includes('ora'))) shortKept++;
      }
    }
    // The fixture does produce straight-line profanity, including through the Qu tile, when unfiltered.
    expect(unfilteredHits).toBeGreaterThan(0);
    expect(quHits).toBeGreaterThan(0);
    expect(redrawn).toBeGreaterThan(0);
    // Profanity shorter than 4 letters does not reject a board.
    expect(shortKept).toBeGreaterThan(0);
  });

  test('throws a clear error when the weights leave too few letters', () => {
    // Only a and b have weight: 2 letters x 4 copies = 8 tiles, short of the 16 a 4x4 board needs.
    const weights = Array.from({ length: 26 }, (_, i) => (i < 2 ? 1 : 0));
    const d = dict(['aba', 'bab'], weights);
    expect(() => generateBoard(4, 1, d)).toThrow(
      'Not enough letters for a 4x4 board: 2 letter(s) with non-zero weight allow at most 8 tiles',
    );
  });
});
