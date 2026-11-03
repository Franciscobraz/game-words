import { type AudioContextLike, type AudioNodeLike, type AudioParamLike, CHECK_SOUND, type GainNodeLike, type OscillatorNodeLike } from '@bwords/core';
import { expect, test } from 'vitest';
import { createHitSound } from './hit-sound.ts';

/** What an oscillator of the fake context was asked to play. */
interface PlayedNote {
  wave: string;
  frequencyHz: number;
  startS: number;
  stopS: number;
}

/** A context whose clock reads `currentTime` and which lists every oscillator it played (style guide §9). */
function fakeContext(currentTime: number) {
  const played: PlayedNote[] = [];
  const destination: AudioNodeLike = { connect: () => undefined };
  const param = (): AudioParamLike => ({ value: 0, setValueAtTime: () => undefined, exponentialRampToValueAtTime: () => undefined });
  const context: AudioContextLike = {
    state: 'running',
    currentTime,
    destination,
    resume: () => Promise.resolve(),
    addEventListener: () => undefined,
    createGain: (): GainNodeLike => ({ gain: param(), connect: () => undefined }),
    createOscillator(): OscillatorNodeLike {
      const note: PlayedNote = { wave: '', frequencyHz: 0, startS: -1, stopS: -1 };
      const frequency = param();
      const oscillator: OscillatorNodeLike = {
        type: '',
        frequency,
        connect: () => undefined,
        start(time) {
          note.wave = oscillator.type;
          note.frequencyHz = frequency.value;
          note.startS = time;
        },
        stop(time) {
          note.stopS = time;
          played.push(note);
        },
      };
      return oscillator;
    },
  };
  return { context, played };
}

test('plays the check of the tv words list', () => {
  // FEEDBACK-02 AC 2: each valid word plays the notes of CHECK_SOUND, the same the TV plays, from the context's now.
  const { context, played } = fakeContext(5);
  let contextsMade = 0;
  const playHitSound = createHitSound(() => {
    contextsMade += 1;
    return context;
  });
  expect(contextsMade).toBe(0);

  playHitSound();
  playHitSound();

  const check = CHECK_SOUND.map((note) => ({
    wave: note.wave,
    frequencyHz: note.frequencyHz,
    startS: 5 + note.startS,
    stopS: 5 + note.startS + note.durationS,
  }));
  expect(played).toEqual([...check, ...check]);
  expect(contextsMade).toBe(1);
});
