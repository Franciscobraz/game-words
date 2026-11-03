import { describe, expect, test } from 'vitest';
import { displayAddress, qrMatrix, qrPath, roomUrl } from './qr.ts';

describe('the room address', () => {
  test('joins the origin and the code', () => {
    expect(roomUrl('https://bwords.example', 'KBXT')).toBe('https://bwords.example/KBXT');
  });

  test('writes the address without the scheme', () => {
    expect(displayAddress('https://bwords.example')).toBe('bwords.example');
    expect(displayAddress('http://localhost:5176')).toBe('localhost:5176');
  });

  test('writes the room address as the host and the code', () => {
    // ROUTE-01 AC 5: the host the TV is open on, never a fixed domain.
    expect(displayAddress(roomUrl('http://localhost:5176', 'KBXT'))).toBe('localhost:5176/KBXT');
  });
});

describe('qrMatrix', () => {
  test('gives a square code with a finder pattern in the corner', () => {
    const matrix = qrMatrix('https://bwords.example/KBXT');

    expect(matrix.every((row) => row.length === matrix.length)).toBe(true);
    expect(matrix[0]!.slice(0, 7).every(Boolean)).toBe(true);
    expect(matrix[1]!.slice(1, 6).some(Boolean)).toBe(false);
  });
});

describe('qrPath', () => {
  test('draws one square per dark module', () => {
    const path = qrPath([
      [true, false],
      [false, true],
    ]);

    expect(path).toBe('M0 0h1v1h-1zM1 1h1v1h-1z');
  });
});
