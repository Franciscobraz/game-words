import { describe, expect, test } from 'vitest';
import { completeCode, EMPTY_CODE_BOXES, parseRoomPath, typeCodeLetter } from './room-code.ts';

describe('parseRoomPath', () => {
  test.each([
    ['/kbxt', 'KBXT'],
    ['/KBXT', 'KBXT'],
    ['/', null],
    ['/KBX', null],
    ['/KBXTA', null],
    ['/KBIO', null],
  ])('reads %s as %s', (pathname, expected) => {
    expect(parseRoomPath(pathname)).toBe(expected);
  });
});

describe('typeCodeLetter', () => {
  test('shows a typed letter in upper case in its box', () => {
    const boxes = typeCodeLetter(EMPTY_CODE_BOXES, 0, 'k');

    expect(boxes).toEqual(['K', '', '', '']);
  });

  test('keeps the other boxes', () => {
    const boxes = typeCodeLetter(['K', 'B', '', ''], 2, 'x');

    expect(boxes).toEqual(['K', 'B', 'X', '']);
  });

  test.each(['i', 'O', '1', '-', 'kb'])('ignores %s, which is not a letter of the room alphabet', (key) => {
    const before = ['K', '', '', ''];

    expect(typeCodeLetter(before, 1, key)).toBe(before);
  });

  test('clears a box with an empty key', () => {
    expect(typeCodeLetter(['K', 'B', '', ''], 1, '')).toEqual(['K', '', '', '']);
  });

  test('ignores a box outside the four', () => {
    expect(typeCodeLetter(EMPTY_CODE_BOXES, 4, 'k')).toBe(EMPTY_CODE_BOXES);
  });
});

describe('completeCode', () => {
  test('gives the code when the four boxes are filled', () => {
    expect(completeCode(['K', 'B', 'X', 'T'])).toBe('KBXT');
  });

  test('gives null while a box is empty', () => {
    expect(completeCode(['K', 'B', 'X', ''])).toBeNull();
  });
});
