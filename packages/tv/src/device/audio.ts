import type { AudioCue } from '../model/audio-cues.ts';

/** The part of an `AudioParam` the sounds use. */
export interface AudioParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
}

/** The part of an `AudioNode` the sounds use; a node connects to another node or to a param. */
export interface AudioNodeLike {
  connect(target: AudioNodeLike | AudioParamLike): unknown;
}

/** The part of a `GainNode` the sounds use. */
export interface GainNodeLike extends AudioNodeLike {
  gain: AudioParamLike;
}

/** The part of an `OscillatorNode` the sounds use. */
export interface OscillatorNodeLike extends AudioNodeLike {
  frequency: AudioParamLike;
  start(time: number): void;
  stop(time: number): void;
}

/** The part of an `AudioContext` the TV uses; the tests pass a fake (style guide §4, L). */
export interface AudioContextLike {
  readonly state: string;
  readonly currentTime: number;
  readonly destination: AudioNodeLike;
  resume(): Promise<void>;
  createOscillator(): OscillatorNodeLike;
  createGain(): GainNodeLike;
  addEventListener(type: 'statechange', listener: () => void): void;
}

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

/** A short tone. */
interface Tone {
  frequencyHz: number;
  durationS: number;
}

/** The short tones: high to start, low to warn, and in between when the words begin (TVAUDIO-01 AC 1). */
const TONES: Record<Exclude<AudioCue, 'time-up'>, Tone> = {
  'round-start': { frequencyHz: 880, durationS: 0.3 },
  'last-seconds': { frequencyHz: 440, durationS: 0.2 },
  'words-start': { frequencyHz: 660, durationS: 0.25 },
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
      const peakGain = (volume / MAX_VOLUME) * FULL_VOLUME_GAIN;
      if (cue === 'time-up') playWhistle(context, peakGain);
      else playTone(context, TONES[cue], peakGain);
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

/** The context, or null when the browser does not give one. */
function openContext(createContext: () => AudioContextLike | null): AudioContextLike | null {
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

function playTone(context: AudioContextLike, tone: Tone, peakGain: number): void {
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  oscillator.frequency.value = tone.frequencyHz;
  oscillator.connect(fadingOutput(context, peakGain, tone.durationS));
  oscillator.start(start);
  oscillator.stop(start + tone.durationS);
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

/** The browser's context, or null when it has no Web Audio (TVAUDIO-01 AC 5). */
export function browserAudioContext(): AudioContextLike | null {
  return typeof AudioContext === 'undefined' ? null : new AudioContext();
}
