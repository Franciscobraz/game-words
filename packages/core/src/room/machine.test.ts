import { describe, expect, test } from 'vitest';
import { step } from './machine.ts';
import {
  CLIENT_MESSAGE_TYPES,
  CLOSE_REASONS,
  type ClientMessageType,
  decodeHashFrame,
  ERROR_CODES,
  type Phase,
  type RoundResultsMessage,
  type ServerMessage,
} from './protocol.ts';
import type { RoomState } from './state.ts';
import {
  allMessages,
  fakeDeps,
  guest,
  makePlayer,
  message,
  newRoom,
  pending,
  playerConn,
  roomWith,
  run,
  sentTo,
  TV_TOKEN,
  tvConn,
} from './test-helpers.ts';

const deps = fakeDeps();

const BOARD = [
  ['A', 'B', 'C', 'D'],
  ['E', 'F', 'G', 'H'],
  ['I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P'],
];

/** A room mid-round: alice (host, 7 points, found two words) and bob. */
function midRound(): RoomState {
  const alice = makePlayer('p1', { nickname: 'Alice', score: 7, found: ['abc', 'efg'], connected: false, connId: null });
  const bob = makePlayer('p2', { nickname: 'Bob', color: '#E53935' });
  return roomWith([alice, bob], {
    phase: 'round',
    roundIndex: 0,
    round: { id: 42, board: BOARD, startsAt: 10_000, endsAt: 130_000, salt: 'c2FsdHNhbHRzYWx0c2FsdA' },
    solutions: { words: ['abc', 'efg'], prefixes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) },
  });
}

describe('TV connections', () => {
  test('sends the full state to a TV with the room token', () => {
    const state = midRound();
    const conn = pending('c-tv');
    const r = step(state, message(conn, { type: 'hello', role: 'tv', token: TV_TOKEN }), 20_000, deps);
    const [welcome] = sentTo(r.effects, 'c-tv');
    expect(welcome).toEqual({
      type: 'welcome',
      role: 'tv',
      code: 'ABCD',
      phase: 'round',
      settings: state.settings,
      players: [
        { id: 'p1', nickname: 'Alice', color: '#FFFFFF', connected: false, spectator: false, score: 7, wins: 0 },
        { id: 'p2', nickname: 'Bob', color: '#E53935', connected: true, spectator: false, score: 0, wins: 0 },
      ],
      hostId: 'p1',
      round: { id: 42, index: 0, board: BOARD, startsAt: 10_000, endsAt: 130_000 },
    });
    expect(r.effects).toContainEqual({ kind: 'bind', conn: tvConn('c-tv') });
    expect(r.state.tvConn).toBe('c-tv');
    expect(r.state.tvOfflineSince).toBeNull();
    // The TV never gets tokens, salts, hashes or round words.
    expect(r.effects.some((e) => e.kind === 'send-hashes')).toBe(false);
    const json = JSON.stringify(sentTo(r.effects, 'c-tv'));
    for (const secret of ['secret-p1', 'secret-p2', TV_TOKEN, 'c2FsdHNhbHRzYWx0c2FsdA', 'abc', 'efg']) {
      expect(json).not.toContain(secret);
    }
  });

  test('sends the full state to a TV with the room token: lobby has no round', () => {
    const r = step(newRoom(), message(pending('c-tv'), { type: 'hello', role: 'tv', token: TV_TOKEN }), 0, deps);
    expect(sentTo(r.effects, 'c-tv')[0]).toMatchObject({ type: 'welcome', role: 'tv', phase: 'lobby', round: null, players: [] });
  });

  test('rejects a TV with a wrong token', () => {
    const state = newRoom();
    const conn = pending('c-tv');
    const r = step(state, message(conn, { type: 'hello', role: 'tv', token: 'not-the-token' }), 0, deps);
    expect(r.state).toBe(state);
    expect(r.effects).toEqual([
      { kind: 'send', to: conn, msg: { type: 'error', code: 'bad-token' } },
      { kind: 'close', to: conn },
    ]);
  });

  test('a new TV connection replaces the old one', () => {
    const hello = { type: 'hello', role: 'tv', token: TV_TOKEN };
    const first = step(newRoom(), message(pending('tv-1'), hello), 0, deps);
    const second = step(first.state, message(pending('tv-2'), hello), 1, deps);
    expect(sentTo(second.effects, 'tv-1')).toEqual([{ type: 'closed', reason: 'replaced' }]);
    expect(second.effects).toContainEqual({ kind: 'close', to: tvConn('tv-1') });
    expect(sentTo(second.effects, 'tv-2')[0]).toMatchObject({ type: 'welcome', role: 'tv' });
    expect(second.state.tvConn).toBe('tv-2');
    // The old socket's close event does not mark the TV away.
    const closed = step(second.state, { kind: 'disconnect', conn: tvConn('tv-1') }, 2, deps);
    expect(closed.state.tvConn).toBe('tv-2');
    expect(closed.state.tvOfflineSince).toBeNull();
  });

  test('a closed TV connection starts the TV absence', () => {
    const first = step(newRoom(), message(pending('tv-1'), { type: 'hello', role: 'tv', token: TV_TOKEN }), 0, deps);
    const r = step(first.state, { kind: 'disconnect', conn: tvConn('tv-1') }, 5000, deps);
    expect(r.state.tvConn).toBeNull();
    expect(r.state.tvOfflineSince).toBe(5000);
  });
});

describe('player connections', () => {
  test('sends the full state to a returning player', () => {
    const state = midRound();
    const conn = pending('c-new');
    const r = step(state, message(conn, { type: 'hello', role: 'player', token: 'secret-p1' }), 20_000, deps);
    const me = { id: 'c-new', role: 'player', playerId: 'p1' } as const;
    expect(r.effects).toContainEqual({ kind: 'bind', conn: me });
    const [welcome] = sentTo(r.effects, 'c-new');
    expect(welcome).toEqual({
      type: 'welcome',
      role: 'player',
      code: 'ABCD',
      phase: 'round',
      settings: state.settings,
      players: [
        { id: 'p1', nickname: 'Alice', color: '#FFFFFF', connected: true, spectator: false, score: 7, wins: 0 },
        { id: 'p2', nickname: 'Bob', color: '#E53935', connected: true, spectator: false, score: 0, wins: 0 },
      ],
      hostId: 'p1',
      round: { id: 42, index: 0, board: BOARD, startsAt: 10_000, endsAt: 130_000 },
      playerId: 'p1',
      found: ['abc', 'efg'],
      salt: 'c2FsdHNhbHRzYWx0c2FsdA',
    });
    const hashes = r.effects.find((e) => e.kind === 'send-hashes');
    expect(hashes).toMatchObject({ to: me });
    const frame = decodeHashFrame((hashes as { frame: ArrayBuffer }).frame);
    expect(frame?.roundId).toBe(42);
    expect([...frame!.prefixes]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const p1 = r.state.players.find((p) => p.id === 'p1')!;
    expect(p1.connected).toBe(true);
    expect(p1.connId).toBe('c-new');
    // Everyone learns that alice is back; nobody else gets her token.
    expect(sentTo(r.effects, '*')).toContainEqual(expect.objectContaining({ type: 'players' }));
    expect(JSON.stringify(allMessages(r.effects))).not.toContain('secret-p1');
  });

  test('a phone without a token reaches the join screen with no round data', () => {
    const state = midRound();
    const r = step(state, message(pending('c-g'), { type: 'hello', role: 'player' }), 20_000, deps);
    expect(r.state).toBe(state);
    expect(r.effects).toContainEqual({ kind: 'bind', conn: guest('c-g') });
    expect(sentTo(r.effects, 'c-g')[0]).toMatchObject({ type: 'welcome', role: 'player', playerId: null, found: [], salt: null });
    expect(r.effects.some((e) => e.kind === 'send-hashes')).toBe(false);
  });

  test('rejects an unknown player token', () => {
    const state = midRound();
    const conn = pending('c-x');
    const r = step(state, message(conn, { type: 'hello', role: 'player', token: 'nobody' }), 0, deps);
    expect(r.state).toBe(state);
    expect(r.effects).toEqual([
      { kind: 'send', to: conn, msg: { type: 'error', code: 'bad-token' } },
      { kind: 'close', to: conn },
    ]);
  });

  test('marks a closed player disconnected and keeps their data', () => {
    const state = midRound();
    const bob = state.players[1]!;
    const bobWithWords = { ...bob, score: 3, found: ['abc'] };
    const before: RoomState = { ...state, players: [state.players[0]!, bobWithWords] };
    const r = step(before, { kind: 'disconnect', conn: playerConn(bob) }, 30_000, deps);
    const after = r.state.players.find((p) => p.id === 'p2')!;
    expect(after.connected).toBe(false);
    expect(after.score).toBe(3);
    expect(after.found).toEqual(['abc']);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
    const [players] = sentTo(r.effects, '*');
    expect(players).toMatchObject({ type: 'players', hostId: 'p1' });
    expect((players as Extract<ServerMessage, { type: 'players' }>).players[1]).toMatchObject({
      id: 'p2',
      connected: false,
      score: 3,
    });
  });

  test('a new player connection replaces the old one', () => {
    const state = midRound();
    const bob = state.players[1]!;
    const r = step(state, message(pending('c-bob-2'), { type: 'hello', role: 'player', token: 'secret-p2' }), 0, deps);
    expect(sentTo(r.effects, 'conn-p2')).toEqual([{ type: 'closed', reason: 'replaced' }]);
    expect(r.effects).toContainEqual({ kind: 'close', to: playerConn(bob) });
    expect(sentTo(r.effects, 'c-bob-2')[0]).toMatchObject({ type: 'welcome', playerId: 'p2' });
    expect(r.state.players[1]!.connId).toBe('c-bob-2');
    // The old socket's close event leaves bob connected.
    const closed = step(r.state, { kind: 'disconnect', conn: playerConn(bob) }, 1, deps);
    expect(closed.state.players[1]!.connected).toBe(true);
    expect(closed.state.players[1]!.connId).toBe('c-bob-2');
  });

  test('keeps a disconnected lobby player listed', () => {
    const alice = makePlayer('p1');
    const bob = makePlayer('p2', { color: '#E53935' });
    const r = step(roomWith([alice, bob]), { kind: 'disconnect', conn: playerConn(bob) }, 0, deps);
    expect(r.state.players.map((p) => [p.id, p.connected])).toEqual([
      ['p1', true],
      ['p2', false],
    ]);
    const [players] = sentTo(r.effects, '*');
    expect((players as Extract<ServerMessage, { type: 'players' }>).players.map((p) => p.id)).toEqual(['p1', 'p2']);
  });

  test('host disconnection starts the host absence', () => {
    const alice = makePlayer('p1');
    const r = step(roomWith([alice, makePlayer('p2')]), { kind: 'disconnect', conn: playerConn(alice) }, 9000, deps);
    expect(r.state.hostOfflineSince).toBe(9000);
    expect(r.state.hostId).toBe('p1');
  });
});

describe('clock sync', () => {
  test('answers a clock sync with both timestamps', () => {
    const state = roomWith([makePlayer('p1')]);
    const conn = playerConn(state.players[0]!);
    const r = step(state, message(conn, { type: 'time', clientTime: 1234.5 }), 99_000, deps);
    expect(r.effects).toEqual([{ kind: 'send', to: conn, msg: { type: 'time', clientTime: 1234.5, serverTime: 99_000 } }]);
    // A clock sync is not an action: the idle clock does not move.
    expect(r.state).toBe(state);
    expect(r.state.lastActionAt).toBe(0);
  });
});

describe('podium', () => {
  const LAST_RESULTS: RoundResultsMessage = { type: 'round-results', index: 1, shared: [], players: [], longest: null, possibleWords: 0, last: true };
  const ana = makePlayer('p1', { nickname: 'Ana', score: 9 });
  const bia = makePlayer('p2', { nickname: 'Bia', color: '#E53935', score: 4 });
  const onPodium = (extra: Partial<RoomState> = {}) => roomWith([ana, bia], { phase: 'podium', results: LAST_RESULTS, ...extra });
  const PODIUM = {
    type: 'podium',
    ranking: [
      { playerId: 'p1', score: 9 },
      { playerId: 'p2', score: 4 },
    ],
  };

  test('sends the last results and the podium after the welcome', () => {
    // PROTO-02 AC 5: the phone that comes back, a guest and the TV.
    const phone = step(onPodium(), message(pending('c-back'), { type: 'hello', role: 'player', token: bia.token }), 0, deps);
    const newcomer = step(onPodium(), message(pending('c-new'), { type: 'hello', role: 'player' }), 0, deps);
    const tv = step(onPodium(), message(pending('c-tv'), { type: 'hello', role: 'tv', token: TV_TOKEN }), 0, deps);
    const CONNECTIONS = [
      [phone.effects, 'c-back'],
      [newcomer.effects, 'c-new'],
      [tv.effects, 'c-tv'],
    ] as const;
    for (const [effects, id] of CONNECTIONS) {
      const sent = sentTo(effects, id);
      expect(sent.map((m) => m.type)).toEqual(['welcome', 'round-results', 'podium']);
      expect(sent[1]).toEqual(LAST_RESULTS);
      expect(sent[2]).toEqual(PODIUM);
    }
  });

  test('sends the last results and the podium after the welcome: only the podium without results', () => {
    const r = step(onPodium({ results: null }), message(pending('c-new'), { type: 'hello', role: 'player' }), 0, deps);
    expect(sentTo(r.effects, 'c-new').map((m) => m.type)).toEqual(['welcome', 'podium']);
  });

  test('refuses next on the podium', () => {
    const state = onPodium();
    const r = step(state, message(playerConn(ana), { type: 'next' }), 0, deps);
    expect(r.state).toBe(state);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'wrong-phase' }]);
  });
});

describe('dispatch', () => {
  // The phase table of the protocol: which commands each phase accepts (PROTO-01 AC 3).
  const VALID: Record<Phase, ClientMessageType[]> = {
    lobby: ['hello', 'time', 'join', 'settings', 'start', 'transfer-host', 'kick', 'close-room'],
    round: ['hello', 'time', 'join', 'submit', 'back-to-lobby', 'transfer-host', 'kick', 'close-room'],
    results: ['hello', 'time', 'join', 'next', 'back-to-lobby', 'transfer-host', 'kick', 'close-room'],
    podium: ['hello', 'time', 'join', 'play-again', 'back-to-lobby', 'transfer-host', 'kick', 'close-room'],
  };

  /** A well-formed message of each type, from a connection allowed to send it. */
  function sample(state: RoomState, type: ClientMessageType) {
    const host = playerConn(state.players[0]!);
    const msgs: Record<ClientMessageType, [ReturnType<typeof playerConn>, object]> = {
      hello: [pending('c-p'), { type: 'hello', role: 'player' }],
      time: [host, { type: 'time', clientTime: 1 }],
      join: [guest('c-g'), { type: 'join', nickname: 'Carol', color: '#1E88E5' }],
      settings: [host, { type: 'settings', patch: { size: 5 } }],
      start: [host, { type: 'start' }],
      submit: [host, { type: 'submit', paths: [[0, 1, 2]] }],
      next: [host, { type: 'next' }],
      'transfer-host': [host, { type: 'transfer-host', playerId: 'p2' }],
      kick: [host, { type: 'kick', playerId: 'p2' }],
      'play-again': [host, { type: 'play-again' }],
      'back-to-lobby': [host, { type: 'back-to-lobby' }],
      'close-room': [host, { type: 'close-room' }],
    };
    const [conn, msg] = msgs[type];
    return message(conn, msg);
  }

  const ROWS = (Object.keys(VALID) as Phase[]).map((phase) => [phase] as const);

  test.each(ROWS)('rejects every command outside its phase: %s', (phase) => {
    const state = roomWith([makePlayer('p1'), makePlayer('p2', { color: '#E53935' })], { phase });
    const outside = CLIENT_MESSAGE_TYPES.filter((t) => !VALID[phase].includes(t));
    expect(outside.length).toBeGreaterThan(0);
    for (const type of outside) {
      const r = step(state, sample(state, type), 0, deps);
      expect(r.state, type).toBe(state);
      expect(allMessages(r.effects), type).toEqual([{ type: 'error', code: 'wrong-phase' }]);
    }
    for (const type of VALID[phase]) {
      const r = step(state, sample(state, type), 0, deps);
      expect(allMessages(r.effects), type).not.toContainEqual({ type: 'error', code: 'wrong-phase' });
    }
  });

  // Who may send each command; anything else is a malformed conversation.
  const WRONG_ROLE: [ClientMessageType, ReturnType<typeof pending>, object][] = [
    ['hello', guest('c-g'), { type: 'hello', role: 'player' }],
    ['join', pending('c-p'), { type: 'join', nickname: 'Carol', color: '#1E88E5' }],
    ['settings', guest('c-g'), { type: 'settings', patch: { size: 5 } }],
    ['start', tvConn('c-tv'), { type: 'start' }],
    ['submit', guest('c-g'), { type: 'submit', paths: [[0, 1]] }],
    ['next', pending('c-p'), { type: 'next' }],
    ['transfer-host', guest('c-g'), { type: 'transfer-host', playerId: 'p1' }],
    ['kick', tvConn('c-tv'), { type: 'kick', playerId: 'p1' }],
    ['play-again', guest('c-g'), { type: 'play-again' }],
    ['back-to-lobby', tvConn('c-tv'), { type: 'back-to-lobby' }],
    ['close-room', tvConn('c-tv'), { type: 'close-room' }],
  ];

  test.each(WRONG_ROLE)('rejects %s from a connection that may not send it', (_type, conn, msg) => {
    const state = roomWith([makePlayer('p1')], { tvConn: 'c-tv' });
    const r = step(state, message(conn, msg), 0, deps);
    expect(r.state).toBe(state);
    expect(allMessages(r.effects)).toEqual([{ type: 'error', code: 'bad-message' }]);
  });

  test('time is accepted from every connection role', () => {
    const state = roomWith([makePlayer('p1')], { tvConn: 'c-tv' });
    for (const conn of [pending('c-p'), guest('c-g'), tvConn('c-tv'), playerConn(state.players[0]!)]) {
      const r = step(state, message(conn, { type: 'time', clientTime: 5 }), 7, deps);
      expect(allMessages(r.effects), conn.role).toEqual([{ type: 'time', clientTime: 5, serverTime: 7 }]);
    }
  });

  test('answers bad-message to malformed input without changing the state', () => {
    const state = roomWith([makePlayer('p1')]);
    const conn = playerConn(state.players[0]!);
    const r = step(state, { kind: 'message', conn, data: '{not json' }, 0, deps);
    expect(r.state).toBe(state);
    expect(r.effects).toEqual([{ kind: 'send', to: conn, msg: { type: 'error', code: 'bad-message' } }]);
  });

  test('ignores messages from a connection that was replaced', () => {
    const state = roomWith([makePlayer('p1')], { tvConn: 'tv-new' });
    const stalePlayer = { id: 'old', role: 'player', playerId: 'p1' } as const;
    for (const conn of [tvConn('tv-old'), stalePlayer]) {
      const r = step(state, message(conn, { type: 'time', clientTime: 1 }), 0, deps);
      expect(r).toEqual({ state, effects: [] });
    }
  });

  test('sends codes, never display text', () => {
    const state = roomWith([makePlayer('p1')], { phase: 'round' });
    const host = playerConn(state.players[0]!);
    const { effects } = run(state, [
      { kind: 'message', conn: host, data: 'garbage' },
      message(host, { type: 'start' }),
      message(guest('c-g'), { type: 'start' }),
      message(pending('c-1'), { type: 'hello', role: 'tv', token: 'wrong' }),
      message(pending('c-2'), { type: 'hello', role: 'player', token: 'wrong' }),
      message(pending('c-3'), { type: 'hello', role: 'player', token: 'secret-p1' }),
    ]);
    const errors = allMessages(effects).filter((m) => m.type === 'error' || m.type === 'closed');
    expect(errors.map((m) => (m.type === 'error' ? m.code : m.type === 'closed' ? m.reason : ''))).toEqual([
      'bad-message',
      'wrong-phase',
      'bad-message',
      'bad-token',
      'bad-token',
      'replaced',
    ]);
    for (const m of errors) {
      if (m.type === 'error') {
        expect(Object.keys(m).sort()).toEqual(['code', 'type']);
        expect(ERROR_CODES).toContain(m.code);
      } else if (m.type === 'closed') {
        expect(Object.keys(m).sort()).toEqual(['reason', 'type']);
        expect(CLOSE_REASONS).toContain(m.reason);
      }
    }
  });
});
