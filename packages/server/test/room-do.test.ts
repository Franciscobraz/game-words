import { HASH_PREFIX_BYTES } from '@bwords/core';
import { describe, expect, it } from 'vitest';
import { joinPhone, roomWithTv, setClock, solutionPaths, T0 } from './room.ts';
import { connect } from './ws.ts';

describe('RoomDO', () => {
  it('a TV and two phones join, submit and get the answers over real WebSockets', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const b = await joinPhone(code, 'Bia', 1);

    // Everyone hears about both joins.
    const tvPlayers = (await tv.skipTo('players')) && (await tv.skipTo('players'));
    expect(tvPlayers.players.map((p) => p.nickname)).toEqual(['Ana', 'Bia']);
    expect((await a.client.skipTo('players')).players.map((p) => p.id)).toEqual([a.playerId]);
    expect((await a.client.skipTo('players')).players.map((p) => p.id)).toEqual([a.playerId, b.playerId]);
    expect(tvPlayers.hostId).toBe(a.playerId);

    a.client.send({ type: 'start' });
    const tvStart = await tv.skipTo('round-start');
    expect(tvStart.startsAt).toBe(T0 + 3000);
    expect(tvStart.salt).toBeUndefined();
    const aStart = await a.client.skipTo('round-start');
    const bStart = await b.client.skipTo('round-start');
    expect(aStart.board).toEqual(tvStart.board);
    expect(bStart.salt).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const frame = await a.client.hashes();
    const solutions = solutionPaths(aStart.board);
    expect(frame.roundId).toBe(aStart.id);
    expect(frame.prefixes.length).toBe(solutions.length * HASH_PREFIX_BYTES);

    await setClock(code, aStart.startsAt);
    const [first, second] = solutions;
    a.client.send({ type: 'submit', paths: [first!.path, first!.path] });
    expect(await a.client.next('submit-result')).toEqual({
      type: 'submit-result',
      results: [
        { ok: true, word: first!.word },
        { ok: false, reason: 'already-found' },
      ],
    });
    expect(await tv.skipTo('counts')).toEqual({
      type: 'counts',
      counts: [
        { playerId: a.playerId, count: 1 },
        { playerId: b.playerId, count: 0 },
      ],
    });
    await b.client.hashes();
    b.client.send({ type: 'submit', paths: [second!.path] });
    expect(await b.client.next('submit-result')).toEqual({ type: 'submit-result', results: [{ ok: true, word: second!.word }] });
  });

  it('answers ping with pong through the auto-response', async () => {
    const { code } = await roomWithTv();
    const client = await connect(code);
    client.sendRaw('ping');
    expect(await client.nextFrame()).toEqual({ kind: 'text', text: 'pong' });
  });

  it('closes the old socket when the same player connects again', async () => {
    const { code } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const again = await connect(code);
    again.send({ type: 'hello', role: 'player', token: a.token });
    expect(await again.next('welcome')).toMatchObject({ role: 'player', playerId: a.playerId });
    expect(await a.client.skipTo('closed')).toEqual({ type: 'closed', reason: 'replaced' });
    await a.client.waitClosed();
  });

  it('answers bad-message to a binary frame', async () => {
    const { code } = await roomWithTv();
    const client = await connect(code);
    client.ws.send(new Uint8Array([1, 2, 3]));
    expect(await client.next('error')).toEqual({ type: 'error', code: 'bad-message' });
  });
});
