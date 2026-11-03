import { describe, expect, test } from 'vitest';
import { boardSolutions, validateSubmission } from '../validate.ts';
import { step } from './machine.ts';
import { roundOptions } from './prepare.ts';
import type { RoundResultsMessage } from './protocol.ts';
import { endRound } from './results.ts';
import { DEFAULT_SETTINGS, type Player, type RoomState } from './state.ts';
import { allMessages, fakeDeps, makePack, makePlayer, message, pending, playerConn, roomWith, run, sentTo, TV_TOKEN } from './test-helpers.ts';

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
    const state = finishedRound([alice, bob, carol], { settings: { ...DEFAULT_SETTINGS, rounds: 2 }, tvCounts: { dirty: true, lastSentAt: 129_900 } });
    const r = endRound(state, END, deps);
    const tvCounts = r.effects.findIndex((e) => e.kind === 'send' && e.to.id === 'c-tv' && e.msg.type === 'counts');
    // Only the TV gets the results at the end of the round (m4-1-playtest C3).
    const resultsAt = r.effects.findIndex((e) => e.kind === 'send' && e.to.id === 'c-tv' && e.msg.type === 'round-results');
    expect(tvCounts).toBeGreaterThanOrEqual(0);
    expect(tvCounts).toBeLessThan(resultsAt);
    expect(sentTo(r.effects, 'c-tv').map((m) => m.type)).toEqual(['counts', 'round-results']);
    expect(sentTo(r.effects, 'c-tv')[0]).toEqual(
      {
        type: 'counts',
        counts: [
          { playerId: 'p1', count: 4 },
          { playerId: 'p2', count: 3 },
          { playerId: 'p3', count: 3 },
        ],
      },
    );
    expect(r.state.phase).toBe('words');
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
      { playerId: 'p2', unique: [{ word: 'sal', points: 2 }], roundPoints: 4, roundWords: 3, score: 4, words: 3 },
      { playerId: 'p3', unique: [{ word: 'tela', points: 4 }], roundPoints: 7, roundWords: 3, score: 11, words: 3 },
      { playerId: 'p1', unique: [{ word: 'casa', points: 4 }], roundPoints: 8, roundWords: 4, score: 18, words: 4 },
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

  test('sends the players list with the new scores after the results', () => {
    const r = endRound(finishedRound([alice, bob, carol], { settings: { ...DEFAULT_SETTINGS, rounds: 2 } }), END, deps);
    const broadcasts = r.effects.flatMap((e) => (e.kind === 'broadcast' ? [e.msg] : []));
    expect(broadcasts.map((m) => m.type)).toEqual(['phase', 'players']);
    const list = broadcasts[1];
    if (list?.type !== 'players') throw new Error('no players list');
    expect(list.players.map((p) => [p.id, p.score])).toEqual(r.state.players.map((p) => [p.id, p.score]));
    // The scores moved: nobody keeps the score from before the round.
    expect(list.players.find((p) => p.id === 'p2')?.score).toBeGreaterThan(0);
  });

  test('attaches real spellings only when they differ', () => {
    const msg = results(finishedRound([alice, bob, carol]));
    expect(msg.shared.find((w) => w.word === 'ate')).toEqual({ word: 'ate', points: 1, spellings: ['ate', 'até'], foundBy: ['p1', 'p2'] });
    // Words whose only spelling is the normalized one carry nothing, in shared and unique words alike.
    expect(msg.shared.find((w) => w.word === 'cor')).toEqual({ word: 'cor', points: 1, foundBy: ['p1', 'p2', 'p3'] });
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

  test('lists who found each shared word', () => {
    const msg = results(finishedRound([alice, bob, carol]));
    expect(msg.shared.map((w) => [w.word, w.foundBy])).toEqual([
      ['ate', ['p1', 'p2']],
      ['cor', ['p1', 'p2', 'p3']],
      ['arte', ['p1', 'p3']],
    ]);
  });

  test('lists who found each shared word: kicked players and spectators are left out', () => {
    const late = makePlayer('p4', { color: '#43A047', spectator: true, found: ['cor'] });
    const dan = makePlayer('p5', { color: '#FDD835', found: ['cor'] });
    const state = finishedRound([alice, bob, late, dan]);
    const kicked = step(state, message(playerConn(alice), { type: 'kick', playerId: 'p5' }), 60_000, deps).state;
    expect(results(kicked).shared.map((w) => [w.word, w.foundBy])).toEqual([
      ['ate', ['p1', 'p2']],
      ['cor', ['p1', 'p2']],
    ]);
  });

  test('counts the possible words with the room minimum and filter', () => {
    // Every word fits the board; the room's minimum and filter decide which ones count.
    const words = ['arte', 'ate', 'casa', 'cor'];
    const pack = makePack({ words, common: words, profanity: ['arte', 'cor'] });
    const possibleWith = (minLength: 3 | 4, filterProfanity: boolean) => {
      const solutions = [...boardSolutions(BOARD, pack, { minLength, filterProfanity }).words];
      const state = finishedRound([makePlayer('p1')], {
        solutions: { words: solutions, prefixes: new Uint8Array(solutions.length * 6) },
      });
      const r = endRound(state, END, fakeDeps(pack));
      return (allMessages(r.effects).find((m) => m.type === 'round-results') as RoundResultsMessage).possibleWords;
    };
    expect(possibleWith(3, false)).toBe(4); // arte, ate, casa, cor
    expect(possibleWith(4, false)).toBe(2); // arte, casa
    expect(possibleWith(3, true)).toBe(2); // ate, casa
    expect(possibleWith(4, true)).toBe(1); // casa
  });

  test('sends finders and possible words only in the results', () => {
    const ana = makePlayer('p1', { nickname: 'Ana' });
    const bia = makePlayer('p2', { nickname: 'Bia', color: '#E53935' });
    const lobby = finishedRound([ana, bia], {
      phase: 'lobby',
      round: null,
      solutions: null,
      nextRound: { board: BOARD, salt: 'salt', options: roundOptions(DEFAULT_SETTINGS) },
      nextSolutions: { words: SOLUTIONS, prefixes: new Uint8Array(SOLUTIONS.length * 6) },
    });
    const start = step(lobby, message(playerConn(ana), { type: 'start' }), 0, deps);
    const inRound = start.state.round!.startsAt + 5_000;
    const CASA_PATH = [0, 1, 2, 3];
    const beforeTheEnd = run(
      start.state,
      [
        message(pending('c-tv2'), { type: 'hello', role: 'tv', token: TV_TOKEN }),
        message(pending('c-back'), { type: 'hello', role: 'player', token: bia.token }),
        message(pending('c-guest'), { type: 'hello', role: 'player' }),
        message({ ...playerConn(ana) }, { type: 'submit', paths: [CASA_PATH] }),
      ],
      inRound,
      deps,
    );
    const flushed = step(beforeTheEnd.state, { kind: 'alarm' }, inRound + 1_000, deps);
    const messages = allMessages([...start.effects, ...beforeTheEnd.effects, ...flushed.effects]);
    // The walk really went through a round-start, a welcome, an accepted word and the counts.
    const types = new Set(messages.map((m) => m.type));
    for (const type of ['round-start', 'welcome', 'submit-result', 'counts', 'players'] as const) expect(types).toContain(type);
    expect(types).not.toContain('round-results');
    for (const m of messages) expect(JSON.stringify(m)).not.toMatch(/foundBy|possibleWords/);
    // Both fields are there the moment the round ends.
    const ended = step(flushed.state, { kind: 'alarm' }, flushed.state.round!.endsAt + 300, deps);
    const msg = allMessages(ended.effects).find((m) => m.type === 'round-results') as RoundResultsMessage;
    expect(msg.possibleWords).toBe(SOLUTIONS.length);
    expect(msg.players.find((p) => p.playerId === 'p1')?.unique).toEqual([{ word: 'casa', points: 4 }]);
  });

  test('has no longest word when the board has no solution', () => {
    const empty = makePlayer('p1');
    const msg = results(finishedRound([empty], { solutions: { words: [], prefixes: new Uint8Array() } }));
    expect(msg.longest).toBeNull();
    expect(msg.shared).toEqual([]);
    expect(msg.players).toEqual([{ playerId: 'p1', unique: [], roundPoints: 0, roundWords: 0, score: 0, words: 0 }]);
    expect(msg.possibleWords).toBe(0);
  });

  test('a word found by two players is shared', () => {
    const a = makePlayer('p1', { found: ['tela'] });
    const b = makePlayer('p2', { color: '#E53935', found: ['tela'] });
    const msg = results(finishedRound([a, b]));
    expect(msg.shared).toEqual([{ word: 'tela', points: 2, foundBy: ['p1', 'p2'] }]);
    // It counts for both, once each, and is nobody's unique word.
    expect(msg.players).toEqual([
      { playerId: 'p1', unique: [], roundPoints: 2, roundWords: 1, score: 2, words: 1 },
      { playerId: 'p2', unique: [], roundPoints: 2, roundWords: 1, score: 2, words: 1 },
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
    expect(msg.players[0]).toEqual({ playerId: 'p1', unique: [{ word: 'cor', points: 2 }], roundPoints: 2, roundWords: 1, score: 2, words: 1 });
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
    expect(first.state.phase).toBe('words');
    const last = endRound(finishedRound([alice, bob], { settings: two, roundIndex: 1 }), END, deps);
    expect(last.effects).not.toContainEqual({ kind: 'prepare-next' });
    expect(results(finishedRound([alice, bob], { settings: two, roundIndex: 1 })).last).toBe(true);
  });

  test('whoever connects in the results gets them after the welcome', () => {
    const ended = endRound(finishedRound([alice, bob, carol], { settings: { ...DEFAULT_SETTINGS, rounds: 2 } }), END, deps);
    // The results open on the host's show-result (m4-1-playtest C10).
    const r = { ...ended, state: { ...ended.state, phase: 'results' as const } };
    const back = step(r.state, message(pending('c-back'), { type: 'hello', role: 'player', token: bob.token }), END + 1, deps);
    expect(sentTo(back.effects, 'c-back').map((m) => m.type)).toEqual(['welcome', 'round-results']);
    expect(sentTo(back.effects, 'c-back')[1]).toEqual(r.state.results);
    const guest = step(r.state, message(pending('c-g'), { type: 'hello', role: 'player' }), END + 1, deps);
    expect(sentTo(guest.effects, 'c-g').map((m) => m.type)).toEqual(['welcome', 'round-results']);
  });

  test('counts the unique words and the shared ones each player found', () => {
    // RESULT-02 AC 5: Ana found casa (unique) and cor, ate, arte (shared): 4 words.
    const ana = makePlayer('p1', { found: ['casa', 'cor', 'ate', 'arte'] });
    const beto = makePlayer('p2', { color: '#E53935', found: ['cor'] });
    const caio = makePlayer('p3', { color: '#1E88E5', found: ['ate', 'arte'] });
    const duda = makePlayer('p4', { color: '#43A047', found: [] });

    const msg = results(finishedRound([ana, beto, caio, duda]));

    const roundWords = Object.fromEntries(msg.players.map((p) => [p.playerId, p.roundWords]));
    expect(roundWords).toEqual({ p1: 4, p2: 1, p3: 2, p4: 0 });
    // Beto's and Caio's words are all shared: theirs, though none is unique.
    expect(msg.players.find((p) => p.playerId === 'p2')?.unique).toEqual([]);
    expect(msg.players.find((p) => p.playerId === 'p3')?.unique).toEqual([]);
  });

  test('adds up the words of the match after each round', () => {
    // RESULT-02 AC 3: round 1 of 2, with a spectator who joined late.
    const two = { ...DEFAULT_SETTINGS, rounds: 2 as const };
    const ana = makePlayer('p1', { found: ['casa', 'cor'] });
    const beto = makePlayer('p2', { color: '#E53935', found: ['cor', 'ate', 'sal'] });
    const late = makePlayer('p3', { color: '#1E88E5', spectator: true });
    const first = endRound(finishedRound([ana, beto, late], { settings: two, roundIndex: 0 }), END, deps);

    expect(first.state.players.map((p) => [p.id, p.words])).toEqual([
      ['p1', 2],
      ['p2', 3],
      ['p3', 0],
    ]);

    // Round 2: Ana finds 3 more, Beto 1, and the late joiner plays and finds 2.
    const ROUND_2_FOUND: Record<string, string[]> = { p1: ['arte', 'tela', 'sal'], p2: ['ate'], p3: ['cor', 'casa'] };
    const secondRound: RoomState = {
      ...first.state,
      phase: 'round',
      roundIndex: 1,
      players: first.state.players.map((p) => ({ ...p, spectator: false, found: ROUND_2_FOUND[p.id]! })),
    };
    const second = endRound(secondRound, END + 200_000, deps);

    const msg = allMessages(second.effects).find((m) => m.type === 'round-results') as RoundResultsMessage;
    const byId = Object.fromEntries(msg.players.map((p) => [p.playerId, [p.roundWords, p.words]]));
    expect(byId).toEqual({ p1: [3, 5], p2: [1, 4], p3: [2, 2] });
    const list = allMessages(second.effects).find((m) => m.type === 'players');
    if (list?.type !== 'players') throw new Error('no players list');
    expect(list.players.map((p) => [p.id, p.words])).toEqual([
      ['p1', 5],
      ['p2', 4],
      ['p3', 2],
    ]);

    // A new match and the lobby start from 0.
    const podium: RoomState = {
      ...second.state,
      phase: 'podium',
      nextRound: { board: BOARD, salt: 'salt', options: roundOptions(two) },
      nextSolutions: { words: SOLUTIONS, prefixes: new Uint8Array(SOLUTIONS.length * 6) },
    };
    const again = step(podium, message(playerConn(ana), { type: 'play-again' }), END + 300_000, deps);
    expect(again.state.phase).toBe('round');
    expect(again.state.players.map((p) => p.words)).toEqual([0, 0, 0]);
    const lobby = step(podium, message(playerConn(ana), { type: 'back-to-lobby' }), END + 300_000, deps);
    expect(lobby.state.phase).toBe('lobby');
    expect(lobby.state.players.map((p) => p.words)).toEqual([0, 0, 0]);
  });

  test.each([
    ['in the middle of the match', 0],
    ['after the last round', 1],
  ])('ends the round on the words with the results only to the tv: %s', (_name, roundIndex) => {
    // SYNC-01 AC 1, WORDCTL-01 AC 9: phones and guests get the phase and the scores, never the results.
    const two = { ...DEFAULT_SETTINGS, rounds: 2 as const };
    const state = finishedRound([alice, bob, carol], { settings: two, roundIndex });

    const r = endRound(state, END, deps);

    expect(r.state.phase).toBe('words');
    expect(sentTo(r.effects, 'c-tv').map((m) => m.type)).toEqual(['counts', 'round-results']);
    expect(sentTo(r.effects, 'c-tv')[1]).toEqual(r.state.results);
    expect(sentTo(r.effects, '*')).toEqual([{ type: 'phase', phase: 'words' }, expect.objectContaining({ type: 'players' })]);
    // Nothing else leaves the room: no podium yet, and no message to a phone.
    const toOthers = r.effects.filter((e) => e.kind === 'send' && e.to.id !== 'c-tv');
    expect(toOthers).toEqual([]);
    expect(allMessages(r.effects).map((m) => m.type)).not.toContain('podium');
  });
});
