import { describe, expect, test } from 'vitest';
import { cleanNickname, nicknameKey } from './nickname.ts';

describe('cleanNickname', () => {
  test('accepts 2 and 12 characters, rejects 1 and 13, counted after trimming', () => {
    expect(cleanNickname('ab')).toBe('ab');
    expect(cleanNickname('  ab  ')).toBe('ab');
    expect(cleanNickname('abcdefghijkl')).toBe('abcdefghijkl');
    expect(cleanNickname(' abcdefghijkl\t')).toBe('abcdefghijkl');
    expect(cleanNickname('a')).toBeNull();
    expect(cleanNickname('   a   ')).toBeNull();
    expect(cleanNickname('abcdefghijklm')).toBeNull();
    expect(cleanNickname(' abcdefghijklm ')).toBeNull();
    expect(cleanNickname('')).toBeNull();
    expect(cleanNickname('     ')).toBeNull();
  });

  test('normalizes to NFC and counts code points', () => {
    // "João" with a combining tilde becomes the single precomposed letter.
    expect(cleanNickname('João')).toBe('João');
    // 12 letters with combining accents are 12 characters after NFC.
    expect(cleanNickname('á'.repeat(12))).toBe('á'.repeat(12));
    expect(cleanNickname('á'.repeat(13))).toBeNull();
    // An astral symbol is one character.
    expect(cleanNickname('\u{1F600}\u{1F600}')).toBe('\u{1F600}\u{1F600}');
    expect(cleanNickname('\u{1F600}')).toBeNull();
  });

  test('rejects control characters', () => {
    expect(cleanNickname('ab\u0007c')).toBeNull();
    expect(cleanNickname('ab\ncd')).toBeNull();
    expect(cleanNickname('ab\u0000')).toBeNull();
    expect(cleanNickname('ab\u007fcd')).toBeNull();
    expect(cleanNickname('Ana Maria')).toBe('Ana Maria');
  });
});

describe('nicknameKey', () => {
  test('equal ignoring case and accents', () => {
    expect(nicknameKey('João')).toBe(nicknameKey('joao'));
    expect(nicknameKey('JOÃO')).toBe(nicknameKey('joao'));
    expect(nicknameKey('João')).toBe(nicknameKey('joao'));
    expect(nicknameKey('Ana')).not.toBe(nicknameKey('Ane'));
  });
});
