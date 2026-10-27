import { describe, expect, test } from 'vitest';
import type { ConnRef } from './effects.ts';
import { type RoomInput, step } from './machine.ts';
import { PALETTE } from './colors.ts';
import type { ClientMessageType, Phase } from './protocol.ts';
import type { RoomState } from './state.ts';
import { allMessages, fakeDeps, guest, makePlayer, message, newRoom, pending, playerConn, roomWith, sentTo } from './test-helpers.ts';

const deps = fakeDeps();

/** Joins players through the protocol, in order, and returns the room and their connections. */
function lobbyWith(names: string[]) {
  let state = newRoom();
  const conns: ConnRef[] = [];
  names.forEach((name, i) => {
    const r = step(state, message(guest(`c-${name}`), { type: 'join', nickname: name, color: PALETTE[i] }), 0, deps);
    state = r.state;
    const p = state.players[state.players.length - 1]!;
    conns.push({ id: `c-${name}`, role: 'player', playerId: p.id });
  });
  return { state, conns };
}

function expectOneHost(state: RoomState) {
  expect(state.hostId).not.toBeNull();
  expect(state.players.filter((p) => p.id === state.hostId)).toHaveLength(1);
}

describe('host role', () => {
  test('makes the first player the host', () => {
    const { state } = lobbyWith(['Ana', 'Bia']);
    expect(state.hostId).toBe(state.players[0]!.id);
  });

  test('keeps exactly one host through every change', () => {
    let { state, conns } = lobbyWith(['Ana', 'Bia', 'Cid']);
    const [ana, bia, cid] = conns as [ConnRef, ConnRef, ConnRef];
    const id = (c: ConnRef) => (c.role === 'player' ? c.playerId : '');
    const inputs: RoomInput[] = [
      message(guest('c-Dan'), { type: 'join', nickname: 'Dan', color: PALETTE[3] }),
      message(ana, { type: 'transfer-host', playerId: id(bia) }),
      message(bia, { type: 'kick', playerId: id(ana) }),
      message(bia, { type: 'kick', playerId: id(bia) }),
      { kind: 'disconnect', conn: bia },
      message(pending('c-Bia-2'), { type: 'hello', role: 'player', token: state.players[1]!.token }),
      message({ id: 'c-Bia-2', role: 'player', playerId: id(bia) }, { type: 'transfer-host', playerId: id(cid) }),
      message(cid, { type: 'kick', playerId: id(bia) }),
    ];
    for (const input of inputs) {
      state = step(state, input, 0, deps).state;
      expectOneHost(state);
    }
    expect(state.hostId).toBe(id(cid));
    expect(state.players.map((p) => p.nickname)).toEqual(['Cid', 'Dan']);
  });

  test('transfers the host role and announces it', () => {
    const { state, conns } = lobbyWith(['Ana', 'Bia']);
    const bia = state.players[1]!;
    const r = step(state, message(conns[0]!, { type: 'transfer-host', playerId: bia.id }), 0, deps);
    expect(r.state.hostId).toBe(bia.id);
    expect(sentTo(r.effects, '*')).toEqual([expect.objectContaining({ type: 'players', hostId: bia.id })]);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
  });

  test('rejects a transfer to a disconnected, unknown or same player', () => {
    const ana = makePlayer('p1');
    const away = makePlayer('p2', { connected: false, connId: null });
    const state = roomWith([ana, away]);
    for (const playerId of ['p2', 'p9', 'p1']) {
      const r = step(state, message(playerConn(ana), { type: 'transfer-host', playerId }), 0, deps);
      expect(r.state, playerId).toBe(state);
      expect(allMessages(r.effects), playerId).toEqual([{ type: 'error', code: 'bad-target' }]);
    }
  });

  // HOST-01 AC 4: one row per host command (L-007), each in a phase where it is valid.
  const HOST_ROWS: [ClientMessageType, Phase, object][] = [
    ['settings', 'lobby', { type: 'settings', patch: { size: 5 } }],
    ['start', 'lobby', { type: 'start' }],
    ['next', 'results', { type: 'next' }],
    ['transfer-host', 'lobby', { type: 'transfer-host', playerId: 'p2' }],
    ['kick', 'lobby', { type: 'kick', playerId: 'p1' }],
    ['play-again', 'podium', { type: 'play-again' }],
    ['back-to-lobby', 'round', { type: 'back-to-lobby' }],
    ['close-room', 'lobby', { type: 'close-room' }],
  ];

  test.each(HOST_ROWS)('rejects every host command from a non-host: %s', (_type, phase, msg) => {
    const state = roomWith([makePlayer('p1'), makePlayer('p2', { color: '#E53935' })], { phase });
    const r = step(state, message(playerConn(state.players[1]!), msg), 0, deps);
    expect(r.state).toBe(state);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'not-host' }]);
  });
});

describe('kick', () => {
  test('kick removes the player and closes with kicked', () => {
    const ana = makePlayer('p1');
    const bia = makePlayer('p2', { color: '#E53935', score: 12, found: ['casa', 'mesa'] });
    const state = roomWith([ana, bia], { phase: 'round' });
    const r = step(state, message(playerConn(ana), { type: 'kick', playerId: 'p2' }), 0, deps);
    expect(r.state.players.map((p) => p.id)).toEqual(['p1']);
    expect(sentTo(r.effects, 'conn-p2')).toEqual([{ type: 'closed', reason: 'kicked' }]);
    expect(r.effects).toContainEqual({ kind: 'close', to: playerConn(bia) });
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room', 'found:p2'] });
    const [players] = sentTo(r.effects, '*');
    expect(players).toEqual({ type: 'players', players: [expect.objectContaining({ id: 'p1' })], hostId: 'p1' });
    // The token no longer works.
    const back = step(r.state, message(pending('c-back'), { type: 'hello', role: 'player', token: bia.token }), 0, deps);
    expect(allMessages(back.effects)).toEqual([{ type: 'error', code: 'bad-token' }]);
    expect(back.effects).toContainEqual({ kind: 'close', to: pending('c-back') });
  });

  test('kick of a disconnected player closes nothing', () => {
    const ana = makePlayer('p1');
    const state = roomWith([ana, makePlayer('p2', { connected: false, connId: null })]);
    const r = step(state, message(playerConn(ana), { type: 'kick', playerId: 'p2' }), 0, deps);
    expect(r.state.players).toHaveLength(1);
    expect(r.effects.some((e) => e.kind === 'close')).toBe(false);
  });

  test('a kicked player joins again as a new player', () => {
    const { state, conns } = lobbyWith(['Ana', 'Bia']);
    const oldBia = state.players[1]!;
    const withScore: RoomState = {
      ...state,
      players: [state.players[0]!, { ...oldBia, score: 15, found: ['casa'] }],
    };
    const kicked = step(withScore, message(conns[0]!, { type: 'kick', playerId: oldBia.id }), 0, deps).state;
    const r = step(kicked, message(guest('c-Bia-new'), { type: 'join', nickname: 'Bia', color: PALETTE[1] }), 0, deps);
    const newBia = r.state.players[1]!;
    expect(newBia.nickname).toBe('Bia');
    expect(newBia.id).not.toBe(oldBia.id);
    expect(newBia.token).not.toBe(oldBia.token);
    expect(newBia.score).toBe(0);
    expect(newBia.found).toEqual([]);
  });

  test('rejects a host kicking themself', () => {
    const state = roomWith([makePlayer('p1'), makePlayer('p2')]);
    const r = step(state, message(playerConn(state.players[0]!), { type: 'kick', playerId: 'p1' }), 0, deps);
    expect(r.state).toBe(state);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'bad-target' }]);
  });

  test('rejects a kick of an unknown player', () => {
    const state = roomWith([makePlayer('p1')]);
    const r = step(state, message(playerConn(state.players[0]!), { type: 'kick', playerId: 'p7' }), 0, deps);
    expect(r.state).toBe(state);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'bad-target' }]);
  });
});
