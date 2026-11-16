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
 * style of a 16-bit racing game: a triangle lead over a pumping bass, with low squares on top (MUSIC-01 AC 11, AD-032).
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

/** A pumping bass, one entry per bar: the root, then the octave above, four times a bar (AD-032). */
export function pump(roots: readonly string[]): string {
  return bars(roots, (root) => repeat(`${root} ${octaveUp(root)}`, PUMPS_PER_BAR));
}

/** Sixteenth notes up and back over each bar's chord of three notes, such as `'A3 C4 E4'` (AD-032). */
export function arpeggio(chords: readonly string[]): string {
  return bars(chords, (chord) => {
    const [root, third, fifth] = chord.split(' ');
    return repeat(`${root} ${third} ${fifth} ${third}`, ARPEGGIOS_PER_BAR);
  });
}

/** One note per bar, short on beats two and four, with rests on one and three (AD-032). */
export function offbeats(notes: readonly string[]): string {
  return bars(notes, (note) => `${REST} ${note} ${REST} ${note}`);
}

/** Root and octave pairs in a bar of eighth notes. */
const PUMPS_PER_BAR = 4;
/** Runs of four sixteenth notes in a bar. */
const ARPEGGIOS_PER_BAR = 4;

function bars(perBar: readonly string[], write: (bar: string) => string): string {
  return perBar.map(write).join('  ');
}

function repeat(steps: string, times: number): string {
  return Array.from({ length: times }, () => steps).join(' ');
}

/** The same pitch an octave higher: `A2` gives `A3`. */
function octaveUp(name: string): string {
  const match = /^([A-G]#?)(\d)$/.exec(name);
  if (match === null) throw new Error(`Not a pitch: ${name}`);
  return `${match[1]}${Number(match[2]) + 1}`;
}

/** The pumping triangle under every song. */
const BASS = { wave: 'triangle', gain: 0.45, beatsPerStep: 0.5 } as const;
/** The lead, in eighth notes. */
const LEAD = { wave: 'triangle', gain: 0.8, beatsPerStep: 0.5 } as const;
/** A low square on the same notes as the lead, for the edge of a synth lead. */
const LEAD_DOUBLE = { wave: 'square', gain: 0.14, beatsPerStep: 0.5 } as const;
/** Low squares on top: stabs on the off-beats and the arpeggio. */
const STABS = { wave: 'square', gain: 0.12, beatsPerStep: 1 } as const;
const ARPEGGIO = { wave: 'square', gain: 0.08, beatsPerStep: 0.25 } as const;

const LOBBY_LEAD =
  'E4 - - G4 - B4 - A4  G4 - E4 - - . C5 B4  A4 - - F#4 - D4 - F#4  E4 - - - - . . .  ' +
  'E4 - - G4 - B4 - D5  E5 - D5 - C5 - B4 G4  A4 - - D5 - F#4 - A4  F#4 - - - D#4 - F#4 .  ' +
  'G4 - - C5 - E5 - D5  D5 - - A4 - F#4 - A4  B4 - - D5 - F#5 - D5  E5 - - - B4 . G4 .  ' +
  'C5 - - E5 - G5 - E5  F#5 - - D5 - A4 - D5  B4 - E5 - G5 - F#5 -  D#5 - - - B4 - F#4 .';

/** The lobby: E minor, 126 bpm, the lead doubled over stabs on the off-beats (MUSIC-01 AC 1, AD-032). */
export const LOBBY_SONG: Song = score(126, 16, [
  { ...LEAD, steps: LOBBY_LEAD },
  { ...LEAD_DOUBLE, steps: LOBBY_LEAD },
  {
    ...STABS,
    steps: offbeats(['G4', 'E4', 'F#4', 'G4', 'G4', 'E4', 'F#4', 'D#4', 'E4', 'F#4', 'D4', 'G4', 'E4', 'F#4', 'G4', 'D#4']),
  },
  { ...BASS, steps: pump(['E2', 'C2', 'D2', 'E2', 'E2', 'C2', 'D2', 'B1', 'C2', 'D2', 'B1', 'E2', 'C2', 'D2', 'E2', 'B1']) },
]);

const MATCH_LEAD =
  'A4 - - C5 - E5 - D5  C5 - A4 - - . F4 G4  B4 - - D5 - G5 - F5  E5 - - - - . . .  ' +
  'A4 - - C5 - E5 - G5  A5 - G5 - F5 - E5 C5  D5 - - B4 - G4 - B4  G#4 - - - B4 - E5 .  ' +
  'F5 - - E5 - C5 - A4  D5 - - B4 - G4 - D5  E5 - - G5 - B4 - E5  C5 - - - A4 . E5 .  ' +
  'F5 - - E5 - F5 - A5  G5 - - F5 - D5 - B4  C5 - E5 - A5 - G5 -  G#5 - - - E5 - B4 .';

/**
 * The round and the words: A minor, 126 bpm, the lead doubled over an arpeggio; 189 bpm at 1.5 times (MUSIC-01 AC 2-3,
 * AD-032).
 */
export const MATCH_SONG: Song = score(126, 16, [
  { ...LEAD, steps: MATCH_LEAD },
  { ...LEAD_DOUBLE, steps: MATCH_LEAD },
  {
    ...ARPEGGIO,
    steps: arpeggio([
      'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4', 'E3 G#3 B3',
      'F3 A3 C4', 'G3 B3 D4', 'E3 G3 B3', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4', 'E3 G#3 B3',
    ]),
  },
  { ...BASS, steps: pump(['A2', 'F2', 'G2', 'A2', 'A2', 'F2', 'G2', 'E2', 'F2', 'G2', 'E2', 'A2', 'F2', 'G2', 'A2', 'E2']) },
]);

/**
 * The result between rounds: the race held back, A minor, the lead alone with rests, ending on E so the race goes on;
 * 128 bpm, 16 bars, exactly 30 s (MUSIC-01 AC 6, 12, AD-032).
 */
export const JINGLE_SONG: Song = score(128, 16, [
  {
    ...LEAD,
    steps:
      'A4 . C5 . E5 - D5 .  C5 - A4 . . . . .  G4 . C5 . E5 - G5 .  D5 - - - . . . .  ' +
      'A4 . C5 . E5 - G5 .  A5 - G5 . F5 - E5 .  D5 . B4 . G4 - B4 .  D5 - - - . . . .  ' +
      'F5 . E5 . C5 - A4 .  B4 . D5 . G5 - F5 .  E5 - - C5 - A4 - C5  E5 - - - . . . .  ' +
      'F5 . A5 . F5 - C5 .  G5 . D5 . B4 - D5 .  G#4 . B4 . E5 - D5 .  B4 - - - . . . .',
  },
  {
    ...STABS,
    gain: 0.1,
    steps: offbeats(['E4', 'F4', 'E4', 'D4', 'E4', 'F4', 'D4', 'D4', 'F4', 'D4', 'E4', 'E4', 'F4', 'D4', 'G#4', 'G#4']),
  },
  { ...BASS, steps: pump(['A2', 'F2', 'C3', 'G2', 'A2', 'F2', 'G2', 'G2', 'F2', 'G2', 'A2', 'A2', 'F2', 'G2', 'E2', 'E2']) },
]);

const FINALE_LEAD =
  'G4 . C5 . E5 . G5 -  C6 - - - E5 - G5 .  G#5 - - D#5 - C5 - D#5  A#5 - - F5 - D5 - F5  ' +
  'G5 - - E5 - C5 - E5  F5 - A5 - C6 - A5 F5  G5 - - D5 - B4 - D5  G5 . G5 . A5 . B5 .  ' +
  'C6 - - G5 - E5 - G5  A5 - - E5 - C5 - E5  F5 - - C5 - A4 - C5  D5 - E5 - F5 - G5 -  ' +
  'G#5 - - - D#5 - G#5 -  A#5 - - - F5 - A#5 -  C6 - - - G5 - C6 -  C6 - - - - . . .';

/**
 * The podium: the victory, C major after the minor race, with a fanfare and the bVI-bVII-I cadence (Ab-Bb-C, written in
 * sharps); 132 bpm (MUSIC-01 AC 7, AD-032).
 */
export const FINALE_SONG: Song = score(132, 16, [
  { ...LEAD, steps: FINALE_LEAD },
  { ...LEAD_DOUBLE, gain: 0.16, steps: FINALE_LEAD },
  {
    ...ARPEGGIO,
    steps: arpeggio([
      'C4 E4 G4', 'C4 E4 G4', 'G#3 C4 D#4', 'A#3 D4 F4', 'C4 E4 G4', 'F3 A3 C4', 'G3 B3 D4', 'G3 B3 D4',
      'C4 E4 G4', 'A3 C4 E4', 'F3 A3 C4', 'G3 B3 D4', 'G#3 C4 D#4', 'A#3 D4 F4', 'C4 E4 G4', 'C4 E4 G4',
    ]),
  },
  { ...BASS, steps: pump(['C3', 'C3', 'G#2', 'A#2', 'C3', 'F2', 'G2', 'G2', 'C3', 'A2', 'F2', 'G2', 'G#2', 'A#2', 'C3', 'C3']) },
]);

/** The song of each track. */
export const TRACK_SONGS: Record<MusicTrack, Song> = {
  lobby: LOBBY_SONG,
  match: MATCH_SONG,
  jingle: JINGLE_SONG,
  finale: FINALE_SONG,
};
