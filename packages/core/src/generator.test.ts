import { describe, expect, test } from 'vitest';
import { Dawg, buildDawg } from './dawg.ts';
import { generateBoard } from './generator.ts';
import { solve } from './solver.ts';

// Rough pt-BR letter frequencies (a..z), in percent.
const PT_WEIGHTS = [
  14.6, 1.0, 3.9, 5.0, 12.6, 1.0, 1.3, 1.3, 6.2, 0.4, 0.02, 2.8, 4.7, 5.0, 10.7, 2.5, 1.2, 6.5, 7.8, 4.3, 4.6, 1.7,
  0.01, 0.2, 0.01, 0.5,
];

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Every 3-letter string: any board easily meets the minimum, so draws are never rejected. */
const ALL_TRIGRAMS = [...ALPHABET].flatMap((a) => [...ALPHABET].flatMap((b) => [...ALPHABET].map((c) => a + b + c)));

function dict(words: string[], weights: number[]): Dawg {
  return Dawg.fromBuffer(buildDawg([...new Set(words)].sort(), weights));
}

/** 700 random 3-4 letter words drawn by PT_WEIGHTS: many boards fall short of the minimum. */
function sparseDict(): Dawg {
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
  return dict([...set], PT_WEIGHTS);
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
        const words = solve(result.board, d, 3).size;
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
});
