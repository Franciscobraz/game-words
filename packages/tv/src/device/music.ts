import { type AudioContextLike, type GainNodeLike, type Note, playNotes } from '@bwords/core';
import type { MusicTrack } from '../model/music.ts';
import { notesInWindow, TRACK_SONGS } from '../model/songs.ts';
import { effectsPeakGain } from './audio.ts';

/** What the music should be doing now. */
export interface MusicCue {
  /** The track to play; null for silence. */
  track: MusicTrack | null;
  /** Where the track is, in seconds of its score. */
  positionS: number;
  /** How fast the score goes: 1 normally, 1.5 in the last seconds of a round (MUSIC-01 AC 3). */
  tempo: number;
  /** The room's volume, 0 to 100, and its mute. */
  volume: number;
  muted: boolean;
}

/** Plays the TV's music with Web Audio, with no audio file (MUSIC-01 AC 11). */
export interface MusicPlayer {
  /** Follows `cue`: called on each tick of the clock, it schedules the notes just ahead. */
  play(cue: MusicCue): void;
}

/** The music plays at half the peak gain of the effects at the same volume (MUSIC-01 AC 10). */
export const MUSIC_GAIN_RATIO = 0.5;

/** How far ahead of the clock the notes are scheduled, in real seconds; a slow TV browser gets this much slack. */
const LOOKAHEAD_S = 0.3;

/** How long a track that stops takes to fade out. */
const FADE_OUT_S = 0.5;

/** The fade-out ends at this gain, since an exponential ramp cannot reach 0. */
const SILENT_GAIN = 0.0001;

/** What the browser reports while the sound is held back. */
const SUSPENDED = 'suspended';

/** The track on the speakers: its gain, and up to where its score is scheduled. */
interface PlayingTrack {
  track: MusicTrack;
  output: GainNodeLike;
  gain: number;
  /** Null when nothing is scheduled ahead, as after the browser held the sound back. */
  scheduledUntilS: number | null;
}

/**
 * Creates the player over `context`, the same one the effects use; null when the browser has no Web Audio. Each track
 * has its own gain, and a track that stops fades out. The notes are scheduled on the context's clock: a note at `t` of
 * the score plays at `currentTime + (t - positionS) / tempo`, with its length divided by the tempo, and its pitch as
 * written (MUSIC-01 AC 3). A blocked context keeps its time still, so nothing is scheduled while it is blocked, and the
 * unlock starts from the position the music is at (AC 15).
 */
export function createMusicPlayer(context: AudioContextLike | null): MusicPlayer {
  let playing: PlayingTrack | null = null;

  return {
    play(cue) {
      if (context === null) return;
      if (context.state === SUSPENDED) {
        if (playing !== null) playing.scheduledUntilS = null;
        return;
      }
      const gain = cue.muted ? 0 : MUSIC_GAIN_RATIO * effectsPeakGain(cue.volume);
      const track = gain > 0 ? cue.track : null;
      if (playing?.track !== track) {
        if (playing !== null) fadeOut(context, playing.output);
        playing = track === null ? null : startTrack(context, track, gain);
      }
      if (playing === null) return;
      if (playing.gain !== gain) {
        playing.output.gain.setValueAtTime(gain, context.currentTime);
        playing.gain = gain;
      }
      scheduleAhead(context, playing, cue);
    },
  };
}

function startTrack(context: AudioContextLike, track: MusicTrack, gain: number): PlayingTrack {
  const output = context.createGain();
  output.gain.setValueAtTime(gain, context.currentTime);
  output.connect(context.destination);
  return { track, output, gain, scheduledUntilS: null };
}

function fadeOut(context: AudioContextLike, output: GainNodeLike): void {
  const now = context.currentTime;
  output.gain.setValueAtTime(output.gain.value, now);
  output.gain.exponentialRampToValueAtTime(SILENT_GAIN, now + FADE_OUT_S);
}

/** Schedules the notes from where the last call stopped to `LOOKAHEAD_S` of real time ahead of the position. */
function scheduleAhead(context: AudioContextLike, playing: PlayingTrack, cue: MusicCue): void {
  const fromS = Math.max(playing.scheduledUntilS ?? cue.positionS, cue.positionS);
  const toS = cue.positionS + LOOKAHEAD_S * cue.tempo;
  if (toS <= fromS) return;
  const notes = notesInWindow(TRACK_SONGS[playing.track], fromS, toS).map((note) => inRealTime(note, cue));
  playNotes(context, notes, context.currentTime, 1, playing.output);
  playing.scheduledUntilS = toS;
}

/** The note in seconds from now: start and length divided by the tempo, the pitch as written (MUSIC-01 AC 3). */
function inRealTime(note: Note, cue: MusicCue): Note {
  return { ...note, startS: (note.startS - cue.positionS) / cue.tempo, durationS: note.durationS / cue.tempo };
}
