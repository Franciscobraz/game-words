import { describe, expect, test } from 'vitest';
import { litTiles } from './lit-tiles.ts';

const TERNOS_PATH = [8, 5, 6, 10, 7, 11];

describe('litTiles', () => {
  test('lights one tile every 400 ms in path order', () => {
    expect(litTiles(TERNOS_PATH, 0)).toEqual([8]);
    expect(litTiles(TERNOS_PATH, 399)).toEqual([8]);
    expect(litTiles(TERNOS_PATH, 400)).toEqual([8, 5]);
    expect(litTiles(TERNOS_PATH, 1_999)).toEqual([8, 5, 6, 10, 7]);
    expect(litTiles(TERNOS_PATH, 2_000)).toEqual(TERNOS_PATH);
    expect(litTiles(TERNOS_PATH, 60_000)).toEqual(TERNOS_PATH);
  });

  test('lights nothing before the screen opens', () => {
    expect(litTiles(TERNOS_PATH, -1)).toEqual([]);
  });

  test('lights nothing when there is no path', () => {
    expect(litTiles([], 1_000)).toEqual([]);
  });
});
