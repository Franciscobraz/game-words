import { describe, expect, test } from 'vitest';
import { nextDeadline } from './deadlines.ts';
import { step } from './machine.ts';
import type { Effect } from './effects.ts';
import { type PreparedRound, prepareRound } from './prepare.ts';
import type { ClientMessageType, Phase } from './protocol.ts';
import { DEFAULT_SETTINGS, type RoomState } from './state.ts';
import { allMessages, fakeDeps, guest, makePlayer, message, pending, playerConn, richPack, roomWith, sentTo, TV_TOKEN } from './test-helpers.ts';

const deps = fakeDeps(richPack());
const SALT = new Uint8Array(16).fill(3);
const TWO_ROUNDS = { ...DEFAULT_SETTINGS, rounds: 2 as const, seconds: 60 as const };

const ana = makePlayer('p1', { nickname: 'Ana', score: 5 });
const bia = makePlayer('p2', { nickname: 'Bia', color: '#E53935', score: 12 });
const cid = makePlayer('p3', { nickname: 'Cid', color: '#1E88E5', score: 8, connected: false, connId: null });

/** The results of a round: `roundIndex` 0 of two rounds unless told otherwise. */
function inResults(extra: Partial<RoomState> = {}): RoomState {
  return roomWith([ana, bia, cid], {
    phase: 'results',
    settings: TWO_ROUNDS,
    tvConn: 'c-tv',
    tvOfflineSince: null,
    roundIndex: 0,
    round: { id: 1, board: [['a']], startsAt: 0, endsAt: 60_000, salt: 'old' },
    ...extra,
  });
}

const host = playerConn(ana);

describe('match flow', () => {
  test('next starts the countdown with the prepared board', async () => {
    const prepared = await prepareRound(richPack(), TWO_ROUNDS, 4, SALT);
    // The board the results asked for arrived before the host moved on.
    const ready = step(inResults(), { kind: 'prepared', round: prepared }, 61_000, deps).state;
    const r = step(ready, message(host, { type: 'next' }), 70_000, deps);
    expect(r.state.phase).toBe('round');
    expect(r.state.roundIndex).toBe(1);
    expect(r.state.round).toEqual({ id: 2, board: prepared.board, startsAt: 73_000, endsAt: 133_000, salt: prepared.salt });
    expect(r.state.solutions).toEqual(prepared.solutions);
    expect(sentTo(r.effects, 'conn-p1')[0]).toEqual({
      type: 'round-start',
      id: 2,
      index: 1,
      board: prepared.board,
      startsAt: 73_000,
      endsAt: 133_000,
      salt: prepared.salt,
    });
    // Nothing is generated now: the board was prepared.
    expect(r.effects).not.toContainEqual({ kind: 'prepare-next' });
    expect(r.state.lastActionAt).toBe(70_000);
  });

  test('next before the board is ready waits for it', async () => {
    const asked = step(inResults(), message(host, { type: 'next' }), 70_000, deps);
    expect(asked.state.phase).toBe('results');
    expect(asked.state.pendingStart).toBe(true);
    expect(asked.effects).toEqual([{ kind: 'prepare-next' }]);
    const prepared = await prepareRound(richPack(), TWO_ROUNDS, 4, SALT);
    const r = step(asked.state, { kind: 'prepared', round: prepared }, 70_050, deps);
    expect(r.state.phase).toBe('round');
    expect(r.state.round?.startsAt).toBe(73_050);
  });

  test('next after the last round sends the podium', () => {
    const r = step(inResults({ roundIndex: 1 }), message(host, { type: 'next' }), 70_000, deps);
    expect(r.state.phase).toBe('podium');
    expect(sentTo(r.effects, '*')[0]).toEqual({
      type: 'podium',
      ranking: [
        { playerId: 'p2', score: 12 },
        { playerId: 'p3', score: 8 },
        { playerId: 'p1', score: 5 },
      ],
    });
    expect(sentTo(r.effects, '*').map((m) => m.type)).toEqual(['podium', 'players']);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
    // Whoever connects on the podium gets it after the welcome.
    const tv = step(r.state, message(pending('c-tv2'), { type: 'hello', role: 'tv', token: TV_TOKEN }), 71_000, deps);
    expect(sentTo(tv.effects, 'c-tv2').map((m) => m.type)).toEqual(['welcome', 'podium']);
  });

  test('sends the updated players list after the results and the podium', () => {
    // Round end: scores in the list match the new cumulative scores.
    const ended = step(inResults({ roundIndex: 1 }), message(host, { type: 'next' }), 70_000, deps);
    const list = sentTo(ended.effects, '*').find((m) => m.type === 'players');
    expect(list).toBeDefined();
    if (list?.type !== 'players') throw new Error('no players list');
    for (const p of ended.state.players) {
      const info = list.players.find((i) => i.id === p.id);
      expect(info?.score).toBe(p.score);
      expect(info?.wins).toBe(p.wins);
    }
    // The winner's new win is in the list sent with the podium.
    expect(list.players.find((i) => i.id === 'p2')?.wins).toBe(1);
  });

  /** The podium of a finished match of two rounds, hosted by Bia, with a guest on the join screen. */
  const onPodium = (extra: Partial<RoomState> = {}) =>
    inResults({ phase: 'podium', roundIndex: 1, hostId: 'p2', players: [ana, bia, { ...cid, spectator: true }], ...extra });

  /** Checks the countdown of round 0 of a new match, started at `now` with `prepared`. */
  function expectNewMatch(state: RoomState, effects: Effect[], prepared: PreparedRound, now: number) {
    expect(state.phase).toBe('round');
    expect(state.roundIndex).toBe(0);
    expect(state.hostId).toBe('p2');
    expect(state.settings).toEqual(TWO_ROUNDS);
    expect(state.round).toEqual({ id: 2, board: prepared.board, startsAt: now + 3000, endsAt: now + 63_000, salt: prepared.salt });
    expect(state.players.map((p) => [p.id, p.nickname, p.color, p.token, p.score, p.found, p.spectator])).toEqual([
      ['p1', 'Ana', ana.color, ana.token, 0, [], false],
      ['p2', 'Bia', bia.color, bia.token, 0, [], false],
      ['p3', 'Cid', cid.color, cid.token, 0, [], false],
    ]);
    // The countdown goes out at once, with no stop in the lobby.
    expect(sentTo(effects, 'conn-p2')[0]).toEqual({
      type: 'round-start',
      id: 2,
      index: 0,
      board: prepared.board,
      startsAt: now + 3000,
      endsAt: now + 63_000,
      salt: prepared.salt,
    });
    expect(sentTo(effects, 'c-tv')).toEqual([]);
    expect(effects).toContainEqual({
      kind: 'broadcast',
      msg: { type: 'round-start', id: 2, index: 0, board: prepared.board, startsAt: now + 3000, endsAt: now + 63_000 },
      roles: ['tv', 'guest'],
    });
    expect(allMessages(effects).filter((m) => m.type === 'welcome')).toEqual([]);
  }

  test('play-again starts a new match with zeroed scores: board to prepare', async () => {
    const asked = step(onPodium(), message(playerConn(bia), { type: 'play-again' }), 80_000, deps);
    expect(asked.state.phase).toBe('podium');
    expect(asked.state.pendingStart).toBe(true);
    expect(asked.effects).toEqual([{ kind: 'prepare-next' }]);
    const prepared = await prepareRound(richPack(), TWO_ROUNDS, 4, SALT);
    const r = step(asked.state, { kind: 'prepared', round: prepared }, 80_050, deps);
    expectNewMatch(r.state, r.effects, prepared, 80_050);
  });

  test('play-again starts a new match with zeroed scores: board already prepared', async () => {
    const prepared = await prepareRound(richPack(), TWO_ROUNDS, 4, SALT);
    const { solutions, ...board } = prepared;
    const ready = onPodium({ nextRound: board, nextSolutions: solutions });
    const r = step(ready, message(playerConn(bia), { type: 'play-again' }), 80_000, deps);
    expectNewMatch(r.state, r.effects, prepared, 80_000);
    expect(r.effects).not.toContainEqual({ kind: 'prepare-next' });
  });

  /** A round of two with words found: countdown until 10 s, open until 70 s. */
  const midMatch = (phase: Phase) =>
    inResults({
      phase,
      hostId: 'p2',
      players: [{ ...ana, found: ['abc'] }, { ...bia, found: ['abc', 'def'] }, { ...cid, spectator: true }],
      round: { id: 1, board: [['a']], startsAt: 10_000, endsAt: 70_000, salt: 'salt' },
      solutions: { words: ['abc', 'def'], prefixes: new Uint8Array(12) },
    });

  // RES-01 AC 10: one row per phase where the command is valid (L-007).
  const BACK_ROWS: [string, Phase, number][] = [
    ['countdown', 'round', 5_000],
    ['round', 'round', 30_000],
    ['results', 'results', 75_000],
    ['podium', 'podium', 80_000],
  ];

  test.each(BACK_ROWS)('back-to-lobby cancels the match and returns to the lobby: %s', (_name, phase, now) => {
    const state = midMatch(phase);
    const r = step(state, message(playerConn(bia), { type: 'back-to-lobby' }), now, deps);
    expect(r.state.phase).toBe('lobby');
    expect(r.state.hostId).toBe('p2');
    expect(r.state.settings).toEqual(TWO_ROUNDS);
    expect(r.state.roundIndex).toBe(0);
    expect(r.state.solutions).toBeNull();
    expect(r.state.players.map((p) => [p.id, p.nickname, p.color, p.token, p.score, p.found, p.spectator])).toEqual([
      ['p1', 'Ana', ana.color, ana.token, 0, [], false],
      ['p2', 'Bia', bia.color, bia.token, 0, [], false],
      ['p3', 'Cid', cid.color, cid.token, 0, [], false],
    ]);
    // The round ends without results.
    expect(allMessages(r.effects).map((m) => m.type)).not.toContain('round-results');
    // The discarded words are deleted from the storage.
    expect(r.effects).toContainEqual({
      kind: 'persist',
      keys: ['room', 'round:solutions', 'round:next', 'found:p1', 'found:p2', 'found:p3'],
    });
    // Every connection learns the room is back in the lobby.
    for (const id of ['c-tv', 'conn-p1', 'conn-p2']) {
      expect(sentTo(r.effects, id)).toEqual([
        expect.objectContaining({ type: 'welcome', phase: 'lobby', round: null, hostId: 'p2', settings: TWO_ROUNDS }),
      ]);
    }
    expect(r.effects).toContainEqual({
      kind: 'broadcast',
      msg: expect.objectContaining({ type: 'welcome', role: 'player', phase: 'lobby', playerId: null }),
      roles: ['guest'],
    });
    const [welcome] = sentTo(r.effects, 'c-tv');
    expect((welcome as { players: { score: number }[] }).players.map((p) => p.score)).toEqual([0, 0, 0]);
  });

  test('back-to-lobby drops the late submit and the round-end alarm', () => {
    const back = step(midMatch('round'), message(playerConn(bia), { type: 'back-to-lobby' }), 30_000, deps).state;
    expect(nextDeadline(back)).not.toBe(70_300);
    const late = step(back, message(playerConn(ana), { type: 'submit', paths: [[0]] }), 30_100, deps);
    expect(late.state).toBe(back);
    expect(allMessages(late.effects)).toEqual([{ type: 'error', code: 'wrong-phase' }]);
    const alarm = step(back, { kind: 'alarm' }, 70_300, deps);
    expect(alarm.state.phase).toBe('lobby');
    expect(alarm.state.results).toBeNull();
    expect(allMessages(alarm.effects)).toEqual([]);
  });

  test('close-room closes with closed-by-host', () => {
    for (const phase of ['lobby', 'round', 'results', 'podium'] as const) {
      const r = step(inResults({ phase }), message(host, { type: 'close-room' }), 90_000, deps);
      expect(r.effects, phase).toEqual([{ kind: 'broadcast', msg: { type: 'closed', reason: 'closed-by-host' } }, { kind: 'close-room' }]);
      expect(r.state.closed).toBe(true);
      // A closed room ignores everything after.
      const after = step(r.state, message(guest('c-g'), { type: 'join', nickname: 'Dan', color: '#43A047' }), 90_001, deps);
      expect(after).toEqual({ state: r.state, effects: [] });
    }
  });

  // RES-01 AC 9: one row per command and phase where it is not valid (L-007).
  const OUTSIDE: [ClientMessageType, Phase][] = [
    ['next', 'lobby'],
    ['next', 'round'],
    ['next', 'podium'],
    ['play-again', 'lobby'],
    ['play-again', 'round'],
    ['play-again', 'results'],
    ['back-to-lobby', 'lobby'],
    ['start', 'round'],
    ['start', 'results'],
    ['start', 'podium'],
  ];

  test.each(OUTSIDE)('rejects flow commands outside their phase: %s in %s', (type, phase) => {
    const state = inResults({ phase });
    const r = step(state, message(host, { type }), 0, deps);
    expect(r.state).toBe(state);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'wrong-phase' }]);
  });
});

describe('session wins', () => {
  /** The results of the last round of two, with these scores and wins for Ana, Bia and Cid. */
  const lastResults = (scores: number[], wins: number[]) =>
    inResults({
      roundIndex: 1,
      players: [ana, bia, cid].map((p, i) => ({ ...p, score: scores[i]!, wins: wins[i]! })),
    });

  const winsOf = (state: RoomState) => state.players.map((p) => p.wins);

  test('awards a win to every top scorer at the podium', () => {
    // Bia and Cid (offline) tie at the top; Ana trails.
    const r = step(lastResults([5, 12, 12], [1, 0, 2]), message(host, { type: 'next' }), 70_000, deps);
    expect(r.state.phase).toBe('podium');
    expect(winsOf(r.state)).toEqual([1, 1, 3]);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
    // A single leader takes the only win.
    const one = step(lastResults([20, 12, 3], [0, 0, 0]), message(host, { type: 'next' }), 70_000, deps);
    expect(winsOf(one.state)).toEqual([1, 0, 0]);
  });

  test('awards no win when the top score is 0', () => {
    const r = step(lastResults([0, 0, 0], [1, 2, 0]), message(host, { type: 'next' }), 70_000, deps);
    expect(r.state.phase).toBe('podium');
    expect(winsOf(r.state)).toEqual([1, 2, 0]);
  });

  test('awards no win before the last round ends', () => {
    // `next` in the results of round 1 of 2 starts round 2 and counts nothing.
    const state = { ...lastResults([5, 12, 8], [0, 0, 0]), roundIndex: 0 };
    const r = step(state, message(host, { type: 'next' }), 70_000, deps);
    expect(r.state.phase).toBe('results');
    expect(winsOf(r.state)).toEqual([0, 0, 0]);
  });

  // WINS-01 AC 3: one row per phase before the podium (L-007).
  const CANCEL_ROWS: [string, Partial<RoomState>, number][] = [
    ['countdown', { phase: 'round', roundIndex: 1 }, 0],
    ['round', { phase: 'round', roundIndex: 1 }, 30_000],
    ['results of the last round', { phase: 'results', roundIndex: 1 }, 75_000],
  ];

  test.each(CANCEL_ROWS)('awards no win to a cancelled match: %s', (_name, extra, now) => {
    const round = { id: 1, board: [['a']], startsAt: 10_000, endsAt: 70_000, salt: 's' };
    const state = { ...lastResults([5, 12, 8], [1, 0, 0]), round, ...extra };
    const back = step(state, message(host, { type: 'back-to-lobby' }), now, deps);
    expect(back.state.phase).toBe('lobby');
    expect(winsOf(back.state)).toEqual([1, 0, 0]);
    // The next match starts from the lobby; the cancelled one never reaches a podium.
    const welcome = sentTo(back.effects, 'c-tv')[0] as { players: { wins: number }[] };
    expect(welcome.players.map((p) => p.wins)).toEqual([1, 0, 0]);
  });

  test.each(['play-again', 'back-to-lobby'] as const)('keeps wins when scores reset: %s', async (type) => {
    const podium = inResults({
      phase: 'podium',
      roundIndex: 1,
      players: [{ ...ana, wins: 2 }, { ...bia, wins: 1 }, { ...cid, wins: 0 }],
    });
    const r = step(podium, message(host, { type }), 80_000, deps);
    // play-again waits for a board; its scores reset when the countdown starts.
    const after =
      type === 'play-again'
        ? step(r.state, { kind: 'prepared', round: await prepareRound(richPack(), TWO_ROUNDS, 4, SALT) }, 80_050, deps).state
        : r.state;
    expect(after.phase).toBe(type === 'play-again' ? 'round' : 'lobby');
    expect(after.players.map((p) => p.score)).toEqual([0, 0, 0]);
    expect(winsOf(after)).toEqual([2, 1, 0]);
  });

  test("kick discards the player's wins", () => {
    const lobby = roomWith([{ ...ana, wins: 1 }, { ...bia, wins: 3 }], { tvConn: 'c-tv' });
    const kicked = step(lobby, message(host, { type: 'kick', playerId: 'p2' }), 0, deps);
    expect(kicked.state.players.map((p) => [p.id, p.wins])).toEqual([['p1', 1]]);
    const [players] = sentTo(kicked.effects, '*') as { players: { id: string; wins: number }[] }[];
    expect(players!.players.map((p) => [p.id, p.wins])).toEqual([['p1', 1]]);
    // Bia scans the code again: a new player with 0 wins.
    const again = step(kicked.state, message(guest('c-bia'), { type: 'join', nickname: 'Bia', color: bia.color }), 0, deps);
    const newBia = again.state.players.find((p) => p.nickname === 'Bia')!;
    expect(newBia.id).not.toBe('p2');
    expect(newBia.wins).toBe(0);
  });
});
