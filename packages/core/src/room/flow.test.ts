import { describe, expect, test } from 'vitest';
import { nextDeadline } from './deadlines.ts';
import { step } from './machine.ts';
import { prepareRound } from './prepare.ts';
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
    expect(sentTo(r.effects, '*')).toEqual([
      {
        type: 'podium',
        ranking: [
          { playerId: 'p2', score: 12 },
          { playerId: 'p3', score: 8 },
          { playerId: 'p1', score: 5 },
        ],
      },
    ]);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
    // Whoever connects on the podium gets it after the welcome.
    const tv = step(r.state, message(pending('c-tv2'), { type: 'hello', role: 'tv', token: TV_TOKEN }), 71_000, deps);
    expect(sentTo(tv.effects, 'c-tv2').map((m) => m.type)).toEqual(['welcome', 'podium']);
  });

  test('play-again returns to the lobby with zeroed scores', () => {
    const podium = inResults({ phase: 'podium', roundIndex: 1, hostId: 'p2' });
    const r = step(podium, message(playerConn(bia), { type: 'play-again' }), 80_000, deps);
    expect(r.state.phase).toBe('lobby');
    expect(r.state.hostId).toBe('p2');
    expect(r.state.settings).toEqual(TWO_ROUNDS);
    expect(r.state.roundIndex).toBe(0);
    expect(r.state.players.map((p) => [p.id, p.nickname, p.color, p.score, p.found])).toEqual([
      ['p1', 'Ana', ana.color, 0, []],
      ['p2', 'Bia', bia.color, 0, []],
      ['p3', 'Cid', cid.color, 0, []],
    ]);
    expect(r.state.players.map((p) => p.token)).toEqual([ana.token, bia.token, cid.token]);
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
