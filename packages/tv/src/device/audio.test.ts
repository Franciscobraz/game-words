import { CHECK_SOUND, type Note } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import type { AudioCue } from '../model/audio-cues.ts';
import { fakeAudioContext, type FakeAudioContext, type FakeGain } from '../testing/fake-audio.ts';
import { BEEPS, createAudio, effectsPeakGain } from './audio.ts';

const CUES: readonly AudioCue[] = ['round-start', 'last-seconds', 'time-up', 'words-start', 'check'];
const BEEP_CUES = ['round-start', 'last-seconds', 'words-start'] as const;

/** What each oscillator of the context played. */
function playedNotes(context: FakeAudioContext) {
  return context.oscillators.map((oscillator) => ({
    wave: oscillator.type,
    frequencyHz: oscillator.frequency.value,
    startS: oscillator.startedAt,
    stopS: oscillator.stoppedAt,
  }));
}

/** The same shape for `notes` played from `startS`. */
function scheduled(notes: readonly Note[], startS: number) {
  return notes.map((note) => ({
    wave: note.wave,
    frequencyHz: note.frequencyHz,
    startS: startS + note.startS,
    stopS: startS + note.startS + note.durationS,
  }));
}

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

  test.each(BEEP_CUES)('plays the notes of its short beep, which ends by itself: %s', (cue) => {
    // TVAUDIO-01 AC 1, AD-032: the chiptune notes of the beep, from the context's now, straight to the speakers.
    const context = fakeAudioContext('running');

    createAudio(() => context).play(cue, 100, false);

    const played = playedNotes(context);
    const startS = context.currentTime;
    expect(played).toEqual(scheduled(BEEPS[cue], startS));
    expect(Math.max(...played.map((note) => note.stopS!)) - startS).toBeLessThanOrEqual(0.5);
    for (const output of context.outputs) expect(output.target).toBe(context.destination);
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

  test('plays the check of the shared recipe at the room volume', () => {
    // WORDCTL-01 AC 15: the notes of CHECK_SOUND, the phone's "check", from the context's now; the room's mute silences it.
    const context = fakeAudioContext('running');
    const audio = createAudio(() => context);

    audio.play('check', 100, false);
    const fullVolume = context.outputs.map((output) => output.gain.peak);
    audio.play('check', 50, false);
    const halfVolume = context.outputs.slice(CHECK_SOUND.length).map((output) => output.gain.peak);
    audio.play('check', 100, true);

    const check = scheduled(CHECK_SOUND, context.currentTime);
    expect(playedNotes(context)).toEqual([...check, ...check]);
    const effectPeak = effectsPeakGain(100);
    expect(fullVolume).toHaveLength(CHECK_SOUND.length);
    fullVolume.forEach((peak, index) => expect(peak).toBeCloseTo(effectPeak * CHECK_SOUND[index]!.gain));
    halfVolume.forEach((peak, index) => expect(peak).toBeCloseTo(fullVolume[index]! / 2));
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
    expect(context.oscillators).toHaveLength(BEEPS['round-start'].length);
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
