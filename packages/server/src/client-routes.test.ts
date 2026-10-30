import { describe, expect, test } from 'vitest';
import { clientAsset } from './client-routes.ts';

describe('clientAsset', () => {
  test.each(['/tv', '/tv/'])('sends %s to the tv page', (pathname) => {
    expect(clientAsset(pathname)).toBe('/tv/');
  });

  test.each(['/', '/KBXT', '/kbxt'])('sends %s to the phone page', (pathname) => {
    expect(clientAsset(pathname)).toBe('/phone/');
  });

  test.each(['/tv/assets/index-a1B2.js', '/tv/assets/nunito-sans.woff2', '/phone/assets/index_a1.css'])(
    'lets the client file %s through',
    (pathname) => {
      expect(clientAsset(pathname)).toBe(pathname);
    },
  );

  test.each([
    ['the language pack', '/pt-BR/dict.bin'],
    ['the pack folder', '/pt-BR/'],
    ['the tv page by its file name', '/tv/index.html'],
    ['the phone page by its file name', '/phone/index.html'],
    ['the phone folder', '/phone/'],
    ['the assets folder', '/tv/assets/'],
    ['a subfolder of the assets', '/tv/assets/deep/file.js'],
    ['an encoded way out of the assets', '/tv/assets/..%2f..%2fpt-BR%2fdict.bin'],
    ['a dot segment', '/phone/assets/..'],
    ['a code with letters the codes do not use', '/IOIO'],
    ['a code too short', '/KBX'],
    ['a code too long', '/KBXTA'],
    ['a code with a trailing slash', '/KBXT/'],
    ['a code in a folder', '/tv/KBXT'],
    ['the upper case tv path', '/TV'],
    ['another client', '/debug/assets/index.js'],
  ])('answers null to %s', (_, pathname) => {
    expect(clientAsset(pathname)).toBeNull();
  });
});
