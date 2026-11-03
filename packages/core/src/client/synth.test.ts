import { describe, expect, test } from 'vitest';
import { type AudioContextLike, type AudioNodeLike, type AudioParamLike, CHECK_SOUND, playNotes } from './synth.ts';

/** What a param was set to and when, in order. */
interface ParamLog extends AudioParamLike {
  events: { kind: 'set' | 'ramp'; value: number; time: number }[];
}

interface LoggedNode extends AudioNodeLike {
  target: AudioNodeLike | AudioParamLike | null;
}

interface LoggedOscillator extends LoggedNode {
  type: string;
  frequency: ParamLog;
  startedAt: number | null;
  stoppedAt: number | null;
  start(time: number): void;
  stop(time: number): void;
}

interface LoggedGain extends LoggedNode {
  gain: ParamLog;
}

/** A param that logs what it was set to and when. */
function loggedParam(): ParamLog {
  const param: ParamLog = {
    value: 0,
    events: [],
    setValueAtTime(value, time) {
      param.value = value;
      param.events.push({ kind: 'set', value, time });
    },
    exponentialRampToValueAtTime(value, time) {
      param.events.push({ kind: 'ramp', value, time });
    },
  };
  return param;
}

/** A context that keeps every node it made (style guide §9: a fake, not a mock). */
function fakeContext() {
  const destination: LoggedNode = { target: null, connect() {} };
  const oscillators: LoggedOscillator[] = [];
  const gains: LoggedGain[] = [];
  const context: AudioContextLike = {
    state: 'running',
    currentTime: 7,
    destination,
    resume: () => Promise.resolve(),
    addEventListener() {},
    createGain() {
      const gain: LoggedGain = {
        gain: loggedParam(),
        target: null,
        connect(target) {
          gain.target = target;
        },
      };
      gains.push(gain);
      return gain;
    },
    createOscillator() {
      const oscillator: LoggedOscillator = {
        type: 'sine',
        frequency: loggedParam(),
        startedAt: null,
        stoppedAt: null,
        target: null,
        connect(target) {
          oscillator.target = target;
        },
        start(time) {
          oscillator.startedAt = time;
        },
        stop(time) {
          oscillator.stoppedAt = time;
        },
      };
      oscillators.push(oscillator);
      return oscillator;
    },
  };
  return { context, destination, oscillators, gains };
}

describe('playNotes', () => {
  test('plays the check as short rising notes', () => {
    // WORDCTL-01 AC 15, FEEDBACK-02 AC 2: one short "check", the same recipe on the TV and the phone.
    const { context, destination, oscillators, gains } = fakeContext();
    const AT_S = 7;
    const PEAK_GAIN = 0.4;

    playNotes(context, CHECK_SOUND, AT_S, PEAK_GAIN);

    expect(oscillators).toHaveLength(CHECK_SOUND.length);
    expect(CHECK_SOUND.length).toBeGreaterThanOrEqual(2);
    const frequencies = oscillators.map((o) => o.frequency.value);
    expect(frequencies).toEqual(CHECK_SOUND.map((n) => n.frequencyHz));
    for (let i = 1; i < frequencies.length; i++) expect(frequencies[i]).toBeGreaterThan(frequencies[i - 1]!);
    // Short: the whole check fits in a quarter of a second, one note after the other.
    const lastStop = Math.max(...oscillators.map((o) => o.stoppedAt!));
    expect(lastStop - AT_S).toBeGreaterThanOrEqual(0.15);
    expect(lastStop - AT_S).toBeLessThanOrEqual(0.25);

    oscillators.forEach((oscillator, i) => {
      const note = CHECK_SOUND[i]!;
      const gain = gains[i]!;
      expect(oscillator.type).toBe('triangle');
      expect(oscillator.startedAt).toBe(AT_S + note.startS);
      expect(oscillator.stoppedAt).toBeCloseTo(AT_S + note.startS + note.durationS);
      // Each note through its own gain to the speakers, at its share of the peak, fading out by its end.
      expect(oscillator.target).toBe(gain);
      expect(gain.target).toBe(destination);
      const [start, fade] = gain.gain.events;
      expect(start).toEqual({ kind: 'set', value: PEAK_GAIN * note.gain, time: AT_S + note.startS });
      expect(start!.value).toBeLessThanOrEqual(PEAK_GAIN);
      expect(fade!.kind).toBe('ramp');
      expect(fade!.value).toBeLessThan(0.001);
      expect(fade!.time).toBeCloseTo(oscillator.stoppedAt!);
    });
  });
});
