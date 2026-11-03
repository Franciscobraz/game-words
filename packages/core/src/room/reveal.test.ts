import { describe, expect, test } from 'vitest';
import { step } from './machine.ts';
import { prepareRound } from './prepare.ts';
import type { RoundResultsMessage } from './protocol.ts';
import { DEFAULT_SETTINGS, type RoomState } from './state.ts';
import { allMessages, fakeDeps, guest, makePlayer, message, playerConn, richPack, roomWith, run, sentTo, tvConn } from './test-helpers.ts';

const deps = fakeDeps(richPack());
const TWO_ROUNDS = { ...DEFAULT_SETTINGS, rounds: 2 as const, seconds: 60 as const };
const SALT = new Uint8Array(16).fill(5);

const ana = makePlayer('p1', { nickname: 'Ana', score: 9, words: 4 });
const beto = makePlayer('p2', { nickname: 'Beto', color: '#E53935', score: 14, words: 6 });
const caio = makePlayer('p3', { nickname: 'Caio', color: '#1E88E5', score: 3, words: 1 });

/** The results of round `index`, as the TV got them when the round ended. */
function resultsOf(index: number, last: boolean): RoundResultsMessage {
  return {
    type: 'round-results',
    index,
    shared: [{ word: 'cor', points: 1, foundBy: ['p1', 'p2'] }],
    players: [
      { playerId: 'p3', unique: [], roundPoints: 3, roundWords: 1, score: 3, words: 1 },
      { playerId: 'p1', unique: [{ word: 'casa', points: 4 }], roundPoints: 9, roundWords: 4, score: 9, words: 4 },
      { playerId: 'p2', unique: [{ word: 'tela', points: 4 }], roundPoints: 14, roundWords: 6, score: 14, words: 6 },
    ],
    longest: null,
    possibleWords: 30,
    last,
  };
}

/** A room on the words of round `roundIndex` of two, hosted by Ana, with the TV connected. */
function onWords(roundIndex: number, extra: Partial<RoomState> = {}): RoomState {
  return roomWith([ana, beto, caio], {
    phase: 'words',
    settings: TWO_ROUNDS,
    tvConn: 'c-tv',
    tvOfflineSince: null,
    roundIndex,
    round: { id: roundIndex + 1, board: [['a']], startsAt: 0, endsAt: 60_000, salt: 'salt' },
    results: resultsOf(roundIndex, roundIndex === 1),
    ...extra,
  });
}

const host = playerConn(ana);

describe('host list commands', () => {
  test('refuses scroll and show-result from anyone but the host', () => {
    // WORDCTL-01 AC 10: another player is not the host; a guest or the TV may not send them at all.
    const state = onWords(0);
    const SENDERS = [
      [playerConn(beto), 'not-host'],
      [guest('c-g'), 'bad-message'],
      [tvConn('c-tv'), 'bad-message'],
    ] as const;
    const COMMANDS = [{ type: 'scroll', direction: 'down' }, { type: 'scroll', direction: 'up' }, { type: 'show-result' }];

    for (const [conn, code] of SENDERS) {
      for (const command of COMMANDS) {
        const r = step(state, message(conn, command), 70_000, deps);
        expect(r.state, `${conn.role} ${command.type}`).toBe(state);
        expect(allMessages(r.effects), `${conn.role} ${command.type}`).toEqual([{ type: 'error', code }]);
      }
    }
  });

  test('relays the host scroll to the tv only', () => {
    // WORDCTL-01 AC 5-6.
    const state = onWords(0);

    const down = step(state, message(host, { type: 'scroll', direction: 'down' }), 70_000, deps);
    const up = step(state, message(host, { type: 'scroll', direction: 'up' }), 70_000, deps);

    expect(sentTo(down.effects, 'c-tv')).toEqual([{ type: 'scroll', direction: 'down' }]);
    expect(sentTo(up.effects, 'c-tv')).toEqual([{ type: 'scroll', direction: 'up' }]);
    for (const r of [down, up]) {
      expect(allMessages(r.effects)).toHaveLength(1);
      expect(r.state.phase).toBe('words');
      // A step is a host action for the idle timeout.
      expect(r.state.lastActionAt).toBe(70_000);
    }

    // Without a TV the step goes to nobody.
    const noTv = step(onWords(0, { tvConn: null, tvOfflineSince: 65_000 }), message(host, { type: 'scroll', direction: 'down' }), 70_000, deps);
    expect(allMessages(noTv.effects)).toEqual([]);
  });

  test('opens the results in the middle of the match on show-result', () => {
    // WORDCTL-01 AC 8, SYNC-01 AC 2: the phones and guests get the results only now.
    const state = onWords(0);

    const r = step(state, message(host, { type: 'show-result' }), 80_000, deps);

    expect(r.state.phase).toBe('results');
    expect(r.state.lastActionAt).toBe(80_000);
    const broadcasts = r.effects.flatMap((e) => (e.kind === 'broadcast' ? [e] : []));
    expect(broadcasts).toEqual([
      { kind: 'broadcast', msg: resultsOf(0, false), roles: ['player', 'guest'] },
      { kind: 'broadcast', msg: { type: 'phase', phase: 'results' } },
    ]);
    expect(r.effects.filter((e) => e.kind === 'send')).toEqual([]);
    expect(r.effects).toContainEqual({ kind: 'persist', keys: ['room'] });
  });

  test('opens the podium after the last round on show-result', () => {
    // SYNC-01 AC 3: the podium reaches the TV and the phones together.
    const state = onWords(1);

    const r = step(state, message(host, { type: 'show-result' }), 80_000, deps);

    expect(r.state.phase).toBe('podium');
    const broadcasts = r.effects.flatMap((e) => (e.kind === 'broadcast' ? [e] : []));
    expect(broadcasts).toEqual([
      { kind: 'broadcast', msg: resultsOf(1, true), roles: ['player', 'guest'] },
      {
        kind: 'broadcast',
        msg: {
          type: 'podium',
          ranking: [
            { playerId: 'p2', score: 14 },
            { playerId: 'p1', score: 9 },
            { playerId: 'p3', score: 3 },
          ],
        },
      },
    ]);
  });

  test.each([
    ['in the middle of the match', 0, 'results'],
    ['after the last round', 1, 'podium'],
  ] as const)('refuses a second show-result: %s', (_name, roundIndex, phase) => {
    // Edge Cases: the second tap does not skip the result.
    const first = step(onWords(roundIndex), message(host, { type: 'show-result' }), 80_000, deps);

    const second = step(first.state, message(host, { type: 'show-result' }), 80_100, deps);

    expect(second.state).toBe(first.state);
    expect(second.state.phase).toBe(phase);
    expect(allMessages(second.effects)).toEqual([{ type: 'error', code: 'wrong-phase' }]);
  });

  test('goes back to the lobby from the words', () => {
    // Edge Cases: the TV, the phones and the guests go to the lobby.
    const r = step(onWords(0), message(host, { type: 'back-to-lobby' }), 80_000, deps);

    expect(r.state.phase).toBe('lobby');
    expect(r.state.results).toBeNull();
    expect(sentTo(r.effects, 'c-tv')).toEqual([expect.objectContaining({ type: 'welcome', role: 'tv', phase: 'lobby' })]);
    for (const p of [ana, beto, caio]) {
      expect(sentTo(r.effects, p.connId!)).toEqual([expect.objectContaining({ type: 'welcome', phase: 'lobby', playerId: p.id })]);
    }
    const toGuests = r.effects.filter((e) => e.kind === 'broadcast' && e.roles?.includes('guest'));
    expect(toGuests).toEqual([
      expect.objectContaining({ msg: expect.objectContaining({ type: 'welcome', phase: 'lobby', playerId: null }) }),
    ]);
  });

  test('keeps the next round ready and makes a newcomer a spectator on the words', async () => {
    // SYNC-01 AC 2: the board asked for at the end of the round is kept on the words.
    const prepared = await prepareRound(richPack(), TWO_ROUNDS, 7, SALT);
    const state = onWords(0);

    const r = run(
      state,
      [{ kind: 'prepared', round: prepared }, message(guest('c-duda'), { type: 'join', nickname: 'Duda', color: '#43A047' })],
      70_000,
      deps,
    );

    expect(r.state.nextRound?.board).toEqual(prepared.board);
    const duda = r.state.players.find((p) => p.nickname === 'Duda')!;
    expect(duda.spectator).toBe(true);
    // The result and then `next` start round 2 with that board at once, Duda playing.
    const next = run(r.state, [message(host, { type: 'show-result' }), message(host, { type: 'next' })], 80_000, deps);
    expect(next.state.phase).toBe('round');
    expect(next.state.round?.board).toEqual(prepared.board);
    expect(next.state.players.find((p) => p.id === duda.id)?.spectator).toBe(false);
  });
});
