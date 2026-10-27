import { describe, expect, test } from 'vitest';
import { findPath } from '../path.ts';
import { boardSolutions } from '../validate.ts';
import { step } from './machine.ts';
import type { SubmitResult } from './protocol.ts';
import type { RoomState } from './state.ts';
import { allMessages, fakeDeps, makePlayer, message, playerConn, richPack, roomWith, sentTo } from './test-helpers.ts';

const deps = fakeDeps();

const BOARD = [
  ['c', 'a', 't', 's'],
  ['d', 'o', 'g', 'e'],
  ['b', 'i', 'r', 'd'],
  ['f', 'u', 'n', 'k'],
];
const STARTS = 10_000;
const ENDS = 130_000;

/** The round's stored solutions, filtered as `prepareRound` stores them: profanity is out. */
const WORDS = [...boardSolutions(BOARD, richPack(), { minLength: 3, filterProfanity: true }).words].sort();
/** Distinct valid paths, one per stored word. */
const PATHS = WORDS.map((w) => findPath(BOARD, w)!);
const path = (word: string) => findPath(BOARD, word)!;

/** A round in progress: alice and bob play, carol watches. */
function inRound(): RoomState {
  return roomWith(
    [
      makePlayer('p1', { nickname: 'Alice' }),
      makePlayer('p2', { nickname: 'Bob', color: '#E53935' }),
      makePlayer('p3', { nickname: 'Carol', color: '#1E88E5', spectator: true }),
    ],
    {
      phase: 'round',
      round: { id: 1, board: BOARD, startsAt: STARTS, endsAt: ENDS, salt: 'salt' },
      solutions: { words: WORDS, prefixes: new Uint8Array(WORDS.length * 6) },
    },
  );
}

function submit(state: RoomState, playerIndex: number, paths: number[][], now: number) {
  const conn = playerConn(state.players[playerIndex]!);
  const r = step(state, message(conn, { type: 'submit', paths }), now, deps);
  const replies = sentTo(r.effects, conn.id);
  return { ...r, replies, results: (replies[0] as { results: SubmitResult[] } | undefined)?.results };
}

describe('submissions', () => {
  test('validates a batch in order and answers once', () => {
    const state = inRound();
    expect(WORDS).toContain('cat');
    const r = submit(state, 0, [path('cat'), [0, 10], [0, 1], path('cat'), path('dog')], 20_000);
    expect(r.replies).toEqual([
      {
        type: 'submit-result',
        results: [
          { ok: true, word: 'cat' },
          { ok: false, reason: 'invalid-path' },
          { ok: false, reason: 'too-short' },
          { ok: false, reason: 'already-found' },
          { ok: true, word: 'dog' },
        ],
      },
    ]);
    // Only the sender hears about it; nothing is broadcast.
    expect(allMessages(r.effects)).toHaveLength(1);
    expect(r.state.players[0]!.found).toEqual(['cat', 'dog']);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['found:p1'] });
    expect(r.state.lastActionAt).toBe(20_000);
  });

  test('a path that is not a stored solution is not-a-word', () => {
    // "cats" is a path on the board but not a word of the pack.
    const r = submit(inRound(), 0, [path('cats')], 20_000);
    expect(r.results).toEqual([{ ok: false, reason: 'not-a-word' }]);
    expect(r.effects.some((e) => e.kind === 'persist')).toBe(false);
  });

  // ROUND-01 AC 4 with the exact limits (L-001).
  test.each([
    ['1 ms before startsAt', STARTS - 1, { ok: false, reason: 'round-closed' }],
    ['at startsAt', STARTS, { ok: true, word: 'cat' }],
    ['at endsAt + 300 ms', ENDS + 300, { ok: true, word: 'cat' }],
    ['at endsAt + 301 ms', ENDS + 301, { ok: false, reason: 'round-closed' }],
  ])('accepts paths only between startsAt and endsAt + 300 ms: %s', (_label, now, expected) => {
    const r = submit(inRound(), 0, [path('cat')], now);
    expect(r.results).toEqual([expected]);
    expect(r.state.players[0]!.found).toEqual(expected.ok ? ['cat'] : []);
  });

  test('rejects paths from spectators', () => {
    const r = submit(inRound(), 2, [path('cat'), [0, 10]], 20_000);
    expect(r.results).toEqual([
      { ok: false, reason: 'spectator' },
      { ok: false, reason: 'spectator' },
    ]);
    expect(r.state.players[2]!.found).toEqual([]);
  });

  test('rate-limits beyond 10 paths per second', () => {
    expect(PATHS.length).toBeGreaterThan(13);
    const t = 20_000;
    // The 10th path in a window is validated.
    const ten = submit(inRound(), 0, PATHS.slice(0, 10), t);
    expect(ten.results!.every((x) => x.ok)).toBe(true);
    // The 11th, 999 ms later, is refused without validation: a valid word stays unfound.
    const eleventh = submit(ten.state, 0, [PATHS[10]!], t + 999);
    expect(eleventh.results).toEqual([{ ok: false, reason: 'rate-limited' }]);
    expect(eleventh.state.players[0]!.found).not.toContain(WORDS[10]);
    // At 1000 ms the first ten left the window.
    const later = submit(ten.state, 0, [PATHS[10]!], t + 1000);
    expect(later.results).toEqual([{ ok: true, word: WORDS[10] }]);
  });

  test('rate-limits beyond 10 paths per second: across messages', () => {
    const t = 20_000;
    const first = submit(inRound(), 0, PATHS.slice(0, 6), t);
    const second = submit(first.state, 0, PATHS.slice(6, 11), t + 500);
    expect(second.results!.map((x) => (x.ok ? 'ok' : x.reason))).toEqual(['ok', 'ok', 'ok', 'ok', 'rate-limited']);
    // Each player has their own window.
    const bob = submit(second.state, 1, PATHS.slice(0, 10), t + 600);
    expect(bob.results!.every((x) => x.ok)).toBe(true);
  });

  test('rejects a word the player already found', () => {
    const once = submit(inRound(), 0, [path('cat')], 20_000);
    const twice = submit(once.state, 0, [path('cat')], 21_000);
    expect(twice.results).toEqual([{ ok: false, reason: 'already-found' }]);
    // Another player can still find it.
    const bob = submit(twice.state, 1, [path('cat')], 22_000);
    expect(bob.results).toEqual([{ ok: true, word: 'cat' }]);
  });

  test('keeps a filtered profanity refused with the stored solutions', () => {
    // "aco" is on the board and in the dictionary, but profane: the stored solutions left it out.
    const pack = richPack();
    expect(pack.isWord('aco') && pack.isProfane('aco')).toBe(true);
    expect(WORDS).not.toContain('aco');
    const r = submit(inRound(), 0, [path('aco')], 20_000);
    expect(r.results).toEqual([{ ok: false, reason: 'not-a-word' }]);
  });
});
