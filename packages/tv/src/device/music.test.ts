import { describe, expect, test } from 'vitest';
import type { MusicTrack } from '../model/music.ts';
import { LOBBY_SONG, MATCH_SONG, notesInWindow } from '../model/songs.ts';
import { fakeAudioContext, type FakeAudioContext, type FakeGain } from '../testing/fake-audio.ts';
import { effectsPeakGain } from './audio.ts';
import { createMusicPlayer, type MusicCue } from './music.ts';

const TRACKS: readonly MusicTrack[] = ['lobby', 'match', 'jingle', 'finale'];

const CUE: MusicCue = { track: 'lobby', positionS: 0, tempo: 1, volume: 80, muted: false };

/** The gains of the tracks: the ones that reach the speakers. */
function trackGains(context: FakeAudioContext): FakeGain[] {
  return context.outputs;
}

/** What each oscillator played, in seconds from now on the context's clock. */
function played(context: FakeAudioContext) {
  return context.oscillators.map((oscillator) => ({
    frequencyHz: oscillator.frequency.value,
    startS: oscillator.startedAt! - context.currentTime,
    durationS: oscillator.stoppedAt! - oscillator.startedAt!,
  }));
}

describe('createMusicPlayer', () => {
  test.each(TRACKS)('plays every track at half the gain of the effects: %s', (track) => {
    // MUSIC-01 AC 10: the gain of the track is half the peak of an effect at the same volume.
    const context = fakeAudioContext('running');
    const player = createMusicPlayer(context);

    player.play({ ...CUE, track, volume: 80 });

    const [trackGain] = trackGains(context);
    expect(trackGain!.gain.peak).toBeCloseTo(effectsPeakGain(80) / 2);
    expect(context.oscillators.length).toBeGreaterThan(0);
    for (const oscillator of context.oscillators) expect((oscillator.target as FakeGain).target).toBe(trackGain);

    const muted = fakeAudioContext('running');
    createMusicPlayer(muted).play({ ...CUE, track, muted: true });
    createMusicPlayer(muted).play({ ...CUE, track, volume: 0 });
    expect(muted.oscillators).toHaveLength(0);
  });

  test('follows the volume of the room on the gain of the track', () => {
    const context = fakeAudioContext('running');
    const player = createMusicPlayer(context);

    player.play({ ...CUE, volume: 100 });
    player.play({ ...CUE, positionS: 0.1, volume: 40 });

    const [trackGain] = trackGains(context);
    expect(trackGain!.gain.value).toBeCloseTo(effectsPeakGain(40) / 2);
  });

  test('schedules the notes a little ahead, each once', () => {
    const context = fakeAudioContext('running');
    const player = createMusicPlayer(context);

    const TICKS = 30;
    for (let tick = 0; tick < TICKS; tick++) player.play({ ...CUE, positionS: tick / 10 });

    // Every note from the start to 0.3 s ahead of the last position, in order, and no more.
    const lastPositionS = (TICKS - 1) / 10;
    const expected = notesInWindow(LOBBY_SONG, 0, lastPositionS + 0.3).map((note) => note.frequencyHz);
    expect(expected.length).toBeGreaterThan(2);
    expect(context.oscillators.map((oscillator) => oscillator.frequency.value)).toEqual(expected);
  });

  test('keeps the pitch and shortens the steps at 1.5 times the tempo', () => {
    // MUSIC-01 AC 3: the notes of 0.45 s of score fit in the 0.3 s ahead, at their own frequencies.
    const positionS = MATCH_SONG.notes[4]!.startS;
    const context = fakeAudioContext('running');

    createMusicPlayer(context).play({ ...CUE, track: 'match', positionS, tempo: 1.5 });

    const written = notesInWindow(MATCH_SONG, positionS, positionS + 0.45);
    expect(written.length).toBeGreaterThan(0);
    const heard = played(context);
    expect(heard).toHaveLength(written.length);
    heard.forEach((note, index) => {
      const score = written[index]!;
      expect(note.frequencyHz).toBe(score.frequencyHz);
      expect(note.startS).toBeCloseTo((score.startS - positionS) / 1.5);
      expect(note.durationS).toBeCloseTo(score.durationS / 1.5);
    });
  });

  test('starts after the unlock at the point the music would be', () => {
    // MUSIC-01 AC 15: the position moves while the sound is blocked, and nothing is scheduled.
    const context = fakeAudioContext('suspended');
    const player = createMusicPlayer(context);
    const unlockedAtS = LOBBY_SONG.notes[6]!.startS;

    for (let positionS = 0; positionS < unlockedAtS; positionS += 0.1) player.play({ ...CUE, positionS });
    expect(context.oscillators).toHaveLength(0);

    context.becomeRunning();
    player.play({ ...CUE, positionS: unlockedAtS });

    const written = notesInWindow(LOBBY_SONG, unlockedAtS, unlockedAtS + 0.3);
    expect(played(context).map((note) => note.frequencyHz)).toEqual(written.map((note) => note.frequencyHz));
    expect(played(context)[0]!.startS).toBeCloseTo(0);
  });

  test('fades the track out when another one starts or the music stops', () => {
    const context = fakeAudioContext('running');
    const player = createMusicPlayer(context);

    player.play(CUE);
    player.play({ ...CUE, track: 'match', positionS: 40 });
    const [lobbyGain, matchGain] = trackGains(context);
    expect(lobbyGain!.gain.rampedTo).toBeLessThan(0.001);
    expect(matchGain!.gain.rampedTo).toBeNull();

    player.play({ ...CUE, track: null, positionS: 40.1 });
    const soundsBeforeSilence = context.oscillators.length;
    player.play({ ...CUE, track: null, positionS: 40.2 });
    expect(matchGain!.gain.rampedTo).toBeLessThan(0.001);
    expect(context.oscillators).toHaveLength(soundsBeforeSilence);
  });

  test('does nothing without web audio', () => {
    expect(() => createMusicPlayer(null).play(CUE)).not.toThrow();
  });
});
