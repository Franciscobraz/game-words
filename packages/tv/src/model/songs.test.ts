import { describe, expect, test } from 'vitest';
import { FINALE_SONG, JINGLE_SONG, LOBBY_SONG, MATCH_SONG, notesInWindow, score, type Song } from './songs.ts';

const SONGS: readonly [string, Song][] = [
  ['lobby', LOBBY_SONG],
  ['match', MATCH_SONG],
  ['jingle', JINGLE_SONG],
  ['finale', FINALE_SONG],
];

/** The notes that start first in the score. */
function firstNotes(song: Song) {
  const firstStartS = Math.min(...song.notes.map((note) => note.startS));
  return song.notes.filter((note) => note.startS === firstStartS);
}

describe('score', () => {
  test('writes a step per name, holds with a dash and rests with a dot', () => {
    // 60 bpm: a beat is a second; one bar of quarter notes.
    const song = score(60, 1, [{ wave: 'triangle', gain: 0.5, beatsPerStep: 1, steps: 'A4 - . C5' }]);

    expect(song.lengthS).toBe(4);
    expect(song.notes).toHaveLength(2);
    expect(song.notes[0]).toMatchObject({ startS: 0, durationS: 2, wave: 'triangle', gain: 0.5 });
    expect(song.notes[0]!.frequencyHz).toBeCloseTo(440);
    expect(song.notes[1]).toMatchObject({ startS: 3, durationS: 1 });
    expect(song.notes[1]!.frequencyHz).toBeCloseTo(523.25);
  });

  test('repeats a voice shorter than the song', () => {
    const song = score(60, 2, [{ wave: 'triangle', gain: 1, beatsPerStep: 2, steps: 'C3 G2' }]);

    expect(song.notes.map((note) => note.startS)).toEqual([0, 2, 4, 6]);
  });
});

describe('the four songs', () => {
  test.each(SONGS)('starts every note of the %s song within its length', (_name, song) => {
    expect(song.notes.length).toBeGreaterThan(0);
    for (const note of song.notes) {
      expect(note.startS).toBeGreaterThanOrEqual(0);
      expect(note.startS).toBeLessThan(song.lengthS);
      expect(note.durationS).toBeGreaterThan(0);
    }
  });

  test('loops the jingle every 30 seconds', () => {
    // 128 bpm, 16 bars of 4 beats: 64 beats of 60/128 s (MUSIC-01 AC 12).
    expect(JINGLE_SONG.lengthS).toBe(30);

    const lastBeforeLoop = notesInWindow(JINGLE_SONG, 0, 29.9).at(-1)!;
    const lastOfScore = Math.max(...JINGLE_SONG.notes.map((note) => note.startS));
    expect(lastBeforeLoop.startS).toBe(lastOfScore);
    expect(notesInWindow(JINGLE_SONG, 29.9, 30)).toEqual([]);

    const atLoop = notesInWindow(JINGLE_SONG, 30, 30.001);
    expect(atLoop).toEqual(firstNotes(JINGLE_SONG).map((note) => ({ ...note, startS: 30 })));
  });

  test.each(SONGS)('wraps a window across the end of each song to its start: %s', (_name, song) => {
    const first = firstNotes(song);
    const window = notesInWindow(song, song.lengthS - 0.5, song.lengthS + first[0]!.startS + 0.001);

    const wrapped = window.filter((note) => note.startS >= song.lengthS);
    expect(wrapped).toEqual(first.map((note) => ({ ...note, startS: song.lengthS + note.startS })));
    expect(window.every((note) => note.startS >= song.lengthS - 0.5)).toBe(true);
  });

  test('finds the notes of a later loop at their unrolled time', () => {
    const inThirdLoop = notesInWindow(LOBBY_SONG, 2 * LOBBY_SONG.lengthS, 2 * LOBBY_SONG.lengthS + 0.001);

    expect(inThirdLoop).toEqual(firstNotes(LOBBY_SONG).map((note) => ({ ...note, startS: 2 * LOBBY_SONG.lengthS })));
  });
});
