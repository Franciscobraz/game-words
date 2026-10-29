import { hashPrefixes, HASH_PREFIX_BYTES, wordPoints } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { type JudgeContext, judgeWord } from './judge.ts';
import { toHex } from './room-view.ts';

/** A fixed salt, so the round's hashes are the same on every run. */
const SALT = new Uint8Array([7, 1, 2, 9, 4, 4, 0, 255]);

/** The valid words of the test round. */
const ROUND_WORDS = ['casa', 'quero', 'mar', 'sereia'];

/** The round's hash set, built as the server builds the frame (`hashPrefixes`) and the phone reads it. */
async function roundHashes(words: readonly string[]): Promise<Set<string>> {
  const prefixes = await hashPrefixes(SALT, words);
  const set = new Set<string>();
  for (let start = 0; start < prefixes.length; start += HASH_PREFIX_BYTES) {
    set.add(toHex(prefixes.subarray(start, start + HASH_PREFIX_BYTES)));
  }
  return set;
}

async function context(overrides: Partial<JudgeContext> = {}): Promise<JudgeContext> {
  return { minLength: 3, found: [], salt: SALT, hashes: await roundHashes(ROUND_WORDS), ...overrides };
}

describe('judgeWord', () => {
  test('judges a matching hash as valid with the core points', async () => {
    // PLAY-01 AC 7: "VÁLIDA (+N PTS)" with `wordPoints`.
    const ctx = await context();

    expect(await judgeWord('casa', ctx)).toEqual({ kind: 'valid', word: 'casa', points: wordPoints('casa') });
    expect(await judgeWord('casa', ctx)).toEqual({ kind: 'valid', word: 'casa', points: 2 });
    expect(await judgeWord('quero', ctx)).toEqual({ kind: 'valid', word: 'quero', points: 3 });
    expect(await judgeWord('sereia', ctx)).toEqual({ kind: 'valid', word: 'sereia', points: 4 });
  });

  test('judges a word already in the list as already found', async () => {
    // PLAY-01 AC 8: the list wins over the hash, which also matches.
    const ctx = await context({ found: ['mar', 'casa'] });

    expect(await judgeWord('casa', ctx)).toEqual({ kind: 'already-found', word: 'casa' });
    expect(await judgeWord('quero', ctx)).toEqual({ kind: 'valid', word: 'quero', points: 3 });
  });

  test('judges a non-matching hash as invalid', async () => {
    // PLAY-01 AC 9.
    const ctx = await context();

    expect(await judgeWord('cassa', ctx)).toEqual({ kind: 'invalid', word: 'cassa' });
    // The same word under another salt does not match either.
    expect(await judgeWord('casa', { ...ctx, salt: new Uint8Array([1]) })).toEqual({ kind: 'invalid', word: 'casa' });
  });

  test('judges every word as invalid before the round salt arrives', async () => {
    const ctx = await context({ salt: null });

    expect(await judgeWord('casa', ctx)).toEqual({ kind: 'invalid', word: 'casa' });
  });

  test('judges a word below the room minimum as too short, at the exact limit', async () => {
    // PLAY-01 AC 10, L-001: with a 4-letter minimum, 3 letters are too short and 4 are enough.
    const ctx = await context({ minLength: 4 });

    expect(await judgeWord('mar', ctx)).toEqual({ kind: 'too-short', word: 'mar' });
    expect(await judgeWord('casa', ctx)).toEqual({ kind: 'valid', word: 'casa', points: 2 });

    // With a 3-letter minimum, 2 letters are too short and 3 are enough.
    const ctx3 = await context({ minLength: 3 });
    expect(await judgeWord('ma', ctx3)).toEqual({ kind: 'too-short', word: 'ma' });
    expect(await judgeWord('mar', ctx3)).toEqual({ kind: 'valid', word: 'mar', points: 1 });
  });

  test('checks the length first, then the list, then the hash', async () => {
    // A short word already in the list is too short; a listed word whose hash fails is already found.
    const ctx = await context({ minLength: 4, found: ['mar', 'zzzz'] });

    expect(await judgeWord('mar', ctx)).toEqual({ kind: 'too-short', word: 'mar' });
    expect(await judgeWord('zzzz', ctx)).toEqual({ kind: 'already-found', word: 'zzzz' });
  });
});
