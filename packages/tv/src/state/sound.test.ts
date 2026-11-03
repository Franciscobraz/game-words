import type { RoundInfo, Settings } from '@bwords/core';
import { signal } from '@preact/signals';
import { describe, expect, test } from 'vitest';
import { createAudio } from '../device/audio.ts';
import type { RevealPlan } from '../model/reveal.ts';
import { INITIAL_VIEW, type RoomView } from '../model/room-view.ts';
import { fakeAudioContext } from '../testing/fake-audio.ts';
import { createSoundStore } from './sound.ts';

const STARTS_AT = 100_000;
const ENDS_AT = STARTS_AT + 120_000;
const ROUND: RoundInfo = { id: 1, index: 0, board: [['a']], startsAt: STARTS_AT, endsAt: ENDS_AT };
const SETTINGS: Settings = { size: 4, seconds: 120, rounds: 3, minLength: 3, filterProfanity: true, pack: 'pt-BR', volume: 50, muted: false, music: true };
const IN_ROUND: RoomView = { ...INITIAL_VIEW, code: 'KBXT', phase: 'round', settings: SETTINGS, round: ROUND };

/** The sound store over a fake context, in the room `initial`; the clock reads the server unless told otherwise. */
function setup(initial: RoomView = IN_ROUND, state = 'running', synced = true) {
  const context = fakeAudioContext(state);
  const room = signal(initial);
  const plan = signal<RevealPlan | null>(null);
  const clockSynced = signal(synced);
  const sound = createSoundStore({ audio: createAudio(() => context), room, plan, clockSynced });
  return { context, room, plan, clockSynced, sound };
}

describe('createSoundStore', () => {
  test('plays a cue when the clock crosses its instant, in the volume of the room', () => {
    const { context, sound } = setup();
    sound.tick(STARTS_AT - 1);
    expect(context.oscillators).toHaveLength(0);

    sound.tick(STARTS_AT);
    const halfVolume = context.loudestOutput();
    expect(context.oscillators).toHaveLength(1);

    const louder = setup({ ...IN_ROUND, settings: { ...SETTINGS, volume: 100 } });
    louder.sound.tick(STARTS_AT - 1);
    louder.sound.tick(STARTS_AT);
    expect(halfVolume).toBeCloseTo(louder.context.loudestOutput() / 2);
  });

  test('plays nothing with the room muted', () => {
    const { context, sound } = setup({ ...IN_ROUND, settings: { ...SETTINGS, muted: true } });

    sound.tick(STARTS_AT - 1);
    sound.tick(STARTS_AT);

    expect(context.oscillators).toHaveLength(0);
  });

  test('does not replay a cue on the first reading after a reload', () => {
    const { context, sound } = setup();

    sound.tick(ENDS_AT);
    sound.tick(ENDS_AT + 100);

    expect(context.oscillators).toHaveLength(0);
  });

  test('does not cross an instant twice when the clock moves back', () => {
    const { context, sound } = setup();

    sound.tick(ENDS_AT - 1);
    sound.tick(ENDS_AT);
    const afterWhistle = context.oscillators.length;
    expect(afterWhistle).toBeGreaterThan(0);
    sound.tick(ENDS_AT - 5);
    sound.tick(ENDS_AT + 5);

    expect(context.oscillators).toHaveLength(afterWhistle);
  });

  test('plays the start of the round with the TV clock two minutes ahead before the first sample', () => {
    const { context, clockSynced, sound } = setup(IN_ROUND, 'running', false);
    const tvClockAheadMs = 120_000;
    sound.tick(STARTS_AT - 1_000 + tvClockAheadMs);

    clockSynced.value = true;
    sound.tick(STARTS_AT - 1);
    sound.tick(STARTS_AT);

    expect(context.oscillators).toHaveLength(1);
  });

  test('plays the start of the scroll from the plan', () => {
    const { context, room, plan, sound } = setup({ ...IN_ROUND, phase: 'round' });
    const wordsStartAt = ENDS_AT + 2_000;
    sound.tick(ENDS_AT + 100);
    room.value = { ...IN_ROUND, phase: 'results' };
    plan.value = { wordsStartAt, resultShownAt: null };

    sound.tick(wordsStartAt - 1);
    expect(context.oscillators).toHaveLength(0);
    sound.tick(wordsStartAt);

    expect(context.oscillators).toHaveLength(1);
  });

  test('plays a cue asked for now, in the volume and mute of the room', () => {
    // WORDCTL-01 AC 15: the list asks for its "check" whenever a word becomes highlighted.
    const { context, room, sound } = setup();

    sound.play('check');
    const played = context.oscillators.length;
    room.value = { ...IN_ROUND, settings: { ...SETTINGS, muted: true } };
    sound.play('check');

    expect(played).toBeGreaterThan(0);
    expect(context.oscillators).toHaveLength(played);
  });

  test('takes the notice away after unlocking', async () => {
    const { sound } = setup(IN_ROUND, 'suspended');
    expect(sound.blocked.value).toBe(true);

    sound.unlock();
    await Promise.resolve();
    await Promise.resolve();

    expect(sound.blocked.value).toBe(false);
  });

  test('takes the notice away when the browser lets the sound play by itself', () => {
    const { context, sound } = setup(IN_ROUND, 'suspended');

    context.becomeRunning();

    expect(sound.blocked.value).toBe(false);
  });

  test('has no notice without web audio', () => {
    const sound = createSoundStore({ audio: createAudio(() => null), room: signal(IN_ROUND), plan: signal(null), clockSynced: signal(true) });

    expect(sound.blocked.value).toBe(false);
  });
});
