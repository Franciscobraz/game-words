import type { SubmitResult } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { addFound, foundTotals, reconcileFound } from './found.ts';
import type { FoundWord } from './room-view.ts';

const ACCEPTED = (word: string): SubmitResult => ({ ok: true, word });
const NOT_A_WORD: SubmitResult = { ok: false, reason: 'not-a-word' };

describe('addFound', () => {
  test('puts the newest word first, waiting for the server', () => {
    // PLAY-01 AC 7: a valid word enters at the start of the list.
    const one = addFound([], 'casa', 2);
    const two = addFound(one, 'quero', 3);

    expect(two).toEqual([
      { word: 'quero', points: 3, confirmed: false },
      { word: 'casa', points: 2, confirmed: false },
    ]);
    expect(one).toEqual([{ word: 'casa', points: 2, confirmed: false }]);
  });
});

describe('foundTotals', () => {
  test('counts the words and adds their points', () => {
    // PLAY-01 AC 14: "N pal · N pts".
    const found = addFound(addFound(addFound([], 'mar', 1), 'casa', 2), 'sereia', 4);

    expect(foundTotals(found)).toEqual({ words: 3, points: 7 });
    expect(foundTotals([])).toEqual({ words: 0, points: 0 });
  });
});

describe('reconcileFound', () => {
  test('removes a refused word and its points', () => {
    // PLAY-01 AC 13: the phone showed "casa" and "mar" as valid; the server refuses "casa".
    const found = addFound(addFound(addFound([], 'sereia', 4), 'casa', 2), 'mar', 1);
    expect(foundTotals(found)).toEqual({ words: 3, points: 7 });

    const next = reconcileFound(found, ['casa', 'mar'], [NOT_A_WORD, ACCEPTED('mar')]);

    expect(next.map((f) => f.word)).toEqual(['mar', 'sereia']);
    expect(foundTotals(next)).toEqual({ words: 2, points: 5 });
  });

  test('removes every refused word of the batch, whatever the reason', () => {
    const found = addFound(addFound([], 'casa', 2), 'mar', 1);
    const refusals: SubmitResult[] = [
      { ok: false, reason: 'round-closed' },
      { ok: false, reason: 'rate-limited' },
    ];

    expect(reconcileFound(found, ['casa', 'mar'], refusals)).toEqual([]);
  });

  test('keeps a word the server had already accepted', () => {
    // A word confirmed earlier (e.g. recovered in the `welcome`) stays even if a later batch repeats it.
    const confirmed: FoundWord[] = [{ word: 'casa', points: 2, confirmed: true }];

    expect(reconcileFound(confirmed, ['casa'], [{ ok: false, reason: 'already-found' }])).toEqual(confirmed);
  });

  test('leaves the list as it is when every path was accepted', () => {
    const found = addFound(addFound([], 'casa', 2), 'mar', 1);

    expect(reconcileFound(found, ['casa', 'mar'], [ACCEPTED('casa'), ACCEPTED('mar')])).toEqual(found);
  });
});
