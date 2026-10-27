import { describe, expect, test } from 'vitest';
import type { Effect } from './effects.ts';
import { step } from './machine.ts';
import { type PreparedRound, prepareRound } from './prepare.ts';
import { decodeHashFrame, type Settings } from './protocol.ts';
import { DEFAULT_SETTINGS, type RoomState } from './state.ts';
import { allMessages, fakeDeps, makePlayer, message, playerConn, richPack, roomWith, sentTo } from './test-helpers.ts';

const deps = fakeDeps();
const SALT = new Uint8Array(16).map((_, i) => i * 7 + 1);

function prepare(settings: Settings = DEFAULT_SETTINGS, seed = 9): Promise<PreparedRound> {
  return prepareRound(richPack(), settings, seed, SALT);
}

/** A lobby with alice (host), bob, an offline carol and the TV; the board for `settings` is already prepared. */
async function readyLobby(settings: Settings = DEFAULT_SETTINGS) {
  const alice = makePlayer('p1', { nickname: 'Alice' });
  const bob = makePlayer('p2', { nickname: 'Bob', color: '#E53935' });
  const carol = makePlayer('p3', { nickname: 'Carol', color: '#1E88E5', connected: false, connId: null });
  const lobby = roomWith([alice, bob, carol], { tvConn: 'c-tv', tvOfflineSince: null, settings });
  const prepared = await prepare(settings);
  const state = step(lobby, { kind: 'prepared', round: prepared }, 500, deps).state;
  return { state, prepared, alice, bob, carol };
}

const roundStarts = (effects: Effect[]) => allMessages(effects).filter((m) => m.type === 'round-start');

describe('round start', () => {
  test.each([30, 120, 180] as const)('start sends the board and the round timestamps: %i s', async (seconds) => {
    const { state, prepared, alice } = await readyLobby({ ...DEFAULT_SETTINGS, seconds });
    const r = step(state, message(playerConn(alice), { type: 'start' }), 10_000, deps);
    const round = { id: 1, index: 0, board: prepared.board, startsAt: 13_000, endsAt: 13_000 + seconds * 1000 };
    // The TV and the guests get the round without the salt.
    expect(r.effects).toContainEqual({
      kind: 'broadcast',
      msg: { type: 'round-start', ...round },
      roles: ['tv', 'guest'],
    });
    // Every connected phone gets the same round with the salt.
    for (const id of ['conn-p1', 'conn-p2']) {
      expect(sentTo(r.effects, id)).toEqual([{ type: 'round-start', ...round, salt: prepared.salt }]);
    }
    expect(r.state.phase).toBe('round');
    expect(r.state.round).toEqual({ id: 1, board: prepared.board, startsAt: 13_000, endsAt: 13_000 + seconds * 1000, salt: prepared.salt });
    expect(r.state.solutions).toEqual(prepared.solutions);
    expect(r.state.nextRound).toBeNull();
    expect(r.state.lastActionAt).toBe(10_000);
    expect(r.effects).toContainEqual({
      kind: 'persist',
      keys: ['room', 'round:solutions', 'round:next', 'found:p1', 'found:p2', 'found:p3'],
    });
  });

  test('phones get the salt and hash prefixes, never words', async () => {
    const { state, prepared, alice, carol } = await readyLobby();
    const r = step(state, message(playerConn(alice), { type: 'start' }), 10_000, deps);
    for (const id of ['conn-p1', 'conn-p2']) {
      const [start] = sentTo(r.effects, id);
      expect(start).toMatchObject({ type: 'round-start', salt: prepared.salt });
      const hashes = r.effects.filter((e) => e.kind === 'send-hashes' && e.to.id === id);
      expect(hashes).toHaveLength(1);
      const frame = decodeHashFrame((hashes[0] as { frame: ArrayBuffer }).frame);
      expect(frame?.roundId).toBe(1);
      expect(frame?.prefixes).toEqual(prepared.solutions.prefixes);
    }
    // The offline phone gets nothing now; it gets the salt and hashes when it comes back.
    const toCarol = r.effects.filter(
      (e) => (e.kind === 'send' || e.kind === 'send-hashes') && e.to.role === 'player' && e.to.playerId === carol.id,
    );
    expect(toCarol).toEqual([]);
    // The TV gets neither the salt nor the hashes.
    const tvStart = roundStarts(r.effects).find((m) => !('salt' in m));
    expect(tvStart).toBeDefined();
    expect(r.effects.filter((e) => e.kind === 'send-hashes').map((e) => (e as { to: { id: string } }).to.id).sort()).toEqual([
      'conn-p1',
      'conn-p2',
    ]);
    // No solution goes out as text.
    const json = JSON.stringify(allMessages(r.effects));
    expect(prepared.solutions.words.length).toBeGreaterThan(0);
    for (const w of prepared.solutions.words) expect(json, w).not.toContain(`"${w}"`);
  });

  test('turns spectators into players at the next countdown', async () => {
    const ana = makePlayer('p1', { score: 9, found: ['abc'] });
    const late = makePlayer('p2', { color: '#E53935', spectator: true });
    const prepared = await prepare({ ...DEFAULT_SETTINGS, rounds: 2 });
    // In the results of round 1 the host already asked for the next round; the board arrives now.
    const results: RoomState = roomWith([ana, late], {
      phase: 'results',
      roundIndex: 0,
      settings: { ...DEFAULT_SETTINGS, rounds: 2 },
      round: { id: 1, board: prepared.board, startsAt: 0, endsAt: 1000, salt: 'old' },
      pendingStart: true,
    });
    const r = step(results, { kind: 'prepared', round: prepared }, 50_000, deps);
    expect(r.state.phase).toBe('round');
    expect(r.state.roundIndex).toBe(1);
    expect(r.state.round?.id).toBe(2);
    expect(r.state.round?.startsAt).toBe(53_000);
    expect(r.state.players.map((p) => [p.id, p.spectator, p.score, p.found])).toEqual([
      ['p1', false, 9, []],
      ['p2', false, 0, []],
    ]);
    // The former spectator gets the salt and the hashes like everyone else.
    expect(sentTo(r.effects, 'conn-p2')[0]).toMatchObject({ type: 'round-start', salt: prepared.salt });
  });

  test('start without a prepared board asks for one and starts when it arrives', async () => {
    const alice = makePlayer('p1');
    const lobby = roomWith([alice]);
    const asked = step(lobby, message(playerConn(alice), { type: 'start' }), 1000, deps);
    expect(asked.effects).toEqual([{ kind: 'prepare-next' }]);
    expect(asked.state.phase).toBe('lobby');
    expect(asked.state.pendingStart).toBe(true);
    const prepared = await prepare();
    const r = step(asked.state, { kind: 'prepared', round: prepared }, 1200, deps);
    expect(r.state.phase).toBe('round');
    expect(r.state.pendingStart).toBe(false);
    expect(r.state.round?.startsAt).toBe(4200);
    expect(sentTo(r.effects, 'conn-p1')[0]).toMatchObject({ type: 'round-start', startsAt: 4200 });
  });

  test('a board prepared for other settings is not used', async () => {
    const { state, alice } = await readyLobby();
    // The host changed the board size after the board was prepared.
    const changed = step(state, message(playerConn(alice), { type: 'settings', patch: { size: 5 } }), 600, deps).state;
    const r = step(changed, message(playerConn(alice), { type: 'start' }), 700, deps);
    expect(r.effects).toEqual([{ kind: 'prepare-next' }]);
    expect(r.state.phase).toBe('lobby');
    // A stale board arriving while the host waits is dropped and asked for again.
    const stale = step(r.state, { kind: 'prepared', round: await prepare() }, 800, deps);
    expect(stale.state).toBe(r.state);
    expect(stale.effects).toEqual([{ kind: 'prepare-next' }]);
    const fresh = step(r.state, { kind: 'prepared', round: await prepare({ ...DEFAULT_SETTINGS, size: 5 }) }, 900, deps);
    expect(fresh.state.phase).toBe('round');
    expect(fresh.state.round?.board).toHaveLength(5);
  });

  test('a prepared board waits in the lobby without starting', async () => {
    const lobby = roomWith([makePlayer('p1')]);
    const prepared = await prepare();
    const r = step(lobby, { kind: 'prepared', round: prepared }, 0, deps);
    expect(r.state.phase).toBe('lobby');
    expect(r.state.nextRound).toEqual({ board: prepared.board, salt: prepared.salt, options: prepared.options });
    expect(r.state.nextSolutions).toEqual(prepared.solutions);
    expect(r.effects).toEqual([{ kind: 'persist', keys: ['room', 'round:next'] }]);
  });

  test.each(['round', 'podium'] as const)('ignores a prepared board in the %s phase', async (phase) => {
    const state = roomWith([makePlayer('p1')], { phase });
    const r = step(state, { kind: 'prepared', round: await prepare() }, 0, deps);
    expect(r).toEqual({ state, effects: [] });
  });

  test('ignores a prepared board in the results of the last round', async () => {
    const state = roomWith([makePlayer('p1')], { phase: 'results', roundIndex: 0 });
    const r = step(state, { kind: 'prepared', round: await prepare() }, 0, deps);
    expect(r).toEqual({ state, effects: [] });
  });
});
