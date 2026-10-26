import { describe, expect, test } from 'vitest';
import { buildDawg } from './dawg.ts';
import { LanguagePack } from './pack.ts';
import { scoreRound, wordPoints } from './scoring.ts';
import { buildSpellings } from './spellings.ts';
import { boardSolutions, validateSubmission } from './validate.ts';

const WEIGHTS = new Array<number>(26).fill(1 / 26);
const dawg = (words: string[]) => buildDawg([...new Set(words)].sort(), WEIGHTS);

function pack(words: string[]): LanguagePack {
  return LanguagePack.fromBuffers({
    dict: dawg(words),
    common: dawg([]),
    profanity: dawg([]),
    spellings: buildSpellings(new Map()),
    meta: { id: 'test', minCommonWords: {} },
  });
}

describe('scoring', () => {
  test('scores by normalized length', () => {
    expect(wordPoints('sol')).toBe(1);
    expect(wordPoints('casa')).toBe(2);
    expect(wordPoints('curva')).toBe(3);
    expect(wordPoints('coracao')).toBe(5);
    expect(wordPoints('cantou')).toBe(4);
    expect(wordPoints('inconstitucional')).toBe(14);
    expect('inconstitucional').toHaveLength(16);
  });

  test('doubles unique words', () => {
    const score = scoreRound(
      new Map([
        ['ana', new Set(['casa', 'curva'])],
        ['bia', new Set(['sol'])],
      ]),
    );
    expect(score.totals.get('ana')).toBe(2 * 2 + 3 * 2);
    expect(score.totals.get('bia')).toBe(1 * 2);
    expect(score.unique.get('ana')).toEqual(['casa', 'curva']);
    expect(score.unique.get('bia')).toEqual(['sol']);
    expect(score.shared).toEqual([]);
  });

  test('scores shared words once each and lists them', () => {
    const score = scoreRound(
      new Map([
        ['ana', new Set(['casa', 'curva'])],
        ['bia', new Set(['casa', 'toca'])],
        ['caio', new Set(['curva', 'casa', 'sol'])],
      ]),
    );
    // casa (3 players): 2 each; curva (ana, caio): 3 each; toca and sol are unique.
    expect(score.totals.get('ana')).toBe(2 + 3);
    expect(score.totals.get('bia')).toBe(2 + 2 * 2);
    expect(score.totals.get('caio')).toBe(3 + 2 + 1 * 2);
    expect(score.shared).toEqual(['casa', 'curva']);
    expect(score.unique.get('ana')).toEqual([]);
    expect(score.unique.get('bia')).toEqual(['toca']);
    expect(score.unique.get('caio')).toEqual(['sol']);
  });

  test('never deducts for rejected submissions', () => {
    // g a t o / e s c a / l u r v / x i m e
    const board = [
      ['g', 'a', 't', 'o'],
      ['e', 's', 'c', 'a'],
      ['l', 'u', 'r', 'v'],
      ['x', 'i', 'm', 'e'],
    ];
    const p = pack(['ato', 'gato', 'toca']);
    const solutions = boardSolutions(board, p, { minLength: 3, filterProfanity: true }).words;
    const found = new Map<string, Set<string>>([
      ['ana', new Set()],
      ['bia', new Set()],
    ]);
    const submissions: [string, number[]][] = [
      ['ana', [1, 2, 3]], // ato
      ['ana', [0, 2]], // invalid-path
      ['ana', [0, 1, 2]], // not-a-word
      ['ana', [1, 2, 3]], // already-found
      ['ana', [2, 3, 6, 7]], // toca
      ['bia', [0, 1, 2]], // not-a-word
      ['bia', []], // invalid-path
    ];
    const reasons: string[] = [];
    for (const [player, path] of submissions) {
      const own = found.get(player)!;
      const result = validateSubmission(board, path, { solutions, found: own, minLength: 3, filterProfanity: true, pack: p });
      if (result.ok) own.add(result.word);
      else reasons.push(result.reason);
    }
    expect(reasons).toEqual(['invalid-path', 'not-a-word', 'already-found', 'not-a-word', 'invalid-path']);
    const score = scoreRound(found);
    expect(score.totals.get('ana')).toBe(1 * 2 + 2 * 2);
    expect(score.totals.get('bia')).toBe(0);
  });

  test('counts both letters of Qu', () => {
    const board = [
      ['qu', 'e', 'i', 'j'],
      ['x', 'x', 'x', 'o'],
      ['x', 'x', 'x', 'x'],
      ['x', 'x', 'x', 'x'],
    ];
    const p = pack(['queijo']);
    const solutions = boardSolutions(board, p, { minLength: 3, filterProfanity: true }).words;
    const result = validateSubmission(board, [0, 1, 2, 3, 7], {
      solutions,
      found: new Set(),
      minLength: 6,
      filterProfanity: true,
      pack: p,
    });
    expect(result).toEqual({ ok: true, word: 'queijo' });
    expect(wordPoints('queijo')).toBe(4);
  });
});
