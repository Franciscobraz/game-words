import type { AudioContextLike, AudioNodeLike, AudioParamLike, GainNodeLike, OscillatorNodeLike } from '../device/audio.ts';

/** An `AudioParam` that remembers its value and the peak it was set to. */
export interface FakeParam extends AudioParamLike {
  peak: number;
}

/** A node that remembers what it connected to. */
export interface FakeNode extends AudioNodeLike {
  target: AudioNodeLike | AudioParamLike | null;
}

export interface FakeGain extends FakeNode, GainNodeLike {
  gain: FakeParam;
}

export interface FakeOscillator extends FakeNode, OscillatorNodeLike {
  frequency: FakeParam;
  startedAt: number | null;
  stoppedAt: number | null;
}

/** An audio context the tests read: every node it made and what each one does (style guide §9). */
export interface FakeAudioContext extends AudioContextLike {
  state: string;
  destination: FakeNode;
  oscillators: FakeOscillator[];
  /** Every gain that reaches the speakers, in the order they were made. */
  outputs: FakeGain[];
  /** The peak gain of the last sound. */
  loudestOutput(): number;
  /** The browser lets the sound play without being asked. */
  becomeRunning(): void;
}

function fakeParam(): FakeParam {
  const param: FakeParam = {
    value: 0,
    peak: 0,
    setValueAtTime(value) {
      param.value = value;
      param.peak = Math.max(param.peak, value);
    },
    exponentialRampToValueAtTime() {},
  };
  return param;
}

function fakeNode(): FakeNode {
  const node: FakeNode = {
    target: null,
    connect(target) {
      node.target = target;
    },
  };
  return node;
}

/** A context in `state`; with `refusesResume`, `resume` rejects, as a browser that sees no gesture may do. */
export function fakeAudioContext(state: string, { refusesResume = false } = {}): FakeAudioContext {
  const listeners: (() => void)[] = [];
  const destination = fakeNode();
  const gains: FakeGain[] = [];

  const context: FakeAudioContext = {
    state,
    currentTime: 12,
    destination,
    oscillators: [],
    get outputs() {
      return gains.filter((gain) => gain.target === destination);
    },
    loudestOutput() {
      const last = context.outputs.at(-1);
      if (last === undefined) throw new Error('No sound was played');
      return last.gain.peak;
    },
    becomeRunning() {
      context.state = 'running';
      for (const listener of listeners) listener();
    },
    resume() {
      if (refusesResume) return Promise.reject(new Error('No user gesture'));
      context.state = 'running';
      return Promise.resolve();
    },
    createGain() {
      const gain: FakeGain = { ...fakeNode(), gain: fakeParam() };
      gain.connect = (target) => {
        gain.target = target;
      };
      gains.push(gain);
      return gain;
    },
    createOscillator() {
      const oscillator: FakeOscillator = {
        ...fakeNode(),
        frequency: fakeParam(),
        startedAt: null,
        stoppedAt: null,
        start(time) {
          oscillator.startedAt = time;
        },
        stop(time) {
          oscillator.stoppedAt = time;
        },
      };
      oscillator.connect = (target) => {
        oscillator.target = target;
      };
      context.oscillators.push(oscillator);
      return oscillator;
    },
    addEventListener(_type, listener) {
      listeners.push(listener);
    },
  };
  return context;
}
