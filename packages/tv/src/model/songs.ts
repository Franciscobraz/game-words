import type { Note, Wave } from '@bwords/core';
import type { MusicTrack } from './music.ts';

/** A song that loops: its notes, in seconds of the score, and where it starts again (MUSIC-01 AC 11). */
export interface Song {
  lengthS: number;
  notes: readonly Note[];
}

/**
 * One line of a score. `steps` is a list of names split by spaces, one per step of `beatsPerStep` beats: a pitch such
 * as `C4` or `F#3` starts a note, `-` holds the note before, and `.` is a rest. A line shorter than the song repeats.
 */
export interface Voice {
  wave: Wave;
  /** Share of the track's gain, from 0 to 1. */
  gain: number;
  beatsPerStep: number;
  steps: string;
}

const BEATS_PER_BAR = 4;
const SECONDS_PER_MINUTE = 60;

/** The pitch every other is tuned from: A4 at 440 Hz, MIDI note 69. */
const A4_HZ = 440;
const A4_MIDI = 69;
const SEMITONES_PER_OCTAVE = 12;

/** The semitone of each letter above C. */
const LETTER_SEMITONES: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const HOLD = '-';
const REST = '.';

/**
 * Writes the notes of `voices` over `bars` bars of four beats at `bpm`. The songs are written by the project, in the
 * major pentatonic of old games: a triangle melody over a soft bass (MUSIC-01 AC 11).
 */
export function score(bpm: number, bars: number, voices: readonly Voice[]): Song {
  const beatS = SECONDS_PER_MINUTE / bpm;
  const totalBeats = bars * BEATS_PER_BAR;
  return { lengthS: totalBeats * beatS, notes: voices.flatMap((voice) => voiceNotes(voice, totalBeats, beatS)) };
}

/**
 * The notes that start in `[fromS, toS)` of a song played in a loop, with their start in the same unrolled seconds as
 * the window: a window across the end brings the notes of the start again (MUSIC-01 AC 6-7, 12).
 */
export function notesInWindow(song: Song, fromS: number, toS: number): Note[] {
  const found: Note[] = [];
  for (let loopStartS = Math.floor(fromS / song.lengthS) * song.lengthS; loopStartS < toS; loopStartS += song.lengthS) {
    for (const note of song.notes) {
      const startS = loopStartS + note.startS;
      if (startS >= fromS && startS < toS) found.push({ ...note, startS });
    }
  }
  return found.sort((a, b) => a.startS - b.startS);
}

function voiceNotes(voice: Voice, totalBeats: number, beatS: number): Note[] {
  const steps = voice.steps.split(/\s+/).filter((step) => step !== '');
  const stepCount = Math.round(totalBeats / voice.beatsPerStep);
  const stepS = voice.beatsPerStep * beatS;
  const notes: Note[] = [];
  // The note a hold lengthens; a rest ends it.
  let sounding: Note | null = null;
  for (let index = 0; index < stepCount; index++) {
    const step = steps[index % steps.length]!;
    if (step === HOLD) {
      if (sounding !== null) sounding.durationS += stepS;
      continue;
    }
    if (step === REST) {
      sounding = null;
      continue;
    }
    sounding = { startS: index * stepS, durationS: stepS, frequencyHz: pitchHz(step), wave: voice.wave, gain: voice.gain };
    notes.push(sounding);
  }
  return notes;
}

/** The frequency of a pitch name such as `C4`, `A#3` or `D5`. */
function pitchHz(name: string): number {
  const match = /^([A-G])(#?)(\d)$/.exec(name);
  if (match === null) throw new Error(`Not a pitch: ${name}`);
  const [, letter, sharp, octave] = match;
  const midi = (Number(octave) + 1) * SEMITONES_PER_OCTAVE + LETTER_SEMITONES[letter!]! + (sharp === '#' ? 1 : 0);
  return A4_HZ * 2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE);
}

/** The quiet triangle under every melody. */
const BASS = { wave: 'triangle', gain: 0.45 } as const;
const MELODY = { wave: 'triangle', gain: 0.8 } as const;

/** Calm, for waiting in the lobby: quarter notes over a slow bass, 84 bpm, 8 bars (MUSIC-01 AC 1). */
export const LOBBY_SONG: Song = score(84, 8, [
  { ...MELODY, beatsPerStep: 1, steps: 'E4 G4 A4 G4  E4 D4 C4 -  D4 E4 G4 E4  D4 - - .  E4 G4 A4 C5  A4 G4 E4 G4  D4 E4 D4 C4  C4 - - .' },
  { ...BASS, beatsPerStep: 2, steps: 'C3 G2  A2 E2  D3 A2  G2 D3  C3 G2  A2 E3  D3 G2  C3 -' },
]);

/** Calm, with no hurry, for the round and the words: 80 bpm, 16 bars, and 120 bpm at 1.5 times (MUSIC-01 AC 2-3). */
export const MATCH_SONG: Song = score(80, 16, [
  {
    ...MELODY,
    beatsPerStep: 1,
    steps:
      'G4 A4 C5 A4  G4 E4 D4 -  E4 G4 A4 G4  E4 - - .  D4 E4 G4 A4  G4 E4 D4 E4  C4 D4 E4 G4  A4 - - . ' +
      'C5 - A4 G4  A4 - G4 E4  G4 - E4 D4  E4 - - .  D4 E4 G4 E4  D4 C4 D4 E4  D4 - C4 D4  C4 - - .',
  },
  { ...BASS, beatsPerStep: 2, steps: 'C3 G2  A2 E2  F2 C3  G2 -' },
]);

/** Lively, for the result between rounds: eighth notes at 128 bpm, 16 bars, exactly 30 s (MUSIC-01 AC 6, 12). */
export const JINGLE_SONG: Song = score(128, 16, [
  {
    ...MELODY,
    beatsPerStep: 0.5,
    steps:
      'C5 . E5 G5 - E5 C5 .  A4 . C5 E5 - C5 A4 .  A4 . C5 D5 - C5 A4 .  G4 A4 G4 E4 D4 . . .  ' +
      'C5 . E5 G5 - A5 G5 .  E5 . C5 A4 - C5 E5 .  D5 . C5 A4 - G4 A4 .  G4 - - . D5 - C5 .',
  },
  { ...BASS, beatsPerStep: 1, steps: 'C3 G3 C3 G3  A2 E3 A2 E3  F2 C3 F2 C3  G2 D3 G2 D3' },
]);

/** Festive, for the podium: faster than the jingle, with a square voice on top, 132 bpm, 16 bars (MUSIC-01 AC 7). */
export const FINALE_SONG: Song = score(132, 16, [
  {
    ...MELODY,
    beatsPerStep: 0.5,
    steps:
      'C5 C5 E5 G5 - G5 E5 G5  A5 - G5 E5 C5 - D5 E5  D5 D5 G5 D5 E5 D5 C5 D5  E5 - C5 - G4 - . .  ' +
      'C5 C5 E5 G5 - A5 G5 E5  A5 - C6 A5 G5 - E5 G5  D5 E5 G5 A5 G5 E5 D5 E5  C5 - G4 - C5 - . .',
  },
  { wave: 'square', gain: 0.2, beatsPerStep: 1, steps: 'E4 . G4 .  F4 . A4 .  D4 . G4 .  E4 . C4 .  E4 . G4 .  F4 . A4 .  G4 . B3 .  C4 . . .' },
  { ...BASS, beatsPerStep: 1, steps: 'C3 G2 C3 G2  F2 C3 F2 C3  G2 D3 G2 D3  C3 G2 C3 G2' },
]);

/** The song of each track. */
export const TRACK_SONGS: Record<MusicTrack, Song> = {
  lobby: LOBBY_SONG,
  match: MATCH_SONG,
  jingle: JINGLE_SONG,
  finale: FINALE_SONG,
};
