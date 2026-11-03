import { DEFAULT_SETTINGS, type RoundInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { FAST_TEMPO, matchTempo, musicTrack, NORMAL_TEMPO } from './music.ts';
import { INITIAL_VIEW, type RoomView } from './room-view.ts';
import type { Screen } from './screen.ts';

const STARTS_AT = 100_000;
const ENDS_AT = STARTS_AT + 120_000;
const ROUND: RoundInfo = { id: 1, index: 0, board: [['A']], startsAt: STARTS_AT, endsAt: ENDS_AT };
const IN_ROUND: RoomView = { ...INITIAL_VIEW, code: 'KBXT', phase: 'round', settings: DEFAULT_SETTINGS, round: ROUND };
const MUSIC_OFF = { ...DEFAULT_SETTINGS, music: false };

const ALL_SCREENS: readonly Screen[] = ['opening', 'open-failed', 'lobby', 'countdown', 'round', 'words', 'result', 'expired', 'replaced'];

describe('musicTrack', () => {
  test('plays the lobby music on the lobby, the opening and the expired room', () => {
    expect(musicTrack('lobby', 'lobby', DEFAULT_SETTINGS)).toBe('lobby');
    expect(musicTrack('opening', null, null)).toBe('lobby');
    expect(musicTrack('expired', 'lobby', DEFAULT_SETTINGS)).toBe('lobby');
  });

  test('plays the lobby music when the room could not be opened', () => {
    expect(musicTrack('open-failed', null, null)).toBe('lobby');
  });

  test('plays the match music on the countdown, the round, the time up and the words', () => {
    // "Tempo!" sits over the board of the round, on the `round` screen, in the phase `round` or `words`.
    expect(musicTrack('countdown', 'round', DEFAULT_SETTINGS)).toBe('match');
    expect(musicTrack('round', 'round', DEFAULT_SETTINGS)).toBe('match');
    expect(musicTrack('round', 'words', DEFAULT_SETTINGS)).toBe('match');
    expect(musicTrack('words', 'words', DEFAULT_SETTINGS)).toBe('match');
  });

  test('plays the jingle on the result between rounds', () => {
    expect(musicTrack('result', 'results', DEFAULT_SETTINGS)).toBe('jingle');
  });

  test('plays the finale on the result of the last round', () => {
    expect(musicTrack('result', 'podium', DEFAULT_SETTINGS)).toBe('finale');
  });

  test('plays nothing on the replaced tab', () => {
    expect(musicTrack('replaced', 'round', DEFAULT_SETTINGS)).toBeNull();
  });

  test('plays no track on any screen with the music off', () => {
    for (const screen of ALL_SCREENS) {
      expect(musicTrack(screen, 'podium', MUSIC_OFF)).toBeNull();
      expect(musicTrack(screen, 'results', MUSIC_OFF)).toBeNull();
    }
  });
});

describe('matchTempo', () => {
  test('speeds the match music up 1.5 times from 15 seconds before the end', () => {
    expect(matchTempo(IN_ROUND, ENDS_AT - 15_001)).toBe(NORMAL_TEMPO);
    expect(matchTempo(IN_ROUND, ENDS_AT - 15_000)).toBe(FAST_TEMPO);
    expect(matchTempo(IN_ROUND, ENDS_AT - 1)).toBe(FAST_TEMPO);
    expect(FAST_TEMPO).toBe(1.5);
    // "Tempo!" and the words, in either phase, are back to the normal tempo.
    expect(matchTempo(IN_ROUND, ENDS_AT)).toBe(NORMAL_TEMPO);
    expect(matchTempo({ ...IN_ROUND, phase: 'words' }, ENDS_AT)).toBe(NORMAL_TEMPO);
    expect(matchTempo({ ...IN_ROUND, phase: 'words' }, ENDS_AT + 30_000)).toBe(NORMAL_TEMPO);
  });

  test('brings the match music back to its tempo on the next countdown', () => {
    const nextStartsAt = ENDS_AT + 60_000;
    const nextRound: RoundInfo = { ...ROUND, id: 2, index: 1, startsAt: nextStartsAt, endsAt: nextStartsAt + 120_000 };

    expect(matchTempo({ ...IN_ROUND, round: nextRound }, nextStartsAt - 3_000)).toBe(NORMAL_TEMPO);
  });

  test('keeps the normal tempo away from a round', () => {
    expect(matchTempo({ ...IN_ROUND, phase: 'lobby' }, ENDS_AT - 1)).toBe(NORMAL_TEMPO);
    expect(matchTempo({ ...IN_ROUND, phase: 'results' }, ENDS_AT - 1)).toBe(NORMAL_TEMPO);
    expect(matchTempo({ ...IN_ROUND, round: null }, ENDS_AT - 1)).toBe(NORMAL_TEMPO);
  });
});
