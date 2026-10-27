import { buildDawg, buildSpellings, LanguagePack, type PackMeta } from '@bwords/core';

/**
 * The language pack of the server tests. The Vitest config writes its files as the
 * Worker's static assets (`ASSETS`), and tests build it in memory to compute solutions.
 *
 * Boards use only the letters j, k, w, x, y and z, and every 3-letter string over
 * them is a word: any 4x4 board has far more than the generator's 40-word minimum,
 * and no round word can show up by chance in protocol text (codes are upper case,
 * names and reasons use other letters), so a scan of the messages finds only leaks.
 */

export const FIXTURE_LETTERS = 'jkwxyz';

/** The pack id the rooms ask for (`settings.pack`). */
export const FIXTURE_PACK_ID = 'pt-BR';

const letters = [...FIXTURE_LETTERS];

/** Every 3-letter string over the fixture letters, sorted. */
export const FIXTURE_WORDS: readonly string[] = letters
  .flatMap((a) => letters.flatMap((b) => letters.map((c) => a + b + c)))
  .sort();

/** A 4-letter profanity, so the straight-line rule of the generator has something to avoid. */
export const FIXTURE_PROFANITY: readonly string[] = ['zzzz'];

/** Display spellings of two words, so results carry real spellings (RES-01 AC 2). */
export const FIXTURE_SPELLINGS: readonly (readonly [string, readonly string[]])[] = [
  ['jkw', ['jkw', 'jḱw']],
  ['xyz', ['xyz', 'xýz']],
];

const WEIGHTS = Array.from({ length: 26 }, (_, i) => (FIXTURE_LETTERS.includes(String.fromCharCode(97 + i)) ? 1 / 6 : 0));

const META: PackMeta = { id: FIXTURE_PACK_ID, minCommonWords: {} };

/** The files of `dist/<id>/` as the dictionary build writes them, by file name. */
export function fixturePackFiles(): Record<string, Uint8Array> {
  const dawg = (words: readonly string[]) => new Uint8Array(buildDawg([...words].sort(), WEIGHTS));
  return {
    'dict.bin': dawg([...FIXTURE_WORDS, ...FIXTURE_PROFANITY]),
    'common.bin': dawg([]),
    'profanity.bin': dawg(FIXTURE_PROFANITY),
    'spellings.bin': new Uint8Array(buildSpellings(FIXTURE_SPELLINGS)),
    'meta.json': new TextEncoder().encode(JSON.stringify(META)),
  };
}

const buffer = (bytes: Uint8Array): ArrayBuffer => bytes.slice().buffer;

/** The fixture pack, built in memory. */
export function fixturePack(): LanguagePack {
  const files = fixturePackFiles();
  return LanguagePack.fromBuffers({
    dict: buffer(files['dict.bin']!),
    common: buffer(files['common.bin']!),
    profanity: buffer(files['profanity.bin']!),
    spellings: buffer(files['spellings.bin']!),
    meta: META,
  });
}
