import { describe, expect, test } from 'vitest';
import { buildDawg } from './dawg.ts';
import { pickLongestWord } from './longest.ts';
import { LanguagePack } from './pack.ts';
import { buildSpellings } from './spellings.ts';

const WEIGHTS = new Array<number>(26).fill(1 / 26);
const dawg = (words: string[]) => buildDawg([...new Set(words)].sort(), WEIGHTS);

const WORDS = ['bolo', 'casa', 'celular', 'gato', 'heptassilabo', 'pato', 'porradas', 'sapo', 'xyzw', 'zuzu'];
const PACK = LanguagePack.fromBuffers({
  dict: dawg(WORDS),
  common: dawg(['bolo', 'casa', 'celular', 'gato', 'porradas', 'sapo']),
  profanity: dawg(['porradas']),
  spellings: buildSpellings(new Map()),
  meta: { id: 'test', minCommonWords: {} },
});

const nobody = new Map<string, Set<string>>();

describe('pickLongestWord', () => {
  test('picks the longest common word', () => {
    const solutions = new Set(['casa', 'celular', 'gato', 'heptassilabo', 'pato']);
    // "heptassilabo" is longer but rare.
    expect(pickLongestWord(solutions, PACK, nobody, true)?.word).toBe('celular');
    // A profane common word is never picked while the filter is on, and is a common word while it is off.
    const withProfanity = new Set([...solutions, 'porradas']);
    expect(pickLongestWord(withProfanity, PACK, nobody, true)?.word).toBe('celular');
    expect(pickLongestWord(withProfanity, PACK, nobody, false)?.word).toBe('porradas');
  });

  test('prefers a word someone found', () => {
    const solutions = new Set(['bolo', 'casa', 'gato', 'sapo', 'heptassilabo']);
    const found = new Map([
      ['ana', new Set(['casa'])],
      ['bia', new Set(['sapo', 'bolo'])],
    ]);
    // "casa" and "bolo" were found too, but "bolo" sorts first among the found ones.
    expect(pickLongestWord(solutions, PACK, found, true)?.word).toBe('bolo');
    const onlySapo = new Map([['bia', new Set(['sapo'])]]);
    expect(pickLongestWord(solutions, PACK, onlySapo, true)?.word).toBe('sapo');
  });

  test('breaks remaining ties alphabetically', () => {
    const solutions = new Set(['sapo', 'gato', 'casa', 'pato']);
    expect(pickLongestWord(solutions, PACK, nobody, true)?.word).toBe('casa');
    const found = new Map([['ana', new Set(['sapo', 'gato'])]]);
    expect(pickLongestWord(solutions, PACK, found, true)?.word).toBe('gato');
  });

  test('falls back to all solutions', () => {
    // No common word on the board: the longest valid solution wins, with the same tie-breaks.
    expect(pickLongestWord(new Set(['pato', 'heptassilabo', 'zuzu']), PACK, nobody, true)?.word).toBe('heptassilabo');
    expect(pickLongestWord(new Set(['zuzu', 'xyzw', 'pato']), PACK, nobody, true)?.word).toBe('pato');
    const found = new Map([['ana', new Set(['zuzu'])]]);
    expect(pickLongestWord(new Set(['zuzu', 'xyzw', 'pato']), PACK, found, true)?.word).toBe('zuzu');
    // The only common word is profane and filtered: it neither wins nor blocks the fallback.
    expect(pickLongestWord(new Set(['porradas', 'pato']), PACK, nobody, true)?.word).toBe('pato');
    expect(pickLongestWord(new Set(['porradas']), PACK, nobody, true)).toBeNull();
    expect(pickLongestWord(new Set(), PACK, nobody, true)).toBeNull();
  });

  test('names the players who found it', () => {
    const solutions = new Set(['casa', 'celular', 'gato']);
    const found = new Map([
      ['ana', new Set(['celular', 'casa'])],
      ['bia', new Set(['gato'])],
      ['caio', new Set(['celular'])],
    ]);
    expect(pickLongestWord(solutions, PACK, found, true)).toEqual({ word: 'celular', common: true, foundBy: ['ana', 'caio'] });
    expect(pickLongestWord(solutions, PACK, nobody, true)).toEqual({ word: 'celular', common: true, foundBy: [] });
    expect(pickLongestWord(new Set(['heptassilabo']), PACK, nobody, true)).toEqual({
      word: 'heptassilabo',
      common: false,
      foundBy: [],
    });
  });
});
