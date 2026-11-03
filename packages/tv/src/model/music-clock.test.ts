import { describe, expect, test } from 'vitest';
import { FAST_TEMPO, NORMAL_TEMPO } from './music.ts';
import { advanceMusic, INITIAL_MUSIC_CLOCK, type MusicClock } from './music-clock.ts';

/** The clock after playing `track` for `ms` at `tempo`, once it turned to it. */
function play(clock: MusicClock, track: MusicClock['track'], ms: number, tempo = NORMAL_TEMPO): MusicClock {
  return advanceMusic(advanceMusic(clock, track, 0, tempo), track, ms, tempo);
}

describe('advanceMusic', () => {
  test('moves the track playing along its score by the real time and the tempo', () => {
    const atNormal = play(INITIAL_MUSIC_CLOCK, 'match', 2_000);
    const atFast = play(INITIAL_MUSIC_CLOCK, 'match', 2_000, FAST_TEMPO);

    expect(atNormal.positionsS.match).toBeCloseTo(2);
    expect(atFast.positionsS.match).toBeCloseTo(3);
    expect(atNormal.positionsS.lobby).toBe(0);
  });

  test('resumes the match music where it stopped after a result', () => {
    // A round: 10 s at the normal tempo, then 4 s at 1.5 times, which go 6 s along the score.
    let clock = play(INITIAL_MUSIC_CLOCK, 'match', 10_000);
    clock = advanceMusic(clock, 'match', 4_000, FAST_TEMPO);
    expect(clock.positionsS.match).toBeCloseTo(16);

    // The result: the jingle plays and the match stands still.
    clock = advanceMusic(clock, 'jingle', 0, NORMAL_TEMPO);
    clock = advanceMusic(clock, 'jingle', 20_000, NORMAL_TEMPO);
    expect(clock.positionsS.match).toBeCloseTo(16);

    // The next countdown goes on from there, at the normal tempo.
    clock = advanceMusic(clock, 'match', 100, NORMAL_TEMPO);
    expect(clock.track).toBe('match');
    expect(clock.positionsS.match).toBeCloseTo(16);
    clock = advanceMusic(clock, 'match', 1_000, NORMAL_TEMPO);
    expect(clock.positionsS.match).toBeCloseTo(17);
  });

  test('starts the jingle and the finale from the top on each result', () => {
    let clock = play(INITIAL_MUSIC_CLOCK, 'lobby', 5_000);
    clock = play(clock, 'jingle', 12_000);
    expect(clock.positionsS.jingle).toBeCloseTo(12);
    clock = play(clock, 'finale', 7_000);
    expect(clock.positionsS.finale).toBeCloseTo(7);

    clock = advanceMusic(clock, 'match', 0, NORMAL_TEMPO);
    clock = advanceMusic(clock, 'jingle', 0, NORMAL_TEMPO);
    expect(clock.positionsS.jingle).toBe(0);
    clock = advanceMusic(clock, 'finale', 0, NORMAL_TEMPO);
    expect(clock.positionsS.finale).toBe(0);

    // The lobby goes on from where it stopped.
    clock = play(clock, 'lobby', 1_000);
    expect(clock.positionsS.lobby).toBeCloseTo(6);
  });

  test('keeps the jingle going while it stays on the screen', () => {
    let clock = play(INITIAL_MUSIC_CLOCK, 'jingle', 1_000);
    clock = advanceMusic(clock, 'jingle', 1_000, NORMAL_TEMPO);

    expect(clock.positionsS.jingle).toBeCloseTo(2);
  });

  test('stands every track still in silence', () => {
    let clock = play(INITIAL_MUSIC_CLOCK, 'lobby', 1_000);
    clock = advanceMusic(clock, null, 500, NORMAL_TEMPO);
    clock = advanceMusic(clock, null, 9_000, NORMAL_TEMPO);

    expect(clock.track).toBeNull();
    expect(clock.positionsS).toEqual({ lobby: 1.5, match: 0, jingle: 0, finale: 0 });
  });
});
