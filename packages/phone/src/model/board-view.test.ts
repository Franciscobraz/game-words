import { describe, expect, test } from 'vitest';
import { STRINGS } from '../strings/pt-BR.ts';
import { boardLabels, feedbackText, foundChips, pathLine, rackContent, tileLabel, wordLetters } from './board-view.ts';

/** The board of the captures: C A S A / Qu E R O / T I N S / L U A M. */
const BOARD = [
  ['c', 'a', 's', 'a'],
  ['qu', 'e', 'r', 'o'],
  ['t', 'i', 'n', 's'],
  ['l', 'u', 'a', 'm'],
];

describe('tile labels', () => {
  test('shows each tile in upper case and Qu in one tile', () => {
    // PLAY-01 AC 5.
    expect(tileLabel('c')).toBe('C');
    expect(tileLabel('qu')).toBe('Qu');
    expect(boardLabels(BOARD)).toEqual(['C', 'A', 'S', 'A', 'Qu', 'E', 'R', 'O', 'T', 'I', 'N', 'S', 'L', 'U', 'A', 'M']);
  });

  test('splits a word into tiles with qu in one tile', () => {
    expect(wordLetters('quero')).toEqual(['Qu', 'E', 'R', 'O']);
    expect(wordLetters('casa')).toEqual(['C', 'A', 'S', 'A']);
    expect(wordLetters('aqui')).toEqual(['A', 'Qu', 'I']);
  });
});

describe('rackContent', () => {
  test('shows the tiles under the finger while swiping', () => {
    // PLAY-01 AC 5: the path 4-5-6-7 spells Qu E R O, even with a feedback still on screen.
    const feedback = { kind: 'valid', word: 'casa', points: 2 } as const;
    expect(rackContent(BOARD, [4, 5, 6, 7], feedback)).toEqual({ letters: ['Qu', 'E', 'R', 'O'], tone: 'swiping' });
  });

  test('shows the word of the feedback after the release, in its tone', () => {
    // PLAY-01 AC 6-10: the finger is up, so the rack holds the judged word.
    expect(rackContent(BOARD, [], { kind: 'valid', word: 'casa', points: 2 })).toEqual({ letters: ['C', 'A', 'S', 'A'], tone: 'valid' });
    expect(rackContent(BOARD, [], { kind: 'already-found', word: 'casa' })).toEqual({
      letters: ['C', 'A', 'S', 'A'],
      tone: 'already-found',
    });
    expect(rackContent(BOARD, [], { kind: 'invalid', word: 'csa' })).toEqual({ letters: ['C', 'S', 'A'], tone: 'invalid' });
    expect(rackContent(BOARD, [], { kind: 'too-short', word: 'ca' })).toEqual({ letters: ['C', 'A'], tone: 'too-short' });
  });

  test('is empty with no swipe and no feedback', () => {
    expect(rackContent(BOARD, [], null)).toEqual({ letters: [], tone: 'swiping' });
  });
});

describe('feedbackText', () => {
  test('names each verdict with the points of a valid word', () => {
    // PLAY-01 AC 7-10, one case per kind (L-007).
    expect(feedbackText({ kind: 'valid', word: 'casa', points: 2 })).toBe('VÁLIDA (+2 PTS)');
    expect(feedbackText({ kind: 'already-found', word: 'casa' })).toBe(STRINGS.alreadyFound);
    expect(feedbackText({ kind: 'invalid', word: 'csa' })).toBe(STRINGS.invalidWord);
    expect(feedbackText({ kind: 'too-short', word: 'ca' })).toBe(STRINGS.tooShort);
  });
});

describe('foundChips', () => {
  test('keeps the newest word first, in upper case with its points', () => {
    // PLAY-01 AC 17: the list holds the newest first; the chips keep that order.
    const found = [
      { word: 'casa', points: 2, confirmed: false },
      { word: 'quero', points: 3, confirmed: true },
      { word: 'lua', points: 1, confirmed: true },
    ];
    expect(foundChips(found)).toEqual([
      { word: 'CASA', points: '+2' },
      { word: 'QUERO', points: '+3' },
      { word: 'LUA', points: '+1' },
    ]);
  });
});

describe('pathLine', () => {
  test('joins the centers of the path tiles as shares of the board side', () => {
    // PLAY-01 AC 2: tile 0 is at the top left, tile 5 one step down and right, of a 4x4 board.
    expect(pathLine([0, 5, 15], 4)).toEqual([
      { x: 0.125, y: 0.125 },
      { x: 0.375, y: 0.375 },
      { x: 0.875, y: 0.875 },
    ]);
    expect(pathLine([], 4)).toEqual([]);
  });
});
