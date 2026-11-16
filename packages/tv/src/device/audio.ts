import { type AudioContextLike, CHECK_SOUND, type GainNodeLike, type Note, playNotes } from '@bwords/core';
import type { AudioCue } from '../model/audio-cues.ts';

/** The sounds of the TV, in the room's volume and mute (TVAUDIO-01). */
export interface AudioDevice {
  /** Plays `cue` at `volume` (0 to 100); a muted or blocked TV stays silent (TVAUDIO-01 AC 2). */
  play(cue: AudioCue, volume: number, muted: boolean): void;
  /** Whether the browser is holding the sound back until a key or a click (TVAUDIO-01 AC 3). */
  isBlocked(): boolean;
  /** Asks the browser to let the sound play; settles when it answers (TVAUDIO-01 AC 4). */
  unlock(): Promise<void>;
  /** Calls `listener` each time the browser blocks or lets the sound play by itself. */
  onBlockedChange(listener: () => void): void;
}

/**
 * The short beeps, in chiptune notes on the pitches of the match music, A and E (TVAUDIO-01 AC 1, AD-032): high to
 * start, low to warn, and in between when the words begin. The squares play softer, to sound as loud as a triangle.
 */
export const BEEPS: Record<Exclude<AudioCue, 'time-up' | 'check'>, readonly Note[]> = {
  // A5 and A6, the start lights of a race.
  'round-start': [
    { startS: 0, durationS: 0.09, frequencyHz: 880, wave: 'square', gain: 0.45 },
    { startS: 0.1, durationS: 0.25, frequencyHz: 1_760, wave: 'square', gain: 0.45 },
  ],
  // Two short A4s, a warning light.
  'last-seconds': [
    { startS: 0, durationS: 0.08, frequencyHz: 440, wave: 'square', gain: 0.5 },
    { startS: 0.12, durationS: 0.08, frequencyHz: 440, wave: 'square', gain: 0.5 },
  ],
  // E5 rising to A5.
  'words-start': [
    { startS: 0, durationS: 0.1, frequencyHz: 659.25, wave: 'triangle', gain: 0.9 },
    { startS: 0.1, durationS: 0.18, frequencyHz: 880, wave: 'triangle', gain: 1 },
  ],
};

/** The whistle: high and about 0.6 s long, with the fast flutter of a referee's whistle (TVAUDIO-01 AC 6). */
const WHISTLE_HZ = 2_400;
const WHISTLE_DURATION_S = 0.6;
const WHISTLE_VIBRATO_HZ = 28;
const WHISTLE_VIBRATO_DEPTH_HZ = 180;

/** The loudness of a sound at full room volume, from 0 to 1; a TV's speakers need no more. */
const FULL_VOLUME_GAIN = 0.5;

/** The room's volume goes up to this (protocol: `Settings.volume`). */
const MAX_VOLUME = 100;

/** The fade-out ends at this gain, since an exponential ramp cannot reach 0. */
const SILENT_GAIN = 0.0001;

/** What the browser reports while the sound is held back. */
const SUSPENDED = 'suspended';

/**
 * Creates the sounds over the context of `createContext`, which gives null when the browser has no Web Audio: then
 * everything does nothing, and there is no notice (TVAUDIO-01 AC 5). The context opens at once to learn whether the
 * browser blocks it; the sounds are made with Web Audio, with no files (design: `device/audio.ts`).
 */
export function createAudio(createContext: () => AudioContextLike | null): AudioDevice {
  const context = openContext(createContext);

  return {
    play(cue, volume, muted) {
      // A blocked context keeps its time still: a sound scheduled now would all come out at the unlock.
      if (context === null || muted || volume <= 0 || context.state === SUSPENDED) return;
      SOUNDS[cue](context, effectsPeakGain(volume));
    },
    isBlocked: () => context !== null && context.state === SUSPENDED,
    async unlock() {
      if (context === null || context.state !== SUSPENDED) return;
      try {
        await context.resume();
      } catch (error) {
        console.warn('The sound could not be unlocked', error);
      }
    },
    onBlockedChange(listener) {
      context?.addEventListener('statechange', listener);
    },
  };
}

/** The peak gain of the effects at the room's `volume` (0 to 100); the music plays at a share of it (MUSIC-01 AC 10). */
export function effectsPeakGain(volume: number): number {
  return (volume / MAX_VOLUME) * FULL_VOLUME_GAIN;
}

/** The context, or null when the browser does not give one. */
export function openContext(createContext: () => AudioContextLike | null): AudioContextLike | null {
  try {
    return createContext();
  } catch (error) {
    console.warn('Web Audio is not available', error);
    return null;
  }
}

/** A gain to the speakers that fades out over `durationS` from `peakGain`. */
function fadingOutput(context: AudioContextLike, peakGain: number, durationS: number): GainNodeLike {
  const start = context.currentTime;
  const output = context.createGain();
  output.gain.setValueAtTime(peakGain, start);
  output.gain.exponentialRampToValueAtTime(SILENT_GAIN, start + durationS);
  output.connect(context.destination);
  return output;
}

/** A high oscillator whose frequency a slow one shakes. */
function playWhistle(context: AudioContextLike, peakGain: number): void {
  const start = context.currentTime;
  const end = start + WHISTLE_DURATION_S;

  const whistle = context.createOscillator();
  whistle.frequency.value = WHISTLE_HZ;
  whistle.connect(fadingOutput(context, peakGain, WHISTLE_DURATION_S));

  const vibrato = context.createOscillator();
  vibrato.frequency.value = WHISTLE_VIBRATO_HZ;
  const vibratoDepth = context.createGain();
  vibratoDepth.gain.value = WHISTLE_VIBRATO_DEPTH_HZ;
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(whistle.frequency);

  for (const oscillator of [whistle, vibrato]) {
    oscillator.start(start);
    oscillator.stop(end);
  }
}

/** How each cue sounds (style guide §4, O): a new sound is a new entry. */
const SOUNDS: Record<AudioCue, (context: AudioContextLike, peakGain: number) => void> = {
  'round-start': (context, peakGain) => playNotes(context, BEEPS['round-start'], context.currentTime, peakGain),
  'last-seconds': (context, peakGain) => playNotes(context, BEEPS['last-seconds'], context.currentTime, peakGain),
  'words-start': (context, peakGain) => playNotes(context, BEEPS['words-start'], context.currentTime, peakGain),
  'time-up': playWhistle,
  // The same recipe as the phone's valid word (WORDCTL-01 AC 15, FEEDBACK-02 AC 2).
  check: (context, peakGain) => playNotes(context, CHECK_SOUND, context.currentTime, peakGain),
};

/** The browser's context, or null when it has no Web Audio (TVAUDIO-01 AC 5). */
export function browserAudioContext(): AudioContextLike | null {
  return typeof AudioContext === 'undefined' ? null : new AudioContext();
}
