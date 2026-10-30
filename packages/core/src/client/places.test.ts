import { expect, test } from 'vitest';
import { placesOf } from './places.ts';

test('gives each score its place from the highest', () => {
  expect(placesOf([30, 20, 10])).toEqual([1, 2, 3]);
});

test('shares the place on a tie and skips the next one', () => {
  expect(placesOf([30, 30, 10])).toEqual([1, 1, 3]);
  expect(placesOf([30, 20, 20, 5])).toEqual([1, 2, 2, 4]);
});

test('has no places without scores', () => {
  expect(placesOf([])).toEqual([]);
});
