import { expect, test } from 'vitest';
import { roundTitle } from './round-title.ts';

test('counts the rounds from one', () => {
  expect(roundTitle(0, 3)).toBe('RODADA 1 DE 3');
  expect(roundTitle(2, 3)).toBe('RODADA 3 DE 3');
});
