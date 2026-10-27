import { describe, expect, test } from 'vitest';
import { HASH_PREFIX_BYTES, hashPrefix, hashPrefixes } from './hashes.ts';

// The core compiles without Node types, so node:crypto is loaded untyped, as the reference.
const NODE_CRYPTO: string = 'node:crypto';
const { createHash } = (await import(NODE_CRYPTO)) as {
  createHash(alg: string): { update(data: Uint8Array | string, enc?: string): unknown; digest(): Uint8Array };
};

function reference(salt: Uint8Array, word: string): Uint8Array {
  const h = createHash('sha256');
  h.update(salt);
  h.update(word, 'utf8');
  return new Uint8Array(h.digest()).subarray(0, 6);
}

const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

const SALT = Uint8Array.from({ length: 16 }, (_, i) => i);

describe('hashPrefix', () => {
  test('is the first 6 bytes of SHA-256(salt + UTF-8 word)', async () => {
    expect(HASH_PREFIX_BYTES).toBe(6);
    const prefix = await hashPrefix(SALT, 'gato');
    expect(prefix).toHaveLength(6);
    expect(hex(prefix)).toBe('53b801dd3d66');
    expect(hex(prefix)).toBe(hex(reference(SALT, 'gato')));
    expect(hex(await hashPrefix(SALT, 'ação'))).toBe(hex(reference(SALT, 'ação')));
  });

  test('same salt and word give the same prefix; other salts or words do not', async () => {
    const a = hex(await hashPrefix(SALT, 'gato'));
    expect(hex(await hashPrefix(Uint8Array.from(SALT), 'gato'))).toBe(a);
    const otherSalt = Uint8Array.from(SALT);
    otherSalt[15] = 0xff;
    expect(hex(await hashPrefix(otherSalt, 'gato'))).not.toBe(a);
    expect(hex(await hashPrefix(SALT, 'gata'))).not.toBe(a);
  });
});

describe('hashPrefixes', () => {
  test('concatenates the prefixes of every word in order', async () => {
    const words = ['ato', 'gato', 'toca', 'curva'];
    const all = await hashPrefixes(SALT, words);
    expect(all).toHaveLength(words.length * 6);
    words.forEach((w, i) => {
      expect(hex(all.subarray(i * 6, i * 6 + 6))).toBe(hex(reference(SALT, w)));
    });
    expect(await hashPrefixes(SALT, [])).toHaveLength(0);
  });
});
