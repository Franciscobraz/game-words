import type { RoundInfo, Settings } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { roundPosition } from './round-position.ts';

const SETTINGS: Settings = {
  size: 4,
  seconds: 120,
  rounds: 3,
  minLength: 3,
  filterProfanity: true,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

function roundAt(index: number): RoundInfo {
  return { id: 9, index, board: [['a']], startsAt: 0, endsAt: 1 };
}

describe('roundPosition', () => {
  test('counts rounds from 1 out of the match rounds', () => {
    // COUNT-01 AC 1: the first round (index 0) of 3 reads "RODADA 1 DE 3"; the last, 3 of 3.
    expect(roundPosition(roundAt(0), SETTINGS)).toEqual({ round: 1, total: 3 });
    expect(roundPosition(roundAt(2), SETTINGS)).toEqual({ round: 3, total: 3 });
  });

  test('has no position before the round or the settings arrive', () => {
    expect(roundPosition(null, SETTINGS)).toBeNull();
    expect(roundPosition(roundAt(0), null)).toBeNull();
  });
});
