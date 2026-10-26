import { describe, expect, test } from 'vitest';
import { buildDawg } from './dawg.ts';
import { LanguagePack } from './pack.ts';
import { buildSpellings } from './spellings.ts';

const WEIGHTS = new Array<number>(26).fill(1 / 26);
const dawg = (words: string[]) => buildDawg([...words].sort(), WEIGHTS);

const WORDS = ['casa', 'celular', 'faca', 'heptassilabo', 'merda', 'porra'];

function pack(common: string[], profanity: string[]): LanguagePack {
  return LanguagePack.fromBuffers({
    dict: dawg(WORDS),
    common: dawg(common),
    profanity: dawg(profanity),
    spellings: buildSpellings(new Map([['faca', ['faca', 'faça']]])),
    meta: { id: 'test', minCommonWords: { 4: 10, 5: 20, 6: 30 } },
  });
}

describe('LanguagePack', () => {
  test('isCommon matches the common set', () => {
    const p = pack(['casa', 'celular', 'faca'], ['merda']);
    for (const w of ['casa', 'celular', 'faca']) expect(p.isCommon(w), w).toBe(true);
    for (const w of ['heptassilabo', 'merda', 'porra', 'gato', '']) expect(p.isCommon(w), w).toBe(false);
    for (const w of WORDS) expect(p.isWord(w), w).toBe(true);
    expect(p.isWord('gato')).toBe(false);
    expect(p.spellings('faca')).toEqual(['faca', 'faça']);
    expect(p.spellings('casa')).toEqual(['casa']);
    expect(p.meta.id).toBe('test');
    expect(p.meta.minCommonWords[5]).toBe(20);
  });

  test('isProfane matches the profanity set', () => {
    const p = pack(['casa'], ['merda', 'porra']);
    for (const w of ['merda', 'porra']) expect(p.isProfane(w), w).toBe(true);
    for (const w of ['casa', 'celular', 'faca', 'heptassilabo', 'gato']) expect(p.isProfane(w), w).toBe(false);
    // Profanity stays a dictionary word.
    expect(p.isWord('merda')).toBe(true);
    // An empty profanity set marks nothing.
    const clean = pack(['casa'], []);
    for (const w of WORDS) expect(clean.isProfane(w), w).toBe(false);
  });
});
