import type { Settings } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { changedChip, settingsChips } from './settings-chips.ts';

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

/** The label of the chip `key` for `settings`. */
function labelOf(settings: Settings, key: string): string | undefined {
  return settingsChips(settings).find((chip) => chip.key === key)?.label;
}

describe('settingsChips', () => {
  test('shows the settings as the capture draws them, without fast mode', () => {
    expect(settingsChips(SETTINGS).map((chip) => chip.label)).toEqual([
      'Grade 4x4',
      'Tempo 2 min',
      '3 rodadas',
      'Mín. 3 letras',
      'Palavrões filtrados',
      'Português (BR)',
    ]);
  });

  test('shows a time of whole minutes in minutes and any other as minutes and seconds', () => {
    expect(labelOf({ ...SETTINGS, seconds: 60 }, 'seconds')).toBe('Tempo 1 min');
    expect(labelOf({ ...SETTINGS, seconds: 30 }, 'seconds')).toBe('Tempo 0:30');
    expect(labelOf({ ...SETTINGS, seconds: 90 }, 'seconds')).toBe('Tempo 1:30');
  });

  test('says round in the singular for one', () => {
    expect(labelOf({ ...SETTINGS, rounds: 1 }, 'rounds')).toBe('1 rodada');
  });

  test('says when the profanity filter is off', () => {
    expect(labelOf({ ...SETTINGS, filterProfanity: false }, 'filterProfanity')).toBe('Palavrões liberados');
  });
});

describe('changedChip', () => {
  test('finds the chip of the changed setting', () => {
    expect(changedChip(SETTINGS, { ...SETTINGS, size: 5 })).toBe('size');
    expect(changedChip(SETTINGS, { ...SETTINGS, seconds: 90 })).toBe('seconds');
    expect(changedChip(SETTINGS, { ...SETTINGS, rounds: 1 })).toBe('rounds');
    expect(changedChip(SETTINGS, { ...SETTINGS, minLength: 4 })).toBe('minLength');
    expect(changedChip(SETTINGS, { ...SETTINGS, filterProfanity: false })).toBe('filterProfanity');
  });

  test('finds no chip when nothing a chip shows changed', () => {
    expect(changedChip(SETTINGS, SETTINGS)).toBeNull();
    expect(changedChip(SETTINGS, { ...SETTINGS, volume: 10, muted: true })).toBeNull();
  });
});
