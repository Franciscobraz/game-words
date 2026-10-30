import type { CloseReason, RoundInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import type { RevealStage } from './reveal.ts';
import { INITIAL_VIEW, type RoomView } from './room-view.ts';
import { type Screen, tvScreen } from './screen.ts';

const STARTS_AT = 10_000;

const ROUND: RoundInfo = {
  id: 7,
  index: 0,
  board: [
    ['A', 'B'],
    ['C', 'D'],
  ],
  startsAt: STARTS_AT,
  endsAt: 130_000,
};

const LOBBY: RoomView = { ...INITIAL_VIEW, code: 'KBXT', phase: 'lobby' };
const IN_ROUND: RoomView = { ...LOBBY, phase: 'round', round: ROUND };
const AFTER_ROUND: RoomView = { ...LOBBY, phase: 'results', round: ROUND };

describe('tvScreen', () => {
  test('shows the opening screen before the first welcome', () => {
    expect(tvScreen(INITIAL_VIEW, 'creating', null, 0)).toBe('opening');
    expect(tvScreen(INITIAL_VIEW, 'connecting', null, 0)).toBe('opening');
  });

  test('says the room could not be opened when the creation failed', () => {
    expect(tvScreen(INITIAL_VIEW, 'create-failed', null, 0)).toBe('open-failed');
  });

  test('shows the lobby in the lobby phase', () => {
    expect(tvScreen(LOBBY, 'open', null, 0)).toBe('lobby');
  });

  test('shows the countdown until the instant before the start', () => {
    expect(tvScreen(IN_ROUND, 'open', null, STARTS_AT - 1)).toBe('countdown');
  });

  test('shows the countdown of a round phase without a round', () => {
    expect(tvScreen({ ...IN_ROUND, round: null }, 'open', null, STARTS_AT)).toBe('countdown');
  });

  test('shows the round from the instant of the start', () => {
    expect(tvScreen(IN_ROUND, 'open', null, STARTS_AT)).toBe('round');
  });

  test.each<[RevealStage, Screen]>([
    ['time-up', 'round'],
    ['words', 'words'],
    ['hold', 'words'],
    ['result', 'result'],
  ])('after a round, the stage %s shows the %s screen', (stage, screen) => {
    expect(tvScreen(AFTER_ROUND, 'open', stage, 200_000)).toBe(screen);
    expect(tvScreen({ ...AFTER_ROUND, phase: 'podium' }, 'open', stage, 200_000)).toBe(screen);
  });

  test('shows the result of a podium with no reveal running', () => {
    expect(tvScreen({ ...LOBBY, phase: 'podium' }, 'open', null, 0)).toBe('result');
  });

  test.each<[CloseReason, Screen]>([
    ['idle', 'expired'],
    ['tv-gone', 'expired'],
    ['replaced', 'replaced'],
    ['closed-by-host', 'opening'],
    ['kicked', 'opening'],
  ])('when the room closes with %s, shows the %s screen, in any phase', (reason, screen) => {
    expect(tvScreen({ ...IN_ROUND, closeReason: reason }, 'closed', null, STARTS_AT)).toBe(screen);
  });

  test('keeps the screen while the connection is down', () => {
    expect(tvScreen(IN_ROUND, 'reconnecting', null, STARTS_AT)).toBe('round');
    expect(tvScreen(LOBBY, 'offline', null, 0)).toBe('lobby');
  });
});
