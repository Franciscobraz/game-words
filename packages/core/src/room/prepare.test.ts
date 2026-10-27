import { describe, expect, test } from 'vitest';
import { generateBoard } from '../generator.ts';
import { solve } from '../solver.ts';
import { boardSolutions } from '../validate.ts';
import { HASH_PREFIX_BYTES, hashPrefix, hashPrefixes } from './hashes.ts';
import { prepareRound, toBase64Url } from './prepare.ts';
import { DEFAULT_SETTINGS } from './state.ts';
import { richPack } from './test-helpers.ts';

// The core compiles without Node types, so node:buffer is loaded untyped, as the reference encoder.
const NODE_BUFFER: string = 'node:buffer';
const { Buffer } = (await import(NODE_BUFFER)) as {
  Buffer: { from(bytes: Uint8Array): { toString(encoding: 'hex' | 'base64url'): string } };
};

const SALT = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

/** Splits concatenated prefixes into one hex string per word. */
function prefixList(prefixes: Uint8Array): string[] {
  const out: string[] = [];
  for (let i = 0; i < prefixes.length; i += HASH_PREFIX_BYTES) {
    out.push(Buffer.from(prefixes.slice(i, i + HASH_PREFIX_BYTES)).toString('hex'));
  }
  return out;
}

describe('prepareRound', () => {
  test('keeps profanity out of the solutions and the prefixes', async () => {
    const pack = richPack();
    // The first seed whose board has profane words: the filter is what keeps them out.
    let seed = 0;
    let r;
    let profane: string[];
    do {
      r = await prepareRound(pack, { ...DEFAULT_SETTINGS, filterProfanity: true }, ++seed, SALT);
      profane = [...solve(r.board, pack.dict, 3)].filter((w) => pack.isProfane(w));
    } while (profane.length === 0 && seed < 50);
    expect(profane.length).toBeGreaterThan(0);
    expect(r.solutions.words.filter((w) => pack.isProfane(w))).toEqual([]);
    const prefixes = new Set(prefixList(r.solutions.prefixes));
    for (const w of profane) {
      const own = Buffer.from(await hashPrefix(SALT, w)).toString('hex');
      expect(prefixes.has(own), w).toBe(false);
    }
    // With the filter off the same kind of words count as solutions.
    const off = await prepareRound(pack, { ...DEFAULT_SETTINGS, filterProfanity: false }, seed, SALT);
    expect(off.solutions.words.some((w) => pack.isProfane(w))).toBe(true);
  });

  test('the prefixes are hashPrefixes of the solutions in the same order', async () => {
    const r = await prepareRound(richPack(), DEFAULT_SETTINGS, 5, SALT);
    expect(r.solutions.words.length).toBeGreaterThan(0);
    expect(r.solutions.prefixes).toEqual(await hashPrefixes(SALT, r.solutions.words));
    expect(r.solutions.prefixes.length).toBe(r.solutions.words.length * HASH_PREFIX_BYTES);
  });

  test.each([
    [4, 3],
    [5, 3],
    [6, 4],
  ] as const)('uses the room size %i and minimum length %i', async (size, minLength) => {
    const pack = richPack();
    const settings = { ...DEFAULT_SETTINGS, size, minLength };
    const r = await prepareRound(pack, settings, 3, SALT);
    // The board is the generator's for this seed; the solutions are the valid ones with the room's rules.
    expect(r.board).toEqual(generateBoard(size, 3, pack, { filterProfanity: true }).board);
    const { words } = boardSolutions(r.board, pack, { minLength, filterProfanity: true });
    expect(r.solutions.words).toEqual([...words].sort());
    expect(r.options).toEqual({ size, minLength, filterProfanity: true, pack: 'pt-BR' });
  });

  test('carries the salt in base64url', async () => {
    const r = await prepareRound(richPack(), DEFAULT_SETTINGS, 1, SALT);
    expect(r.salt).toBe(Buffer.from(SALT).toString('base64url'));
    expect(r.salt).toHaveLength(22);
  });
});

describe('toBase64Url', () => {
  test.each([[[]], [[255]], [[255, 254]], [[0, 1, 2]], [[251, 255, 191, 62]]])('matches node for %j', (bytes) => {
    const u8 = new Uint8Array(bytes);
    expect(toBase64Url(u8)).toBe(Buffer.from(u8).toString('base64url'));
  });
});
