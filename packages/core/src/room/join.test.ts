import { describe, expect, test } from 'vitest';
import { contrastRatio, PALETTE, TV_BACKGROUND, ciede2000 } from './colors.ts';
import { step } from './machine.ts';
import type { ErrorCode, Phase, ServerMessage } from './protocol.ts';
import type { RoomState } from './state.ts';
import { allMessages, fakeDeps, guest, makePlayer, message, newRoom, roomWith, sentTo } from './test-helpers.ts';

function join(state: RoomState, connId: string, nickname: string, color: string, now = 0) {
  return step(state, message(guest(connId), { type: 'join', nickname, color }), now, fakeDeps());
}

function expectRejected(state: RoomState, r: ReturnType<typeof join>, code: ErrorCode) {
  expect(r.state).toBe(state);
  expect(allMessages(r.effects)).toEqual([{ type: 'error', code }]);
}

describe('join', () => {
  test('registers a player, returns a token and announces the join', () => {
    const state = newRoom();
    const r = join(state, 'c-ana', '  Ana  ', '#E53935', 5000);
    expect(r.state.players).toHaveLength(1);
    const ana = r.state.players[0]!;
    expect(ana).toMatchObject({
      nickname: 'Ana',
      color: '#E53935',
      connected: true,
      connId: 'c-ana',
      spectator: false,
      score: 0,
      found: [],
      joinedAt: 5000,
    });
    expect(ana.token).toBe('token-1');
    expect(r.effects).toContainEqual({ kind: 'bind', conn: { id: 'c-ana', role: 'player', playerId: ana.id } });
    // The token goes only to the phone that joined.
    expect(sentTo(r.effects, 'c-ana')).toEqual([{ type: 'joined', playerId: ana.id, token: 'token-1' }]);
    expect(sentTo(r.effects, '*')).toEqual([
      {
        type: 'players',
        players: [{ id: ana.id, nickname: 'Ana', color: '#E53935', connected: true, spectator: false, score: 0 }],
        hostId: r.state.hostId,
      },
    ]);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
    // Joining is an action for the idle timeout.
    expect(r.state.lastActionAt).toBe(5000);
  });

  test('gives each player a distinct id and token', () => {
    const deps = fakeDeps();
    const a = step(newRoom(), message(guest('c1'), { type: 'join', nickname: 'Ana', color: PALETTE[0] }), 0, deps);
    const b = step(a.state, message(guest('c2'), { type: 'join', nickname: 'Bia', color: PALETTE[1] }), 0, deps);
    const [p1, p2] = b.state.players;
    expect(p1!.id).not.toBe(p2!.id);
    expect(p1!.token).not.toBe(p2!.token);
  });

  test('accepts 2 to 12 characters after trimming', () => {
    const state = newRoom();
    expect(join(state, 'c', ' Ab ', '#E53935').state.players[0]?.nickname).toBe('Ab');
    expect(join(state, 'c', 'Abcdefghijkl', '#E53935').state.players[0]?.nickname).toBe('Abcdefghijkl');
    expectRejected(state, join(state, 'c', ' A ', '#E53935'), 'bad-nickname');
    expectRejected(state, join(state, 'c', 'Abcdefghijklm', '#E53935'), 'bad-nickname');
  });

  test('rejects a nickname equal ignoring case and accents', () => {
    const state = roomWith([makePlayer('p1', { nickname: 'João' })]);
    expectRejected(state, join(state, 'c', 'joao', '#E53935'), 'nickname-taken');
    expectRejected(state, join(state, 'c', 'JOÃO', '#E53935'), 'nickname-taken');
    expect(join(state, 'c', 'Joana', '#E53935').state.players).toHaveLength(2);
  });

  test('rejects a color that is not #RRGGBB', () => {
    const state = newRoom();
    for (const color of ['E53935', '#E5393', '#E539355', '#GGGGGG', 'red', '']) {
      expectRejected(state, join(state, 'c', 'Ana', color), 'bad-color');
    }
  });

  test('rejects a color below 3:1 on the TV background', () => {
    const state = newRoom();
    expect(contrastRatio('#333333', TV_BACKGROUND)).toBeLessThan(3);
    expectRejected(state, join(state, 'c', 'Ana', '#333333'), 'color-illegible');
  });

  test('rejects a color closer than 20 to another player', () => {
    const state = roomWith([makePlayer('p1', { color: '#E53935' })]);
    expect(ciede2000('#E53935', '#E0403A')).toBeLessThan(20);
    expectRejected(state, join(state, 'c', 'Ana', '#E0403A'), 'color-too-similar');
    // Disconnected players keep their color.
    const away = roomWith([makePlayer('p1', { color: '#E53935', connected: false, connId: null })]);
    expectRejected(away, join(away, 'c', 'Ana', '#E0403A'), 'color-too-similar');
  });

  test('rejects the 11th player with room-full', () => {
    let state = newRoom();
    for (let i = 0; i < 9; i++) state = join(state, `c${i}`, `Player ${i}`, PALETTE[i]!).state;
    // The 10th player joins (L-001).
    state = join(state, 'c9', 'Player 9', PALETTE[9]!).state;
    expect(state.players).toHaveLength(10);
    // Disconnected players still take a slot.
    const conn = state.players[3]!.connId!;
    state = step(state, { kind: 'disconnect', conn: { id: conn, role: 'player', playerId: state.players[3]!.id } }, 0, fakeDeps()).state;
    expect(state.players[3]!.connected).toBe(false);
    expectRejected(state, join(state, 'c10', 'Eleventh', '#000000'), 'room-full');
  });

  const LATE: [Phase, number][] = [
    ['round', 1000],
    ['round', 20_000],
    ['results', 200_000],
  ];

  test.each(LATE)('joins as a spectator during countdown, round and results: %s at %i', (phase, now) => {
    const state = roomWith([makePlayer('p1', { score: 9 })], {
      phase,
      round: { id: 1, board: [['A']], startsAt: 3000, endsAt: 123_000, salt: 's' },
    });
    const r = join(state, 'c-late', 'Late', '#E53935', now);
    const late = r.state.players[1]!;
    expect(late.spectator).toBe(true);
    expect(late.score).toBe(0);
    const players = sentTo(r.effects, '*')[0] as Extract<ServerMessage, { type: 'players' }>;
    expect(players.players[1]).toMatchObject({ nickname: 'Late', spectator: true, score: 0 });
  });

  test('joins as a regular player in the lobby', () => {
    expect(join(newRoom(), 'c', 'Ana', '#E53935').state.players[0]!.spectator).toBe(false);
  });
});
