import { describe, expect, test } from 'vitest';
import { validateSubmission } from '../validate.ts';
import { step } from './machine.ts';
import type { RoundResultsMessage } from './protocol.ts';
import { endRound } from './results.ts';
import { DEFAULT_SETTINGS, type Player, type RoomState } from './state.ts';
import { allMessages, fakeDeps, makePack, makePlayer, message, pending, playerConn, roomWith, sentTo } from './test-helpers.ts';

const BOARD = [
  ['c', 'a', 's', 'a'],
  ['o', 'r', 't', 'e'],
  ['p', 'e', 'l', 'o'],
  ['m', 'u', 'n', 'd'],
];
const SOLUTIONS = ['arte', 'ate', 'casa', 'cor', 'sal', 'tela'];
const PACK = makePack({
  words: SOLUTIONS,
  // "arte" is rare, so "casa" wins the longest word over it (same length, both found, "arte" sorts first).
  common: ['ate', 'casa', 'cor', 'tela'],
  spellings: [
    ['ate', ['ate', 'até']],
    ['sal', ['sal']],
  ],
});
const deps = fakeDeps(PACK);
const END = 130_300;

/** A round of three players (alice is the host, with 10 points from earlier rounds) and a TV. */
function finishedRound(players: Player[], extra: Partial<RoomState> = {}): RoomState {
  return roomWith(players, {
    phase: 'round',
    tvConn: 'c-tv',
    tvOfflineSince: null,
    round: { id: 1, board: BOARD, startsAt: 10_000, endsAt: 130_000, salt: 'salt' },
    solutions: { words: SOLUTIONS, prefixes: new Uint8Array(SOLUTIONS.length * 6) },
    ...extra,
  });
}

const alice = makePlayer('p1', { nickname: 'Alice', score: 10, found: ['casa', 'cor', 'ate', 'arte'] });
const bob = makePlayer('p2', { nickname: 'Bob', color: '#E53935', found: ['cor', 'ate', 'sal'] });
const carol = makePlayer('p3', { nickname: 'Carol', color: '#1E88E5', score: 4, found: ['tela', 'cor', 'arte'] });

function results(state: RoomState): RoundResultsMessage {
  const r = endRound(state, END, deps);
  return allMessages(r.effects).find((m) => m.type === 'round-results') as RoundResultsMessage;
}

describe('round results', () => {
  test('sends the final counts before the results', () => {
    // Bob's last word is not on the TV yet: the flush deadline had not come.
    const state = finishedRound([alice, bob, carol], { tvCounts: { dirty: true, lastSentAt: 129_900 } });
    const r = endRound(state, END, deps);
    const tvCounts = r.effects.findIndex((e) => e.kind === 'send' && e.to.id === 'c-tv' && e.msg.type === 'counts');
    const resultsAt = r.effects.findIndex((e) => e.kind === 'broadcast' && e.msg.type === 'round-results');
    expect(tvCounts).toBeGreaterThanOrEqual(0);
    expect(tvCounts).toBeLessThan(resultsAt);
    expect(sentTo(r.effects, 'c-tv')).toEqual([
      {
        type: 'counts',
        counts: [
          { playerId: 'p1', count: 4 },
          { playerId: 'p2', count: 3 },
          { playerId: 'p3', count: 3 },
        ],
      },
    ]);
    expect(r.state.phase).toBe('results');
    expect(r.effects[0]).toEqual({ kind: 'persist', keys: ['room'] });
  });

  test('orders shared words and players as specified', () => {
    const msg = results(finishedRound([alice, bob, carol]));
    // Shared words shortest first, then alphabetical; each counts once.
    expect(msg.shared.map((w) => [w.word, w.points])).toEqual([
      ['ate', 1],
      ['cor', 1],
      ['arte', 2],
    ]);
    // Bob ends with 4, carol with 4 + 7 = 11, alice with 10 + 8 = 18: lowest first.
    expect(msg.players).toEqual([
      { playerId: 'p2', unique: [{ word: 'sal', points: 2 }], roundPoints: 4, score: 4 },
      { playerId: 'p3', unique: [{ word: 'tela', points: 4 }], roundPoints: 7, score: 11 },
      { playerId: 'p1', unique: [{ word: 'casa', points: 4 }], roundPoints: 8, score: 18 },
    ]);
    expect(msg.index).toBe(0);
    expect(msg.last).toBe(true);
  });

  test('orders shared words and players as specified: ties keep the joining order', () => {
    const a = makePlayer('p1', { found: ['cor'] });
    const b = makePlayer('p2', { color: '#E53935', found: ['ate'] });
    const msg = results(finishedRound([a, b]));
    expect(msg.players.map((p) => [p.playerId, p.score])).toEqual([
      ['p1', 2],
      ['p2', 2],
    ]);
  });

  test('applies the round points to the accumulated scores', () => {
    const r = endRound(finishedRound([alice, bob, carol]), END, deps);
    expect(r.state.players.map((p) => [p.id, p.score])).toEqual([
      ['p1', 18],
      ['p2', 4],
      ['p3', 11],
    ]);
    expect(r.state.results).toEqual(results(finishedRound([alice, bob, carol])));
  });

  test('attaches real spellings only when they differ', () => {
    const msg = results(finishedRound([alice, bob, carol]));
    expect(msg.shared.find((w) => w.word === 'ate')).toEqual({ word: 'ate', points: 1, spellings: ['ate', 'até'] });
    // Words whose only spelling is the normalized one carry nothing, in shared and unique words alike.
    expect(msg.shared.find((w) => w.word === 'cor')).toEqual({ word: 'cor', points: 1 });
    expect(msg.players[0]!.unique).toEqual([{ word: 'sal', points: 2 }]);
  });

  test('includes the longest word with its path and finders', () => {
    const msg = results(finishedRound([alice, bob, carol]));
    expect(msg.longest).toEqual({ word: 'casa', points: 2, path: [0, 1, 2, 3], foundBy: ['p1'] });
    // The path spells the word on the board.
    const check = validateSubmission(BOARD, msg.longest!.path, {
      solutions: new Set(['casa']),
      found: new Set(),
      minLength: 3,
      filterProfanity: false,
      pack: PACK,
    });
    expect(check).toEqual({ ok: true, word: 'casa' });
  });

  test('has no longest word when the board has no solution', () => {
    const empty = makePlayer('p1');
    const msg = results(finishedRound([empty], { solutions: { words: [], prefixes: new Uint8Array() } }));
    expect(msg.longest).toBeNull();
    expect(msg.shared).toEqual([]);
    expect(msg.players).toEqual([{ playerId: 'p1', unique: [], roundPoints: 0, score: 0 }]);
  });

  test('a word found by two players is shared', () => {
    const a = makePlayer('p1', { found: ['tela'] });
    const b = makePlayer('p2', { color: '#E53935', found: ['tela'] });
    const msg = results(finishedRound([a, b]));
    expect(msg.shared).toEqual([{ word: 'tela', points: 2 }]);
    // It counts for both, once each, and is nobody's unique word.
    expect(msg.players).toEqual([
      { playerId: 'p1', unique: [], roundPoints: 2, score: 2 },
      { playerId: 'p2', unique: [], roundPoints: 2, score: 2 },
    ]);
  });

  test('leaves a player kicked mid-round out of the results', () => {
    const a = makePlayer('p1', { found: ['cor'] });
    const dan = makePlayer('p2', { color: '#E53935', found: ['cor', 'casa'] });
    const state = finishedRound([a, dan]);
    const kicked = step(state, message(playerConn(a), { type: 'kick', playerId: 'p2' }), 60_000, deps).state;
    const msg = results(kicked);
    expect(msg.players.map((p) => p.playerId)).toEqual(['p1']);
    // Dan's words count for nobody: "cor" is alice's alone and doubled, and the longest word has no finder.
    expect(msg.shared).toEqual([]);
    expect(msg.players[0]).toEqual({ playerId: 'p1', unique: [{ word: 'cor', points: 2 }], roundPoints: 2, score: 2 });
    expect(msg.longest?.foundBy).toEqual([]);
  });

  test('leaves spectators out of the results', () => {
    const late = makePlayer('p2', { color: '#E53935', spectator: true });
    const r = endRound(finishedRound([alice, late]), END, deps);
    const msg = allMessages(r.effects).find((m) => m.type === 'round-results') as RoundResultsMessage;
    expect(msg.players.map((p) => p.playerId)).toEqual(['p1']);
    expect(r.state.players[1]!.score).toBe(0);
  });

  test('prepares the next board when rounds remain', () => {
    const two = { ...DEFAULT_SETTINGS, rounds: 2 as const };
    const first = endRound(finishedRound([alice, bob], { settings: two, roundIndex: 0 }), END, deps);
    expect(first.effects).toContainEqual({ kind: 'prepare-next' });
    expect(results(finishedRound([alice, bob], { settings: two, roundIndex: 0 })).last).toBe(false);
    // The request comes with the results, before any `next`.
    expect(first.state.phase).toBe('results');
    const last = endRound(finishedRound([alice, bob], { settings: two, roundIndex: 1 }), END, deps);
    expect(last.effects).not.toContainEqual({ kind: 'prepare-next' });
    expect(results(finishedRound([alice, bob], { settings: two, roundIndex: 1 })).last).toBe(true);
  });

  test('whoever connects in the results gets them after the welcome', () => {
    const r = endRound(finishedRound([alice, bob, carol]), END, deps);
    const back = step(r.state, message(pending('c-back'), { type: 'hello', role: 'player', token: bob.token }), END + 1, deps);
    expect(sentTo(back.effects, 'c-back').map((m) => m.type)).toEqual(['welcome', 'round-results']);
    expect(sentTo(back.effects, 'c-back')[1]).toEqual(r.state.results);
    const guest = step(r.state, message(pending('c-g'), { type: 'hello', role: 'player' }), END + 1, deps);
    expect(sentTo(guest.effects, 'c-g').map((m) => m.type)).toEqual(['welcome', 'round-results']);
  });
});
