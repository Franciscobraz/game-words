import { describe, expect, test } from 'vitest';
import { findPath } from '../path.ts';
import { countsDeadline, flushCounts } from './counts.ts';
import { step } from './machine.ts';
import type { RoomState } from './state.ts';
import { fakeDeps, makePlayer, message, pending, playerConn, roomWith, sentTo, TV_TOKEN } from './test-helpers.ts';

const deps = fakeDeps();

const BOARD = [
  ['c', 'a', 't', 's'],
  ['d', 'o', 'g', 'e'],
  ['b', 'i', 'r', 'd'],
  ['f', 'u', 'n', 'k'],
];
const WORDS = ['bid', 'cat', 'dog', 'fun', 'rid'];
const path = (word: string) => findPath(BOARD, word)!;

/** A round with alice and bob playing and the TV connected as `c-tv`. */
function inRound(extra: Partial<RoomState> = {}): RoomState {
  return roomWith([makePlayer('p1'), makePlayer('p2', { color: '#E53935' })], {
    phase: 'round',
    tvConn: 'c-tv',
    tvOfflineSince: null,
    round: { id: 1, board: BOARD, startsAt: 0, endsAt: 120_000, salt: 'salt' },
    solutions: { words: WORDS, prefixes: new Uint8Array(WORDS.length * 6) },
    ...extra,
  });
}

function submit(state: RoomState, index: number, words: string[], now: number) {
  return step(state, message(playerConn(state.players[index]!), { type: 'submit', paths: words.map(path) }), now, deps);
}

describe('tv counts', () => {
  test('sends tv counts at most once per second when changed', () => {
    const t = 20_000;
    // The first accepted word goes out at once.
    const first = submit(inRound(), 0, ['cat'], t);
    expect(sentTo(first.effects, 'c-tv')).toEqual([
      {
        type: 'counts',
        counts: [
          { playerId: 'p1', count: 1 },
          { playerId: 'p2', count: 0 },
        ],
      },
    ]);
    // 999 ms later another accepted word waits for the flush deadline.
    const second = submit(first.state, 1, ['dog', 'fun'], t + 999);
    expect(sentTo(second.effects, 'c-tv')).toEqual([]);
    expect(countsDeadline(second.state)).toBe(t + 1000);
    expect(flushCounts(second.state, t + 999).effects).toEqual([]);
    const flushed = flushCounts(second.state, t + 1000);
    expect(sentTo(flushed.effects, 'c-tv')).toEqual([
      {
        type: 'counts',
        counts: [
          { playerId: 'p1', count: 1 },
          { playerId: 'p2', count: 2 },
        ],
      },
    ]);
    // Nothing changed since: nothing goes out and no flush is due.
    expect(countsDeadline(flushed.state)).toBeNull();
    expect(flushCounts(flushed.state, t + 5000).effects).toEqual([]);
    const rejected = submit(flushed.state, 0, ['cat'], t + 6000);
    expect(sentTo(rejected.effects, 'c-tv')).toEqual([]);
    expect(countsDeadline(rejected.state)).toBeNull();
    // Counts never carry words.
    const json = JSON.stringify([...sentTo(first.effects, 'c-tv'), ...sentTo(flushed.effects, 'c-tv')]);
    for (const w of WORDS) expect(json, w).not.toContain(w);
  });

  // The exact limit after a send at t (L-001).
  test.each([
    [999, 0],
    [1000, 1],
  ])('a word accepted %i ms after the last send leaves %i counts message', (delay, sends) => {
    const first = submit(inRound(), 0, ['cat'], 20_000);
    const next = submit(first.state, 1, ['dog'], 20_000 + delay);
    expect(sentTo(next.effects, 'c-tv').filter((m) => m.type === 'counts')).toHaveLength(sends);
  });

  test('sends nothing while the TV is away', () => {
    const r = submit(inRound({ tvConn: null, tvOfflineSince: 0 }), 0, ['cat'], 20_000);
    expect(r.effects.filter((e) => e.kind === 'send' && e.to.role === 'tv')).toEqual([]);
    expect(countsDeadline(r.state)).toBeNull();
  });

  test('a TV that comes back mid-round gets the counts after the welcome', () => {
    const played = submit(inRound({ tvConn: null, tvOfflineSince: 0 }), 0, ['cat', 'dog'], 20_000).state;
    const r = step(played, message(pending('c-tv2'), { type: 'hello', role: 'tv', token: TV_TOKEN }), 21_000, deps);
    const sent = sentTo(r.effects, 'c-tv2');
    expect(sent.map((m) => m.type)).toEqual(['welcome', 'counts']);
    expect(sent[1]).toEqual({
      type: 'counts',
      counts: [
        { playerId: 'p1', count: 2 },
        { playerId: 'p2', count: 0 },
      ],
    });
    expect(countsDeadline(r.state)).toBeNull();
  });
});
