export type DiscardReason = 'uppercase' | 'non-letter' | 'length';

export type FormClass = { ok: true; word: string } | { ok: false; reason: DiscardReason };

export const MIN_WORD_LENGTH = 3;
export const MAX_WORD_LENGTH = 16;

/** Classifies a dictionary form: the normalized a-z word, or why it was discarded. */
export function classifyForm(raw: string): FormClass {
  // A decomposed (NFD) form carries combining marks, which are not letters: compose it first.
  const form = raw.normalize('NFC');
  if (/\p{Lu}/u.test(form)) return { ok: false, reason: 'uppercase' };
  if (!/^\p{L}+$/u.test(form)) return { ok: false, reason: 'non-letter' };
  const word = form.normalize('NFD').replace(/\p{M}/gu, '');
  // Letters with no a-z decomposition (e.g. "ø") are outside the alphabet.
  if (!/^[a-z]+$/.test(word)) return { ok: false, reason: 'non-letter' };
  if (word.length < MIN_WORD_LENGTH || word.length > MAX_WORD_LENGTH) {
    return { ok: false, reason: 'length' };
  }
  return { ok: true, word };
}
