/**
 * Word data of the E2E fixture pack. `build-fixture.ts` writes `pack/` from it and the
 * tests read it to know which board paths spell words.
 *
 * Boards only use the letters below, so every 3-letter string over them is a word: any
 * board has enough solutions for the generator, and any 3-tile path is a valid word.
 * Longer words are a short hand-picked list, so most 4-tile paths are not words.
 */

export const LETTERS = ['a', 'c', 'e', 'i', 'm', 'o', 'r', 's', 't'] as const;

function threeLetterWords(): string[] {
  const out: string[] = [];
  for (const a of LETTERS) for (const b of LETTERS) for (const c of LETTERS) out.push(a + b + c);
  return out;
}

const LONGER = [
  'amor', 'arco', 'arte', 'casa', 'caso', 'certo', 'cesta', 'coisa', 'esta', 'isto',
  'mais', 'mesa', 'meta', 'mito', 'rato', 'resto', 'rima', 'roma', 'sair', 'seis',
  'tema', 'teto', 'tres', 'trio',
];

/** Every word of the fixture dictionary, sorted. */
export const WORDS: readonly string[] = [...threeLetterWords(), ...LONGER].sort();

/** Common words: the longer words and the 3-letter words that start with a vowel. */
export const COMMON: readonly string[] = WORDS.filter((w) => w.length > 3 || 'aeio'.includes(w[0]!));

/** Fixture profanity: the 3-letter words that start with "t". */
export const PROFANITY: readonly string[] = WORDS.filter((w) => w.length === 3 && w[0] === 't');

/** Display spellings that differ from the normalized form. */
export const SPELLINGS: Readonly<Record<string, readonly string[]>> = {
  ate: ['até'],
  esta: ['esta', 'está'],
  mae: ['mãe'],
  mes: ['mês'],
  tres: ['três'],
};

/** Minimum common words per board size, written to `meta.json`. */
export const MIN_COMMON_WORDS: Readonly<Record<number, number>> = { 4: 10, 5: 20, 6: 30 };
