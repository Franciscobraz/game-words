import { describe, expect, test } from 'vitest';
import { Dawg, buildDawg } from './dawg.ts';

// Words sharing suffixes ("-ar", "-as", "-ando") exercise the DAWG minimization.
const WORDS = [
  'acao', 'amar', 'amas', 'amando', 'cacao', 'cantar', 'cantas', 'cantando', 'casa', 'casar', 'casas',
  'contar', 'contas', 'contando', 'falar', 'falas', 'falando', 'mesa', 'mesas', 'tar', 'zebra',
].sort();

const WEIGHTS = Array.from({ length: 26 }, (_, i) => (i + 1) / 351);

function load(words: string[] = WORDS): Dawg {
  return Dawg.fromBuffer(buildDawg(words, WEIGHTS));
}

/** Deterministic pseudo-random word list, sorted and unique. */
function randomWords(count: number, seed: number): string[] {
  let s = seed;
  const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
  const set = new Set<string>();
  while (set.size < count) {
    const len = 3 + Math.floor(rnd() * 8);
    let w = '';
    for (let i = 0; i < len; i++) w += String.fromCharCode(97 + Math.floor(rnd() * 6));
    set.add(w);
  }
  return [...set].sort();
}

describe('Dawg', () => {
  test('has returns true for every stored word', () => {
    const dawg = load();
    for (const w of WORDS) expect(dawg.has(w), w).toBe(true);
    expect(dawg.wordCount).toBe(WORDS.length);
    expect(Array.from(dawg.letterWeights)).toEqual(WEIGHTS);

    // Minimization: shared suffixes are stored once, so there are fewer edges than trie nodes.
    const trieNodes = new Set(WORDS.flatMap((w) => [...w].map((_, i) => w.slice(0, i + 1)))).size;
    expect(dawg.edgeCount).toBeLessThan(trieNodes);

    const many = randomWords(3000, 1);
    const big = load(many);
    for (const w of many) expect(big.has(w), w).toBe(true);
    expect(big.wordCount).toBe(many.length);
  });

  test('has returns false for unknown words', () => {
    const dawg = load();
    for (const w of ['cas', 'cant', 'ama', 'casass', 'zebras', 'cantor', 'falando s', 'Casa', 'b', '', 'mesasa']) {
      expect(dawg.has(w), w).toBe(false);
    }
    const many = randomWords(3000, 1);
    const stored = new Set(many);
    const big = load(many);
    let unknown = 0;
    for (const w of randomWords(3000, 2)) {
      if (stored.has(w)) continue;
      unknown++;
      expect(big.has(w), w).toBe(false);
    }
    expect(unknown).toBeGreaterThan(1000);
    for (const w of many) {
      const prefix = w.slice(0, -1);
      expect(big.has(prefix), prefix).toBe(stored.has(prefix));
    }
  });

  test('hasPrefix matches stored prefixes only', () => {
    const dawg = load();
    for (const p of ['c', 'ca', 'cant', 'canta', 'casas', 'zebr', 'falan', 'mesa', 't']) {
      expect(dawg.hasPrefix(p), p).toBe(true);
    }
    for (const p of ['b', 'cx', 'casasx', 'zz', 'cantb', 'tara', 'Ca', 'me sa']) {
      expect(dawg.hasPrefix(p), p).toBe(false);
    }
  });

  test('rejects a buffer with a bad header', () => {
    const good = buildDawg(WORDS, WEIGHTS);

    const badMagic = good.slice(0);
    new Uint8Array(badMagic)[0] = 'X'.charCodeAt(0);
    expect(() => Dawg.fromBuffer(badMagic)).toThrow(/magic/i);

    const badVersion = good.slice(0);
    new DataView(badVersion).setUint32(4, 99, true);
    expect(() => Dawg.fromBuffer(badVersion)).toThrow(/version 99/i);

    expect(() => Dawg.fromBuffer(new ArrayBuffer(3))).toThrow(/magic/i);
  });
});
