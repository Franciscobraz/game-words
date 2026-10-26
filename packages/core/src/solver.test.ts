import { describe, expect, test } from 'vitest';
import { Dawg, buildDawg } from './dawg.ts';
import { solve } from './solver.ts';

const WEIGHTS = new Array<number>(26).fill(1 / 26);

function dict(words: string[]): Dawg {
  return Dawg.fromBuffer(buildDawg([...new Set(words)].sort(), WEIGHTS));
}

/** One string per row, tiles separated by spaces. */
function grid(...rows: string[]): string[][] {
  return rows.map((r) => r.split(' '));
}

const sorted = (s: Set<string>) => [...s].sort();

// g a t o
// e s c a
// l u r v
// x i m e
const BOARD = grid('g a t o', 'e s c a', 'l u r v', 'x i m e');
const FORMABLE = ['ato', 'cata', 'cru', 'curva', 'gas', 'gato', 'lume', 'mira', 'oca', 'rim', 'seu', 'sul', 'taca', 'toca', 'vem'];
// Each needs a non-adjacent step, a reused tile or a letter that is not on the board.
const NOT_FORMABLE = ['atos', 'casa', 'cavar', 'cova', 'curvo', 'ema', 'gatos', 'gelo', 'rima', 'rua', 'sua', 'tosca', 'verme', 'xis', 'zebra'];

describe('solve', () => {
  test('finds exactly the expected words', () => {
    const found = solve(BOARD, dict([...FORMABLE, ...NOT_FORMABLE]), 3);
    expect(sorted(found)).toEqual([...FORMABLE].sort());
  });

  test('never reuses a tile', () => {
    const words = dict(['ama', 'mama']);
    expect(sorted(solve(grid('a m x x', 'x x x x', 'x x x x', 'x x x x'), words, 3))).toEqual([]);
    expect(sorted(solve(grid('a m a x', 'x x x x', 'x x x x', 'x x x x'), words, 3))).toEqual(['ama']);
    // "casa" would need the single "a" next to "s" twice.
    expect(solve(BOARD, dict(['casa', 'verme']), 3).size).toBe(0);
  });

  test('treats Qu as qu', () => {
    const board = grid('Qu e i j', 'x x x o', 'x x x x', 'x x x x');
    const found = solve(board, dict(['que', 'queijo', 'queijos', 'quijo', 'ueijo']), 3);
    expect(sorted(found)).toEqual(['que', 'queijo']);
  });

  test('drops words below the minimum length', () => {
    const found = solve(BOARD, dict([...FORMABLE, ...NOT_FORMABLE]), 4);
    expect(sorted(found)).toEqual(FORMABLE.filter((w) => w.length >= 4).sort());
    expect(sorted(found)).toEqual(['cata', 'curva', 'gato', 'lume', 'mira', 'taca', 'toca']);
  });

  test('rejects invalid boards', () => {
    const words = dict(['gato']);
    expect(() => solve(grid('a b c', 'd e f', 'g h i'), words, 3)).toThrow(/size/i);
    expect(() => solve(grid('a b c d e', 'a b c d e', 'a b c d e', 'a b c d e'), words, 3)).toThrow(/size/i);
    expect(() => solve(grid('a b c d', 'a b c d', 'a b c', 'a b c d'), words, 3)).toThrow(/size/i);
    for (const tile of ['1', 'ç', 'é', 'q', 'ab', '']) {
      const board = grid('a b c d', 'a b c d', 'a b c d', 'a b c d');
      board[2]![1] = tile;
      expect(() => solve(board, words, 3), JSON.stringify(tile)).toThrow(/tile/i);
    }
  });

  test('uses distinct tiles with the same letter', () => {
    const words = dict(['erro', 'erros', 'eros']);
    const two = grid('e r x x', 'x r o x', 'x x s x', 'x x x x');
    expect(sorted(solve(two, words, 3))).toEqual(['eros', 'erro', 'erros']);
    const one = grid('e r x x', 'x x o x', 'x x s x', 'x x x x');
    expect(sorted(solve(one, words, 3))).toEqual(['eros']);
  });
});
