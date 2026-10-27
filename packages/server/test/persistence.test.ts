import { type RoomState, type RoundSolutions } from '@bwords/core';
import { evictDurableObject, runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { joinPhone, liveState, roomWithTv, setClock, solutionPaths, startRound, stubOf, T0 } from './room.ts';
import type { RoomDO } from '../src/room-do.ts';
import { connect } from './ws.ts';

const get = <T>(code: string, key: string) => runInDurableObject(stubOf(code), (_, state) => state.storage.get<T>(key));

/** What PERSIST-01 AC 2 says a rebuilt room keeps. */
const durable = (s: RoomState | null) =>
  s && {
    code: s.code,
    tvToken: s.tvToken,
    phase: s.phase,
    settings: s.settings,
    players: s.players,
    hostId: s.hostId,
    roundIndex: s.roundIndex,
    round: s.round,
    solutions: s.solutions,
  };

describe('persistence', () => {
  it('stores the state before the client sees it', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    // The join is stored by the time the phone holds its token.
    const room = await get<RoomState>(code, 'room');
    expect(room?.players.map((p) => [p.id, p.token, p.nickname])).toEqual([[a.playerId, a.token, 'Ana']]);

    const start = await startRound(a, [tv]);
    const hashes = await a.client.hashes();
    const solutions = await get<RoundSolutions>(code, 'round:solutions');
    expect(solutions?.words).toEqual(solutionPaths(start.board).map((s) => s.word));
    expect(solutions?.prefixes).toEqual(hashes.prefixes);

    await setClock(code, start.startsAt);
    const word = solutionPaths(start.board)[0]!;
    a.client.send({ type: 'submit', paths: [word.path] });
    expect(await a.client.next('submit-result')).toEqual({ type: 'submit-result', results: [{ ok: true, word: word.word }] });
    expect(await get<string[]>(code, `found:${a.playerId}`)).toEqual([word.word]);
  });

  it('rebuilds a room mid-round after eviction', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const b = await joinPhone(code, 'Bia', 1);
    a.client.send({ type: 'settings', patch: { seconds: 60, rounds: 2, minLength: 3 } });
    await a.client.skipTo('settings');
    const start = await startRound(a, [b.client, tv]);
    await setClock(code, start.startsAt + 1000);
    const [w1, w2, w3] = solutionPaths(start.board);
    a.client.send({ type: 'submit', paths: [w1!.path, w2!.path] });
    await a.client.skipTo('submit-result');
    b.client.send({ type: 'submit', paths: [w2!.path, w3!.path] });
    await b.client.skipTo('submit-result');

    const before = await liveState(code);
    expect(before?.players.map((p) => p.found)).toEqual([[w1!.word, w2!.word], [w2!.word, w3!.word]]);
    await evictDurableObject(stubOf(code));
    // A new instance: its clock is the runtime's again, not the test's.
    expect(await runInDurableObject(stubOf(code), (room: RoomDO) => room.clock() < T0)).toBe(true);
    const after = await liveState(code);
    expect(after?.phase).toBe('round');
    expect(durable(after)).toEqual(durable(before));

    // The round ends on time and scores the words found before the eviction.
    await setClock(code, start.endsAt + 300);
    expect(await runDurableObjectAlarm(stubOf(code))).toBe(true);
    const ended = await liveState(code);
    expect(ended?.phase).toBe('results');
    expect(ended?.players.every((p) => p.score > 0)).toBe(true);
  });

  it('keeps sockets open across hibernation', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const start = await startRound(a, [tv]);
    await a.client.hashes();
    await evictDurableObject(stubOf(code));
    expect(a.client.closed).toBe(false);
    expect(tv.closed).toBe(false);

    // The new instance has the clock of the runtime again.
    await setClock(code, start.startsAt);
    const word = solutionPaths(start.board)[0]!;
    a.client.send({ type: 'submit', paths: [word.path] });
    expect(await a.client.next('submit-result')).toEqual({ type: 'submit-result', results: [{ ok: true, word: word.word }] });
    expect(await tv.skipTo('counts')).toEqual({ type: 'counts', counts: [{ playerId: a.playerId, count: 1 }] });
    a.client.sendRaw('ping');
    expect(await a.client.nextFrame()).toEqual({ kind: 'text', text: 'pong' });
  });

  it('keeps wins across reconnection and eviction', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const b = await joinPhone(code, 'Bia', 1);
    const start = await startRound(a, [b.client, tv]);
    await setClock(code, start.startsAt);
    a.client.send({ type: 'submit', paths: [solutionPaths(start.board)[0]!.path] });
    await a.client.skipTo('submit-result');
    await setClock(code, start.endsAt + 300);
    await runDurableObjectAlarm(stubOf(code));
    await a.client.skipTo('round-results');
    a.client.send({ type: 'next' });
    await a.client.skipTo('podium');

    const winsIn = (players: { id: string; wins: number }[]) => players.map((p) => [p.id, p.wins]);
    const expected = [
      [a.playerId, 1],
      [b.playerId, 0],
    ];

    // Ana comes back on a new socket.
    a.client.close();
    const back = await connect(code);
    back.send({ type: 'hello', role: 'player', token: a.token });
    expect(winsIn((await back.next('welcome')).players)).toEqual(expected);

    // The object is rebuilt from storage.
    await evictDurableObject(stubOf(code), { webSockets: 'close' });
    const bia = await connect(code);
    bia.send({ type: 'hello', role: 'player', token: b.token });
    expect(winsIn((await bia.next('welcome')).players)).toEqual(expected);
  });
});
