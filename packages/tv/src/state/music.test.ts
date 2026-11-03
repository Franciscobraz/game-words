import { CHECK_SOUND, DEFAULT_SETTINGS, type RoundInfo, type Settings } from '@bwords/core';
import { signal } from '@preact/signals';
import { describe, expect, test } from 'vitest';
import { createAudio } from '../device/audio.ts';
import { createMusicPlayer } from '../device/music.ts';
import type { RevealPlan } from '../model/reveal.ts';
import { INITIAL_VIEW, type RoomView } from '../model/room-view.ts';
import type { Screen } from '../model/screen.ts';
import { LOBBY_SONG, MATCH_SONG, notesInWindow } from '../model/songs.ts';
import { fakeAudioContext, type FakeAudioContext, type FakeGain } from '../testing/fake-audio.ts';
import { createMusicStore } from './music.ts';
import { createSoundStore } from './sound.ts';

const STARTS_AT = 100_000;
const ENDS_AT = STARTS_AT + 120_000;
const ROUND: RoundInfo = { id: 1, index: 0, board: [['A']], startsAt: STARTS_AT, endsAt: ENDS_AT };
const IN_ROUND: RoomView = { ...INITIAL_VIEW, code: 'KBXT', phase: 'round', settings: DEFAULT_SETTINGS, round: ROUND };
const IN_LOBBY: RoomView = { ...IN_ROUND, phase: 'lobby', round: null };

/** The TV's sounds and music over one fake context, on `screen`, with a real clock the test moves. */
function setup(initial: RoomView, initialScreen: Screen) {
  const context = fakeAudioContext('running');
  const room = signal(initial);
  const screen = signal(initialScreen);
  let realMs = 0;
  const sound = createSoundStore({
    audio: createAudio(() => context),
    room,
    plan: signal<RevealPlan | null>(null),
    clockSynced: signal(true),
  });
  const music = createMusicStore({ player: createMusicPlayer(context), screen, room, now: () => realMs });
  /** Moves the real clock and the server clock by `ms` and reads them. */
  function advance(serverNow: number, ms = 100): void {
    realMs += ms;
    sound.tick(serverNow);
    music.tick(serverNow);
  }
  return { context, room, screen, sound, music, advance };
}

/** The frequencies of the notes that went through the gain of a track: the music. */
function musicNotes(context: FakeAudioContext): number[] {
  return context.oscillators.filter((oscillator) => isMusic(oscillator.target)).map((oscillator) => oscillator.frequency.value);
}

/** The frequencies of the sounds that went straight to the speakers: the effects. */
function effects(context: FakeAudioContext): number[] {
  return context.oscillators
    .filter((oscillator) => (oscillator.target as FakeGain | null)?.target === context.destination)
    .map((oscillator) => oscillator.frequency.value);
}

function isMusic(target: unknown): boolean {
  const noteGain = target as FakeGain | null;
  return noteGain?.target !== undefined && noteGain.target !== null && 'gain' in noteGain.target;
}

describe('createMusicStore', () => {
  test('silences every track and leaves the other sounds playing with the music off', () => {
    // MUSIC-01 AC 13: the round's start, the last seconds, the whistle and the check go on.
    const off: Settings = { ...DEFAULT_SETTINGS, music: false };
    const { context, screen, sound, advance } = setup({ ...IN_ROUND, settings: off }, 'countdown');

    advance(STARTS_AT - 100);
    screen.value = 'round';
    advance(STARTS_AT);
    advance(ENDS_AT - 10_000);
    advance(ENDS_AT);
    sound.play('check');

    expect(musicNotes(context)).toEqual([]);
    expect(effects(context).length).toBe(3 + CHECK_SOUND.length);

    // The same round with the music on plays the match music beside the same sounds.
    const on = setup(IN_ROUND, 'countdown');
    on.advance(STARTS_AT - 100);
    on.screen.value = 'round';
    on.advance(STARTS_AT);
    on.advance(ENDS_AT - 10_000);
    on.advance(ENDS_AT);
    on.sound.play('check');
    expect(musicNotes(on.context).length).toBeGreaterThan(0);
    expect(effects(on.context).length).toBe(3 + CHECK_SOUND.length);
  });

  test('plays the song of the screen from its start', () => {
    const { context, advance } = setup(IN_LOBBY, 'lobby');

    advance(STARTS_AT, 0);

    expect(musicNotes(context)).toEqual(notesInWindow(LOBBY_SONG, 0, 0.3).map((note) => note.frequencyHz));
  });

  test('moves the music by the real time and the tempo of the round', () => {
    // The last 15 s of the round: 1 s of real time goes 1.5 s along the score (MUSIC-01 AC 3).
    const { context, advance } = setup(IN_ROUND, 'round');
    advance(ENDS_AT - 16_000, 0);
    const before = context.oscillators.length;

    for (let tick = 1; tick <= 10; tick++) advance(ENDS_AT - 15_000 + tick * 100);

    // The score was scheduled up to 0.3 s ahead, then up to 1.5 + 0.45 s.
    expect(context.oscillators.length - before).toBe(notesInWindow(MATCH_SONG, 0.3, 1.5 + 0.45).length);
  });

  test('keeps the music still when the server clock jumps', () => {
    const { context, advance } = setup(IN_LOBBY, 'lobby');
    advance(STARTS_AT, 0);
    const scheduled = context.oscillators.length;

    advance(STARTS_AT + 60_000, 0);

    expect(context.oscillators).toHaveLength(scheduled);
  });
});
