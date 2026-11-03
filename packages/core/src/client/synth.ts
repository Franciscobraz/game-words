/**
 * Sounds made of notes, played with Web Audio on both clients, so the TV's words
 * list and the phone's valid word make the same "check" (WORDCTL-01 AC 15,
 * FEEDBACK-02 AC 2). The core has no DOM types: the interfaces below describe only
 * the part of Web Audio the clients use, and the browser's `AudioContext` fits them.
 */

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
  /** The wave; a string because the browser knows more waves than the notes use. */
  type: string;
  frequency: AudioParamLike;
  start(time: number): void;
  stop(time: number): void;
}

/** The part of an `AudioContext` the clients use; the tests pass a fake (style guide §4, L). */
export interface AudioContextLike {
  readonly state: string;
  readonly currentTime: number;
  readonly destination: AudioNodeLike;
  resume(): Promise<void>;
  createOscillator(): OscillatorNodeLike;
  createGain(): GainNodeLike;
  addEventListener(type: 'statechange', listener: () => void): void;
}

/** Waves the notes use. */
export type Wave = 'sine' | 'triangle' | 'square';

/** One note of a sound, in seconds from the start of the sound. */
export interface Note {
  startS: number;
  durationS: number;
  frequencyHz: number;
  wave: Wave;
  /** Share of the sound's peak gain, from 0 to 1. */
  gain: number;
}

/** The "check": two short triangle notes that rise, about 0.2 s in all (WORDCTL-01 AC 15, FEEDBACK-02 AC 2). */
export const CHECK_SOUND: readonly Note[] = [
  { startS: 0, durationS: 0.08, frequencyHz: 880, wave: 'triangle', gain: 0.8 },
  { startS: 0.08, durationS: 0.12, frequencyHz: 1_318.5, wave: 'triangle', gain: 1 },
];

/** The fade-out of a note ends at this gain, since an exponential ramp cannot reach 0. */
const SILENT_GAIN = 0.0001;

/**
 * Plays `notes` from `atS` on the context's clock, each with its own oscillator and
 * a gain that starts at its share of `peakGain` and fades out by the end of the note.
 * The notes go to `output`, the speakers unless told otherwise; the TV's music passes
 * the gain of its track (MUSIC-01 AC 10).
 */
export function playNotes(
  context: AudioContextLike,
  notes: readonly Note[],
  atS: number,
  peakGain: number,
  output: AudioNodeLike = context.destination,
): void {
  for (const note of notes) playNote(context, note, atS + note.startS, peakGain * note.gain, output);
}

function playNote(context: AudioContextLike, note: Note, startS: number, gain: number, target: AudioNodeLike): void {
  const endS = startS + note.durationS;
  const output = context.createGain();
  output.gain.setValueAtTime(gain, startS);
  output.gain.exponentialRampToValueAtTime(SILENT_GAIN, endS);
  output.connect(target);

  const oscillator = context.createOscillator();
  oscillator.type = note.wave;
  oscillator.frequency.value = note.frequencyHz;
  oscillator.connect(output);
  oscillator.start(startS);
  oscillator.stop(endS);
}
