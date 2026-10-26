import { describe, expect, test } from 'vitest';
import { buildDawg } from './dawg.ts';
import { LanguagePack } from './pack.ts';
import { buildSpellings } from './spellings.ts';
import { boardSolutions, validateSubmission, type SubmissionContext } from './validate.ts';

const WEIGHTS = new Array<number>(26).fill(1 / 26);
const dawg = (words: string[]) => buildDawg([...new Set(words)].sort(), WEIGHTS);

// g a t o    0  1  2  3
// e s c a    4  5  6  7
// l u r v    8  9 10 11
// x i m e   12 13 14 15
const BOARD = [
  ['g', 'a', 't', 'o'],
  ['e', 's', 'c', 'a'],
  ['l', 'u', 'r', 'v'],
  ['x', 'i', 'm', 'e'],
];
const WORDS = ['ato', 'cata', 'cru', 'curva', 'gas', 'gato', 'lume', 'mira', 'oca', 'rim', 'seu', 'sul', 'taca', 'toca', 'vem'];
// "gato" is both common and profane.
const COMMON = ['ato', 'curva', 'gato', 'toca'];
const PROFANITY = ['gato', 'sul'];

const PACK = LanguagePack.fromBuffers({
  dict: dawg(WORDS),
  common: dawg(COMMON),
  profanity: dawg(PROFANITY),
  spellings: buildSpellings(new Map()),
  meta: { id: 'test', minCommonWords: {} },
});

const PATHS = {
  ato: [1, 2, 3],
  toca: [2, 3, 6, 7],
  curva: [6, 9, 10, 11, 7],
  gato: [0, 1, 2, 3],
  sul: [5, 9, 8],
  rim: [10, 13, 14],
};

function ctx(over: Partial<SubmissionContext> = {}): SubmissionContext {
  const minLength = over.minLength ?? 3;
  const filterProfanity = over.filterProfanity ?? true;
  return {
    solutions: boardSolutions(BOARD, PACK, { minLength, filterProfanity }).words,
    found: new Set(),
    minLength,
    filterProfanity,
    pack: PACK,
    ...over,
  };
}

describe('validateSubmission', () => {
  test('accepts a valid path', () => {
    expect(validateSubmission(BOARD, PATHS.ato, ctx())).toEqual({ ok: true, word: 'ato' });
    expect(validateSubmission(BOARD, PATHS.toca, ctx())).toEqual({ ok: true, word: 'toca' });
    expect(validateSubmission(BOARD, PATHS.curva, ctx({ minLength: 4 }))).toEqual({ ok: true, word: 'curva' });
    // Exactly the minimum length is enough.
    expect(validateSubmission(BOARD, PATHS.toca, ctx({ minLength: 4 }))).toEqual({ ok: true, word: 'toca' });
  });

  test('rejects an invalid path', () => {
    const invalid = { ok: false, reason: 'invalid-path' };
    // Repeated tile.
    expect(validateSubmission(BOARD, [2, 3, 2], ctx())).toEqual(invalid);
    expect(validateSubmission(BOARD, [6, 7, 6, 7], ctx())).toEqual(invalid);
    // Non-adjacent tiles, even when the letters spell a word ("gas": g=0, a=7, s=5).
    expect(validateSubmission(BOARD, [0, 7, 5], ctx())).toEqual(invalid);
    expect(validateSubmission(BOARD, [0, 2, 3], ctx())).toEqual(invalid);
    // Wrapping from the end of a row to the start of the next is not adjacent (o=3, e=4).
    expect(validateSubmission(BOARD, [2, 3, 4], ctx())).toEqual(invalid);
    // Off the board.
    expect(validateSubmission(BOARD, [2, 3, 16], ctx())).toEqual(invalid);
    expect(validateSubmission(BOARD, [-1, 0, 1], ctx())).toEqual(invalid);
    expect(validateSubmission(BOARD, [1, 1.5, 2], ctx())).toEqual(invalid);
  });

  test('rejects a word below the minimum', () => {
    expect(validateSubmission(BOARD, PATHS.ato, ctx({ minLength: 4 }))).toEqual({ ok: false, reason: 'too-short' });
    expect(validateSubmission(BOARD, PATHS.rim, ctx({ minLength: 4 }))).toEqual({ ok: false, reason: 'too-short' });
    // Below the minimum and not a word: the length is reported first.
    expect(validateSubmission(BOARD, [0, 1, 2], ctx({ minLength: 4 }))).toEqual({ ok: false, reason: 'too-short' });
  });

  test('rejects a non-word', () => {
    // "gat", "gasc" and "otca" are valid paths that spell no dictionary word.
    expect(validateSubmission(BOARD, [0, 1, 2], ctx())).toEqual({ ok: false, reason: 'not-a-word' });
    expect(validateSubmission(BOARD, [0, 1, 5, 6], ctx())).toEqual({ ok: false, reason: 'not-a-word' });
    expect(validateSubmission(BOARD, [3, 2, 6, 7], ctx())).toEqual({ ok: false, reason: 'not-a-word' });
  });

  test('rejects a word already found', () => {
    const c = ctx({ found: new Set(['toca', 'ato']) });
    expect(validateSubmission(BOARD, PATHS.toca, c)).toEqual({ ok: false, reason: 'already-found' });
    expect(validateSubmission(BOARD, PATHS.ato, c)).toEqual({ ok: false, reason: 'already-found' });
    expect(validateSubmission(BOARD, PATHS.curva, c)).toEqual({ ok: true, word: 'curva' });
  });

  test('rejects an empty or single-tile path', () => {
    const invalid = { ok: false, reason: 'invalid-path' };
    expect(validateSubmission(BOARD, [], ctx())).toEqual(invalid);
    expect(validateSubmission(BOARD, [5], ctx())).toEqual(invalid);
    const qu = [
      ['qu', 'e', 'x', 'x'],
      ['x', 'x', 'x', 'x'],
      ['x', 'x', 'x', 'x'],
      ['x', 'x', 'x', 'x'],
    ];
    expect(validateSubmission(qu, [0], ctx({ solutions: new Set(['qu']), minLength: 2 }))).toEqual(invalid);
  });

  test('rejects profanity while the filter is on', () => {
    expect(validateSubmission(BOARD, PATHS.gato, ctx({ filterProfanity: true }))).toEqual({ ok: false, reason: 'not-a-word' });
    expect(validateSubmission(BOARD, PATHS.sul, ctx({ filterProfanity: true }))).toEqual({ ok: false, reason: 'not-a-word' });
    // Even when the caller's solutions were computed without the filter.
    const unfiltered = boardSolutions(BOARD, PACK, { minLength: 3, filterProfanity: false }).words;
    expect(validateSubmission(BOARD, PATHS.sul, ctx({ filterProfanity: true, solutions: unfiltered }))).toEqual({
      ok: false,
      reason: 'not-a-word',
    });
  });

  test('accepts profanity while the filter is off', () => {
    expect(validateSubmission(BOARD, PATHS.gato, ctx({ filterProfanity: false }))).toEqual({ ok: true, word: 'gato' });
    expect(validateSubmission(BOARD, PATHS.sul, ctx({ filterProfanity: false }))).toEqual({ ok: true, word: 'sul' });
  });

  test('treats a profane common word as invalid while filtering', () => {
    const on = boardSolutions(BOARD, PACK, { minLength: 3, filterProfanity: true });
    expect([...on.common].sort()).toEqual(['ato', 'curva', 'toca']);
    expect(on.words.has('gato')).toBe(false);
    expect(validateSubmission(BOARD, PATHS.gato, ctx({ filterProfanity: true }))).toEqual({ ok: false, reason: 'not-a-word' });

    const off = boardSolutions(BOARD, PACK, { minLength: 3, filterProfanity: false });
    expect([...off.common].sort()).toEqual(['ato', 'curva', 'gato', 'toca']);
    expect(off.words.has('gato')).toBe(true);
  });
});
