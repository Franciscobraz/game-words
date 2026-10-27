import { describe, expect, test } from 'vitest';
import { step } from './machine.ts';
import type { Phase } from './protocol.ts';
import { DEFAULT_SETTINGS } from './state.ts';
import { allMessages, fakeDeps, makePlayer, message, playerConn, roomWith, sentTo } from './test-helpers.ts';

const deps = fakeDeps();

describe('settings command', () => {
  test('applies a valid change in the lobby and broadcasts it', () => {
    const state = roomWith([makePlayer('p1'), makePlayer('p2')]);
    const patch = { size: 6, seconds: 90, rounds: 3, minLength: 4, filterProfanity: false, fastMode: true, volume: 40, muted: true };
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
