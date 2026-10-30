import { expect, test } from 'vitest';
import { boardLabels } from './board-labels.ts';

test('reads the tiles row by row, with qu as one tile', () => {
  const board = [
    ['c', 'a'],
    ['qu', 'e'],
  ];

  expect(boardLabels(board)).toEqual(['C', 'A', 'Qu', 'E']);
});
