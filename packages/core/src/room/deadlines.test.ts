import { describe, expect, test } from 'vitest';
import { nextDeadline } from './deadlines.ts';
import { step } from './machine.ts';
import type { ServerMessage } from './protocol.ts';
import { createRoom, type RoomState } from './state.ts';
import {
  allMessages,
  fakeDeps,
  guest,
  makePack,
  makePlayer,
  message,
  pending,
  playerConn,
  roomWith,
  sentTo,
  TV_TOKEN,
} from './test-helpers.ts';

const deps = fakeDeps(makePack({ words: ['cat'] }));
const MIN = 60_000;
const alarm = (state: RoomState, now: number) => step(state, { kind: 'alarm' }, now, deps);
const hostOf = (msgs: ServerMessage[]) => (msgs.find((m) => m.type === 'players') as { hostId: string } | undefined)?.hostId;

/** A lobby with the TV connected and recent activity, so only the rule under test is due. */
function lobby(players = [makePlayer('p1'), makePlayer('p2'), makePlayer('p3')], extra: Partial<RoomState> = {}): RoomState {
  return roomWith(players, { tvConn: 'c-tv', tvOfflineSince: null, lastActionAt: 100_000, ...extra });
}

describe('host handoff', () => {
  test('hands the host role over after 30 s offline', () => {
    const away = makePlayer('p2', { connected: false, connId: null });
    const state = lobby([makePlayer('p1'), away, makePlayer('p3')]);
    const t0 = 100_000;
    const offline = step(state, { kind: 'disconnect', conn: playerConn(state.players[0]!) }, t0, deps).state;
    expect(nextDeadline(offline)).toBe(t0 + 30_000);
    // At 29 999 ms the host keeps the role.
    const early = alarm(offline, t0 + 29_999);
    expect(early.state.hostId).toBe('p1');
    expect(early.effects).toEqual([]);
    // At 30 000 ms it goes to the next connected player in joining order, skipping the disconnected p2.
    const r = alarm(offline, t0 + 30_000);
    expect(r.state.hostId).toBe('p3');
    expect(hostOf(sentTo(r.effects, '*'))).toBe('p3');
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
    expect(r.state.players.filter((p) => p.id === r.state.hostId)).toHaveLength(1);
    expect(nextDeadline(r.state)).toBe(100_000 + 30 * MIN);
  });

  test.each([
    ['p2', 'p3'],
    ['p3', 'p1'],
  ])('hands the host role over after 30 s offline: from %s to %s, wrapping around', (from, to) => {
    const state = lobby(undefined, { hostId: from });
    const host = state.players.find((p) => p.id === from)!;
    const offline = step(state, { kind: 'disconnect', conn: playerConn(host) }, 0, deps).state;
    expect(alarm(offline, 30_000).state.hostId).toBe(to);
  });

  test('gives the host role to the first player who reconnects', () => {
    const state = lobby([makePlayer('p1'), makePlayer('p2', { connected: false, connId: null }), makePlayer('p3')]);
    let s = step(state, { kind: 'disconnect', conn: playerConn(state.players[2]!) }, 90_000, deps).state;
    s = step(s, { kind: 'disconnect', conn: playerConn(state.players[0]!) }, 100_000, deps).state;
    // Nobody is connected when the 30 s are up: the host keeps the role for now.
    const due = alarm(s, 130_000);
    expect(due.state.hostId).toBe('p1');
    expect(due.state.hostHandoffDue).toBe(true);
    expect(nextDeadline(due.state)).toBe(100_000 + 30 * MIN);
    // The first to come back, here p2, takes it.
    const back = step(due.state, message(pending('c-p2'), { type: 'hello', role: 'player', token: 'secret-p2' }), 200_000, deps);
    expect(back.state.hostId).toBe('p2');
    expect(back.state.hostHandoffDue).toBe(false);
    expect(hostOf(sentTo(back.effects, '*'))).toBe('p2');
    // Whoever comes next does not.
    const later = step(back.state, message(pending('c-p1'), { type: 'hello', role: 'player', token: 'secret-p1' }), 200_001, deps);
    expect(later.state.hostId).toBe('p2');
  });

  test('gives the host role to the first player who reconnects: a newcomer counts', () => {
    const state = lobby([makePlayer('p1')]);
    const offline = step(state, { kind: 'disconnect', conn: playerConn(state.players[0]!) }, 0, deps).state;
    const due = alarm(offline, 30_000).state;
    const r = step(due, message(guest('c-g'), { type: 'join', nickname: 'Dan', color: '#E53935' }), 40_000, deps);
    expect(r.state.hostId).toBe('p2');
    expect(r.state.hostHandoffDue).toBe(false);
  });

  test('keeps a host who reconnects within 30 s', () => {
    const state = lobby();
    const offline = step(state, { kind: 'disconnect', conn: playerConn(state.players[0]!) }, 0, deps).state;
    const back = step(offline, message(pending('c-p1b'), { type: 'hello', role: 'player', token: 'secret-p1' }), 29_999, deps).state;
    expect(back.hostOfflineSince).toBeNull();
    const r = alarm(back, 30_000);
    expect(r.state.hostId).toBe('p1');
    expect(r.effects).toEqual([]);
    expect(nextDeadline(back)).toBe(100_000 + 30 * MIN);
  });
});

describe('round deadline', () => {
  const BOARD = [
    ['c', 'a', 't', 's'],
    ['d', 'o', 'g', 'e'],
    ['b', 'i', 'r', 'd'],
    ['f', 'u', 'n', 'k'],
  ];

  test('keeps the round running while the TV is gone', () => {
    const state = lobby([makePlayer('p1', { found: ['cat'] })], {
      phase: 'round',
      lastActionAt: 10_000,
      round: { id: 1, board: BOARD, startsAt: 10_000, endsAt: 130_000, salt: 'salt' },
      solutions: { words: ['cat'], prefixes: new Uint8Array(6) },
    });
    const gone = step(state, { kind: 'disconnect', conn: { id: 'c-tv', role: 'tv' } }, 50_000, deps).state;
    // Neither the timer nor the round end move.
    expect(gone.round).toEqual(state.round);
    expect(nextDeadline(gone)).toBe(130_300);
    expect(alarm(gone, 130_299).state.phase).toBe('round');
    const r = alarm(gone, 130_300);
    expect(r.state.phase).toBe('results');
    expect(allMessages(r.effects).map((m) => m.type)).toEqual(['round-results', 'players']);
    // Nothing is addressed to the absent TV.
    expect(r.effects.some((e) => e.kind === 'send' && e.to.role === 'tv')).toBe(false);
  });

  test('flushes the TV counts on the alarm', () => {
    const state = lobby([makePlayer('p1', { found: ['cat'] })], {
      phase: 'round',
      round: { id: 1, board: BOARD, startsAt: 10_000, endsAt: 130_000, salt: 'salt' },
      solutions: { words: ['cat'], prefixes: new Uint8Array(6) },
      tvCounts: { dirty: true, lastSentAt: 20_000 },
    });
    expect(nextDeadline(state)).toBe(21_000);
    const r = alarm(state, 21_000);
    expect(sentTo(r.effects, 'c-tv')).toEqual([{ type: 'counts', counts: [{ playerId: 'p1', count: 1 }] }]);
    expect(nextDeadline(r.state)).toBe(130_300);
  });
});

describe('expiry', () => {
  test('closes an idle room', () => {
    // The last action is a join at 1000; a clock sync later does not count.
    const joined = step(
      roomWith([], { tvConn: 'c-tv', tvOfflineSince: null }),
      message(guest('c-g'), { type: 'join', nickname: 'Ana', color: '#E53935' }),
      1000,
      deps,
    ).state;
    const synced = step(joined, message(playerConn(joined.players[0]!), { type: 'time', clientTime: 1 }), 20 * MIN, deps).state;
    const deadline = 1000 + 30 * MIN;
    expect(nextDeadline(synced)).toBe(deadline);
    for (const now of [deadline - MIN, deadline - 1]) {
      const r = alarm(synced, now);
      expect(r.state.closed, String(now)).toBe(false);
      expect(r.effects).toEqual([]);
    }
    const r = alarm(synced, deadline);
    expect(r.effects).toEqual([{ kind: 'broadcast', msg: { type: 'closed', reason: 'idle' } }, { kind: 'close-room' }]);
    expect(r.state.closed).toBe(true);
    expect(nextDeadline(r.state)).toBeNull();
  });

  test('closes an idle room: an action postpones it', () => {
    const state = lobby([makePlayer('p1')], { lastActionAt: 0 });
    const acted = step(state, message(playerConn(state.players[0]!), { type: 'settings', patch: { size: 5 } }), 10 * MIN, deps).state;
    expect(nextDeadline(acted)).toBe(40 * MIN);
    expect(alarm(acted, 30 * MIN).state.closed).toBe(false);
  });

  test('closes a room whose TV is gone', () => {
    const state = lobby([makePlayer('p1')]);
    const gone = step(state, { kind: 'disconnect', conn: { id: 'c-tv', role: 'tv' } }, 200_000, deps).state;
    const deadline = 200_000 + 10 * MIN;
    expect(nextDeadline(gone)).toBe(deadline);
    for (const now of [deadline - MIN, deadline - 1]) expect(alarm(gone, now).state.closed, String(now)).toBe(false);
    const r = alarm(gone, deadline);
    expect(r.effects).toEqual([{ kind: 'broadcast', msg: { type: 'closed', reason: 'tv-gone' } }, { kind: 'close-room' }]);
    expect(r.state.closed).toBe(true);
    // A TV back in time stops the clock.
    const back = step(gone, message(pending('c-tv2'), { type: 'hello', role: 'tv', token: TV_TOKEN }), deadline - 1, deps).state;
    expect(alarm(back, deadline).state.closed).toBe(false);
  });

  test('closes a room whose TV is gone: a new room counts from its creation', () => {
    const room = createRoom('ABCD', TV_TOKEN, 5000, { idleMin: 30, tvGoneMin: 10 });
    expect(nextDeadline(room)).toBe(5000 + 10 * MIN);
    expect(alarm(room, 5000 + 10 * MIN).effects).toContainEqual({ kind: 'close-room' });
  });

  test.each([
    ['idle', { idleMin: 0, tvGoneMin: 10 }, { tvConn: 'c-tv', tvOfflineSince: null }, 30 * MIN, 'idle'],
    ['TV gone', { idleMin: 30, tvGoneMin: 0 }, { tvConn: null, tvOfflineSince: 0 }, 10 * MIN, 'tv-gone'],
  ] as const)('never closes when a timeout is 0: %s', (_rule, config, extra, at, reason) => {
    const state = roomWith([makePlayer('p1')], { lastActionAt: 0, ...extra, config });
    const closedFor = { type: 'closed', reason };
    // With the rule at its default, the room would close at `at` for this reason.
    expect(allMessages(alarm({ ...state, config: { idleMin: 30, tvGoneMin: 10 } }, at).effects)).toEqual([closedFor]);
    // At 0 it never does, at that time or a year later.
    for (const now of [at, 365 * 24 * 60 * MIN]) {
      expect(allMessages(alarm(state, now).effects), String(now)).not.toContainEqual(closedFor);
    }
    expect(nextDeadline(state)).not.toBe(at);
    // With both at 0 nothing is ever due.
    expect(nextDeadline({ ...state, config: { idleMin: 0, tvGoneMin: 0 } })).toBeNull();
  });
});
