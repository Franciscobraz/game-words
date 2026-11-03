import { describe, expect, test } from 'vitest';
import { scoreLabel } from './score-label.ts';

describe('scoreLabel', () => {
  test('writes plvr and pt in the singular and plvrs and pts otherwise, 0 included', () => {
    expect(scoreLabel(0, 0)).toEqual({ words: '0 plvrs', points: '0', unit: 'pts' });
    expect(scoreLabel(1, 1)).toEqual({ words: '1 plvr', points: '1', unit: 'pt' });
    expect(scoreLabel(2, 2)).toEqual({ words: '2 plvrs', points: '2', unit: 'pts' });
    expect(scoreLabel(14, 34)).toEqual({ words: '14 plvrs', points: '34', unit: 'pts' });
  });
});
