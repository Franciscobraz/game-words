import { NICKNAME_MAX } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { initialOf, nicknameLength } from './nickname.ts';

describe('nicknameLength', () => {
  test('counts characters, an accented letter as one', () => {
    expect(nicknameLength('Beto')).toBe(4);
    expect(nicknameLength('João')).toBe(4);
    expect(nicknameLength('João')).toBe(4);
  });

  test('counts up to the limit and past it', () => {
    expect(nicknameLength('A'.repeat(NICKNAME_MAX))).toBe(12);
    expect(nicknameLength('A'.repeat(NICKNAME_MAX + 1))).toBe(13);
  });
});

describe('initialOf', () => {
  test('takes the first letter in upper case', () => {
    expect(initialOf('beto')).toBe('B');
    expect(initialOf('  ána')).toBe('Á');
  });

  test('is empty before anything is typed', () => {
    expect(initialOf('')).toBe('');
    expect(initialOf('   ')).toBe('');
  });
});
