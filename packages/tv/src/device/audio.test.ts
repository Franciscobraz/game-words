import { describe, expect, test } from 'vitest';
import type { AudioCue } from '../model/audio-cues.ts';
import { fakeAudioContext, type FakeGain } from '../testing/fake-audio.ts';
import { createAudio } from './audio.ts';

const CUES: readonly AudioCue[] = ['round-start', 'last-seconds', 'time-up', 'words-start'];

describe('createAudio', () => {
  test.each(CUES)('follows the room volume and mute: %s', (cue) => {
    const context = fakeAudioContext('running');
    const audio = createAudio(() => context);

    audio.play(cue, 100, false);
    const fullVolume = context.loudestOutput();
    audio.play(cue, 40, false);
    const lowVolume = context.loudestOutput();
    audio.play(cue, 80, false);
    const highVolume = context.loudestOutput();
    const soundsBeforeMute = context.oscillators.length;

    audio.play(cue, 100, true);
    audio.play(cue, 0, false);

    expect(fullVolume).toBeGreaterThan(0);
    expect(lowVolume).toBeCloseTo(fullVolume * 0.4);
    expect(highVolume).toBeCloseTo(fullVolume * 0.8);
    expect(context.oscillators).toHaveLength(soundsBeforeMute);
  });

  test.each<AudioCue>(['round-start', 'last-seconds', 'words-start'])('plays a short tone that ends by itself: %s', (cue) => {
    const context = fakeAudioContext('running');

    createAudio(() => context).play(cue, 100, false);

    expect(context.oscillators).toHaveLength(1);
    const [tone] = context.oscillators;
    expect(tone!.startedAt).toBe(context.currentTime);
    expect(tone!.stoppedAt! - tone!.startedAt!).toBeLessThanOrEqual(0.5);
    expect(tone!.target).toBe(context.outputs.at(-1));
    expect(context.outputs.at(-1)!.target).toBe(context.destination);
  });

  test('whistles with a high oscillator and vibrato for about 0.6 s', () => {
    const context = fakeAudioContext('running');

    createAudio(() => context).play('time-up', 100, false);

    expect(context.oscillators).toHaveLength(2);
    const [whistle, vibrato] = context.oscillators;
    expect(whistle!.frequency.value).toBeGreaterThanOrEqual(2_000);
    expect(whistle!.stoppedAt! - whistle!.startedAt!).toBeCloseTo(0.6);
    expect(whistle!.target).toBe(context.outputs[0]);
    expect(context.outputs[0]!.target).toBe(context.destination);
    // The vibrato shakes the whistle's frequency through a gain, and it never reaches the speakers.
    expect(vibrato!.frequency.value).toBeLessThan(100);
    const depth = vibrato!.target as FakeGain;
    expect(depth.gain.value).toBeGreaterThan(0);
    expect(depth.target).toBe(whistle!.frequency);
    expect(vibrato!.stoppedAt).toBe(whistle!.stoppedAt);
  });

  test('unlocks a suspended context', async () => {
    const context = fakeAudioContext('suspended');
    const audio = createAudio(() => context);
    expect(audio.isBlocked()).toBe(true);

    audio.play('round-start', 100, false);
    expect(context.oscillators).toHaveLength(0);

    await audio.unlock();

    expect(context.state).toBe('running');
    expect(audio.isBlocked()).toBe(false);
    audio.play('round-start', 100, false);
    expect(context.oscillators).toHaveLength(1);
  });

  test('stays blocked when the browser refuses to resume', async () => {
    const context = fakeAudioContext('suspended', { refusesResume: true });
    const audio = createAudio(() => context);

    await audio.unlock();

    expect(audio.isBlocked()).toBe(true);
  });

  test('tells when the browser lets the sound play by itself', () => {
    const context = fakeAudioContext('suspended');
    const audio = createAudio(() => context);
    let changes = 0;
    audio.onBlockedChange(() => {
      changes += 1;
    });

    context.becomeRunning();

    expect(changes).toBe(1);
    expect(audio.isBlocked()).toBe(false);
  });

  test('does nothing without web audio', async () => {
    for (const createContext of [
      () => null,
      () => {
        throw new Error('AudioContext is not allowed here');
      },
    ]) {
      const audio = createAudio(createContext);

      expect(audio.isBlocked()).toBe(false);
      for (const cue of CUES) expect(() => audio.play(cue, 100, false)).not.toThrow();
      await expect(audio.unlock()).resolves.toBeUndefined();
      expect(() => audio.onBlockedChange(() => {})).not.toThrow();
      expect(audio.isBlocked()).toBe(false);
    }
  });
});
