import { describe, expect, test } from 'vitest';
import { step } from './machine.ts';
import type { Phase } from './protocol.ts';
import { sanitizeLoadedSettings } from './settings.ts';
import { DEFAULT_SETTINGS } from './state.ts';
import { allMessages, fakeDeps, makePlayer, message, playerConn, roomWith, run, sentTo } from './test-helpers.ts';

const deps = fakeDeps();

describe('settings command', () => {
  test('applies a valid change in the lobby and broadcasts it', () => {
    const state = roomWith([makePlayer('p1'), makePlayer('p2')]);
    const patch = { size: 6, seconds: 90, rounds: 3, minLength: 4, filterProfanity: false, volume: 40, muted: true };
    const r = step(state, message(playerConn(state.players[0]!), { type: 'settings', patch }), 7000, deps);
    const expected = { ...DEFAULT_SETTINGS, ...patch };
    expect(r.state.settings).toEqual(expected);
    expect(sentTo(r.effects, '*')).toEqual([{ type: 'settings', settings: expected }]);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
    // Changing settings is a host action for the idle timeout.
    expect(r.state.lastActionAt).toBe(7000);
    // A later change keeps the earlier ones.
    const again = step(r.state, message(playerConn(state.players[0]!), { type: 'settings', patch: { size: 5 } }), 0, deps);
    expect(again.state.settings).toEqual({ ...expected, size: 5 });
  });

  test('rejects an invalid change with bad-settings and changes nothing', () => {
    const state = roomWith([makePlayer('p1')]);
    const r = step(state, message(playerConn(state.players[0]!), { type: 'settings', patch: { size: 5, seconds: 210 } }), 0, deps);
    expect(r.state).toBe(state);
    expect(r.state.settings).toEqual(DEFAULT_SETTINGS);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'bad-settings' }]);
  });

  const OUTSIDE: Phase[] = ['round', 'results', 'podium'];

  test.each(OUTSIDE)('rejects settings changes outside the lobby: %s', (phase) => {
    const state = roomWith([makePlayer('p1')], { phase });
    const r = step(state, message(playerConn(state.players[0]!), { type: 'settings', patch: { size: 5 } }), 0, deps);
    expect(r.state).toBe(state);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'wrong-phase' }]);
  });
});

describe('fast mode', () => {
  test('refuses fast mode as an unknown setting', () => {
    // FAST-01 AC 1: on or off, alone or beside a valid change, the patch changes nothing.
    const state = roomWith([makePlayer('p1')]);
    const host = playerConn(state.players[0]!);
    for (const patch of [{ fastMode: true }, { fastMode: false }, { size: 5, fastMode: true }]) {
      const r = step(state, message(host, { type: 'settings', patch }), 0, deps);
      expect(r.state).toBe(state);
      expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'bad-settings' }]);
    }
  });

  test('drops fast mode from stored settings', () => {
    // FAST-01 AC 4: a room saved before AD-020 keeps its other settings.
    const stored = { ...DEFAULT_SETTINGS, size: 6 as const, volume: 40, fastMode: true };
    const settings = sanitizeLoadedSettings(stored);
    expect(settings).not.toHaveProperty('fastMode');
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, size: 6, volume: 40 });
    // Settings without the field come back the same.
    expect(sanitizeLoadedSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
  });
});

describe('music', () => {
  test('turns the music on in a room stored without it', () => {
    // MUSIC-01 AC 9: a room saved before the music keeps its other settings.
    const { music: _absent, ...stored } = { ...DEFAULT_SETTINGS, size: 5 as const, volume: 30 };

    const settings = sanitizeLoadedSettings(stored);

    expect(settings).toEqual({ ...DEFAULT_SETTINGS, size: 5, volume: 30, music: true });
    // A stored choice is kept.
    expect(sanitizeLoadedSettings({ ...DEFAULT_SETTINGS, music: false }).music).toBe(false);
  });

  test('changes the music only in the lobby', () => {
    // Edge Cases: the change made in the lobby holds for the next match; MUSIC-01 AC 8.
    const lobby = roomWith([makePlayer('p1'), makePlayer('p2')]);
    const host = playerConn(lobby.players[0]!);

    const off = run(lobby, [message(host, { type: 'settings', patch: { music: false } }), message(host, { type: 'start' })]);

    expect(sentTo(off.effects, '*')).toContainEqual({ type: 'settings', settings: { ...DEFAULT_SETTINGS, music: false } });
    expect(off.state.settings.music).toBe(false);

    for (const phase of ['round', 'words', 'results', 'podium'] as const) {
      const state = roomWith([makePlayer('p1')], { phase });
      const r = step(state, message(playerConn(state.players[0]!), { type: 'settings', patch: { music: true } }), 0, deps);
      expect(r.state, phase).toBe(state);
      expect(allMessages(r.effects), phase).toEqual([{ type: 'error', code: 'wrong-phase' }]);
    }

    const notBool = step(lobby, message(host, { type: 'settings', patch: { music: 'off' } }), 0, deps);
    expect(notBool.state).toBe(lobby);
    expect(allMessages(notBool.effects)).toEqual([{ type: 'error', code: 'bad-settings' }]);
  });
});
