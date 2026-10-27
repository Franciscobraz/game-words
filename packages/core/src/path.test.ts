import { describe, expect, test } from 'vitest';
import { buildDawg } from './dawg.ts';
import { mulberry32 } from './generator.ts';
import { LanguagePack } from './pack.ts';
import { findPath } from './path.ts';
import { type Board, solve } from './solver.ts';
import { buildSpellings } from './spellings.ts';
import { validateSubmission } from './validate.ts';

const WEIGHTS = new Array<number>(26).fill(1 / 26);

function packOf(words: Iterable<string>): LanguagePack {
  const sorted = [...new Set(words)].sort();
  return LanguagePack.fromBuffers({
    dict: buildDawg(sorted, WEIGHTS),
    common: buildDawg([], WEIGHTS),
    profanity: buildDawg([], WEIGHTS),
    spellings: buildSpellings(new Map()),
    meta: { id: 'test', minCommonWords: {} },
  });
}

/** Asserts that `path` spells `word` on `board` as a submission. */
function expectValid(board: Board, word: string, path: number[] | null) {
  expect(path).not.toBeNull();
  const result = validateSubmission(board, path!, {
    solutions: new Set([word]),
    found: new Set(),
    minLength: 1,
    filterProfanity: false,
    pack: packOf([word]),
  });
  expect(result).toEqual({ ok: true, word });
}

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

// Qu e m a   0  1  2  3
// i  r  o t   4  5  6  7
// n  a  s e   8  9 10 11
// d  u  l c  12 13 14 15
const QU_BOARD = [
  ['Qu', 'e', 'm', 'a'],
  ['i', 'r', 'o', 't'],
  ['n', 'a', 's', 'e'],
  ['d', 'u', 'l', 'c'],
];

describe('findPath', () => {
  test('finds a straight word', () => {
    expect(findPath(BOARD, 'gato')).toEqual([0, 1, 2, 3]);
    expectValid(BOARD, 'gato', findPath(BOARD, 'gato'));
  });

  test('finds a word that needs a diagonal', () => {
    // r (10) -> i (13) is diagonal, i (13) -> m (14) is horizontal.
    expect(findPath(BOARD, 'rim')).toEqual([10, 13, 14]);
    expectValid(BOARD, 'rim', findPath(BOARD, 'rim'));
  });

  test('reads Qu as one tile of two letters', () => {
    expect(findPath(QU_BOARD, 'quem')).toEqual([0, 1, 2]);
    expectValid(QU_BOARD, 'quem', findPath(QU_BOARD, 'quem'));
    expect(findPath(QU_BOARD, 'quiri')).toBeNull();
    expectValid(QU_BOARD, 'queira', findPath(QU_BOARD, 'queira'));
    // A lone q never matches the Qu tile.
    expect(findPath(QU_BOARD, 'qem')).toBeNull();
  });

  test('returns null for a word not on the board', () => {
    expect(findPath(BOARD, 'zebra')).toBeNull();
    // Both letters exist but are not adjacent.
    expect(findPath(BOARD, 'gm')).toBeNull();
    // Needs the only t twice.
    expect(findPath(BOARD, 'tat')).toBeNull();
    expect(findPath(BOARD, '')).toBeNull();
    // One tile is not a path.
    expect(findPath(BOARD, 'g')).toBeNull();
  });

  test('backtracks out of a dead end', () => {
    // a b d e    0  1  2  3
    // f g h i    4  5  6  7
    // j k a c    8  9 10 11
    // l m n p   12 13 14 15
    const board = [
      ['a', 'b', 'd', 'e'],
      ['f', 'g', 'h', 'i'],
      ['j', 'k', 'a', 'c'],
      ['l', 'm', 'n', 'p'],
    ];
    // The a at 0 has no c next to it; the walk must move on to the a at 10.
    expect(findPath(board, 'ac')).toEqual([10, 11]);
    expect(findPath(board, 'gac')).toEqual([5, 10, 11]);
    expectValid(board, 'gac', findPath(board, 'gac'));
    expectValid(BOARD, 'seu', findPath(BOARD, 'seu'));
  });

  test('every solution of random boards gets a valid path', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rand = mulberry32(seed);
      const n = 4 + (seed % 3);
      const board = Array.from({ length: n }, () =>
        Array.from({ length: n }, () => {
          const c = String.fromCharCode(97 + Math.floor(rand() * 26));
          return c === 'q' ? 'Qu' : c;
        }),
      );
      // Words spelled by random walks, so the board has solutions to find.
      const flat = board.flat();
      const words = new Set<string>();
      for (let w = 0; w < 40; w++) {
        let cell = Math.floor(rand() * flat.length);
        const used = new Set([cell]);
        let word = flat[cell]!.toLowerCase();
        const len = 3 + Math.floor(rand() * 5);
        for (let k = 1; k < len; k++) {
          const r = Math.floor(cell / n);
          const c = cell % n;
          const next: number[] = [];
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const rr = r + dr;
              const cc = c + dc;
              const i = rr * n + cc;
              if ((dr || dc) && rr >= 0 && rr < n && cc >= 0 && cc < n && !used.has(i)) next.push(i);
            }
          }
          if (next.length === 0) break;
          cell = next[Math.floor(rand() * next.length)]!;
          used.add(cell);
          word += flat[cell]!.toLowerCase();
        }
        words.add(word);
      }
      const pack = packOf(words);
      const solutions = solve(board, pack.dict, 3);
      expect(solutions.size).toBeGreaterThan(0);
      for (const word of solutions) {
        const path = findPath(board, word);
        expect(path).not.toBeNull();
        const result = validateSubmission(board, path!, {
          solutions,
          found: new Set(),
          minLength: 3,
          filterProfanity: false,
          pack,
        });
        expect(result).toEqual({ ok: true, word });
      }
    }
  });
});
