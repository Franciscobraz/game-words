import { scoreRound } from '@bwords/core';
import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { alarmOf, joinPhone, roomWithTv, setClock, solutionPaths, startRound, storedRoom, stubOf, T0, untilStored } from './room.ts';
import { connect } from './ws.ts';

const MINUTE = 60_000;

describe('alarms', () => {
  it('ends the round on the alarm with no socket open', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const b = await joinPhone(code, 'Bia', 1);
    const start = await startRound(a, [b.client, tv]);
    await setClock(code, start.startsAt);
    const word = solutionPaths(start.board)[0]!;
    a.client.send({ type: 'submit', paths: [word.path] });
    await a.client.skipTo('submit-result');

    // Everyone leaves: the TV and both phones.
    for (const c of [tv, a.client, b.client]) c.close();
    await untilStored(code, (r) => r.tvConn === null && r.players.every((p) => !p.connected), 'every close');

    // 1 ms before endsAt + 300 ms the round goes on.
    await setClock(code, start.endsAt + 299);
    expect(await runDurableObjectAlarm(stubOf(code))).toBe(true);
    expect((await storedRoom(code))?.phase).toBe('round');
    expect(await alarmOf(code)).toBe(start.endsAt + 300);

    await setClock(code, start.endsAt + 300);
    expect(await runDurableObjectAlarm(stubOf(code))).toBe(true);
    const room = await storedRoom(code);
    expect(room?.phase).toBe('podium');
    const points = scoreRound(new Map([[a.playerId, new Set([word.word])], [b.playerId, new Set<string>()]])).totals.get(a.playerId);
    expect(points).toBeGreaterThan(0);
    expect(room?.players.find((p) => p.id === a.playerId)?.score).toBe(points);

    // A phone that comes back finds the results.
    const back = await connect(code);
    back.send({ type: 'hello', role: 'player', token: a.token });
    expect(await back.next('welcome')).toMatchObject({ phase: 'podium', playerId: a.playerId });
    const results = await back.next('round-results');
    expect(results.players.find((p) => p.playerId === a.playerId)?.roundPoints).toBe(points);
    const podium = await back.next('podium');
    expect(podium.ranking).toContainEqual({ playerId: a.playerId, score: points });
  });

  it('schedules every deadline on the durable object alarm', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const b = await joinPhone(code, 'Bia', 1);
    // Lobby with everyone connected: the idle timeout, 30 min after the last action (the join).
    expect(await alarmOf(code)).toBe(T0 + 30 * MINUTE);

    // The host leaves: the handoff 30 s later comes first.
    await setClock(code, T0 + 1000);
    a.client.close();
    await untilStored(code, (r) => r.hostOfflineSince !== null, 'the host close');
    expect(await alarmOf(code)).toBe(T0 + 1000 + 30_000);
    await setClock(code, T0 + 1000 + 30_000);
    expect(await runDurableObjectAlarm(stubOf(code))).toBe(true);
    expect((await storedRoom(code))?.hostId).toBe(b.playerId);
    expect(await alarmOf(code)).toBe(T0 + 30 * MINUTE);

    // The TV leaves: the TV timeout, 10 min later, comes before the idle one.
    await setClock(code, T0 + 2 * MINUTE);
    tv.close();
    await untilStored(code, (r) => r.tvConn === null, 'the TV close');
    expect(await alarmOf(code)).toBe(T0 + 12 * MINUTE);

    // A round: its end, endsAt + 300 ms.
    const start = await startRound(b, []);
    expect(start.endsAt).toBe(T0 + 2 * MINUTE + 3000 + 120_000);
    expect(await alarmOf(code)).toBe(start.endsAt + 300);
  });

  it('closing notifies, closes sockets, wipes storage and frees the code', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    const b = await joinPhone(code, 'Bia', 1);
    a.client.send({ type: 'close-room' });
    for (const c of [tv, a.client, b.client]) {
      expect(await c.skipTo('closed')).toEqual({ type: 'closed', reason: 'closed-by-host' });
      await c.waitClosed();
    }
    const left = await runInDurableObject(stubOf(code), async (_, state) => ({
      keys: [...(await state.storage.list()).keys()],
      alarm: await state.storage.getAlarm(),
      sockets: state.getWebSockets().length,
    }));
    expect(left).toEqual({ keys: [], alarm: null, sockets: 0 });

    // The code is free: a new connection finds no room, and the room can be created again.
    const late = await connect(code);
    expect(await late.next('error')).toEqual({ type: 'error', code: 'room-not-found' });
    expect(await stubOf(code).create(code, { idleMin: 30, tvGoneMin: 10 })).not.toBeNull();
  });

  it('closes an idle room on the alarm', async () => {
    const { code, tv } = await roomWithTv();
    const a = await joinPhone(code, 'Ana', 0);
    await setClock(code, T0 + 30 * MINUTE - 1);
    await runDurableObjectAlarm(stubOf(code));
    expect((await storedRoom(code))?.closed).toBe(false);
    await setClock(code, T0 + 30 * MINUTE);
    await runDurableObjectAlarm(stubOf(code));
    for (const c of [tv, a.client]) {
      expect(await c.skipTo('closed')).toEqual({ type: 'closed', reason: 'idle' });
      await c.waitClosed();
    }
    expect(await storedRoom(code)).toBeUndefined();
  });
});
