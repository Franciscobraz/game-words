import { describe, expect, test } from 'vitest';
import { STRINGS } from './pt-BR.ts';

describe('rounds chip', () => {
  test('says rounds in the singular for one round', () => {
    expect(STRINGS.roundsChip(1)).toBe('1 Rodada');
    expect(STRINGS.roundsChip(3)).toBe('3 Rodadas');
  });
});
