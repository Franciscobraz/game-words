import { findPath, type RoundResultsMessage, type RoundStartMessage, scoreRound, type ServerMessage } from '@bwords/core';
import { runDurableObjectAlarm } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { joinPhone, liveState, messagesOf, type Phone, roomWithTv, setClock, solutionPaths, stubOf } from './room.ts';
import { type Client, connect } from './ws.ts';

interface PlayedRound {
  start: RoundStartMessage;
  results: RoundResultsMessage;
  /** What each phone found, by player id. */
  found: Map<string, string[]>;
}

/** Every socket a phone used, oldest first, by player id. */
type Sessions = Map<string, Client[]>;

/** Skips to the first `players` message in which `playerId` has this connection state. */
async function untilConnected(client: Client, playerId: string, connected: boolean): Promise<void> {
  for (;;) {
    const msg = await client.skipTo('players');
    if (msg.players.find((p) => p.id === playerId)?.connected === connected) return;
  }
}

/**
 * Caio drops mid-round and comes back on a new socket with his token, so the
 * other phones get `players` twice and Caio a `welcome` while the round runs.
 */
async function reconnect(code: string, phones: Phone[], sessions: Sessions, found: string[]): Promise<void> {
  const [ana, bia, caio] = phones as [Phone, Phone, Phone];
  caio.client.close();
  for (const p of [ana, bia]) await untilConnected(p.client, caio.playerId, false);
  const back = await connect(code);
  back.send({ type: 'hello', role: 'player', token: caio.token });
  const welcome = await back.next('welcome');
  expect(welcome).toMatchObject({ phase: 'round', playerId: caio.playerId, found });
  expect(welcome.players.find((p) => p.id === caio.playerId)?.connected).toBe(true);
  await back.hashes();
  for (const p of [ana, bia]) await untilConnected(p.client, caio.playerId, true);
  caio.client = back;
  sessions.get(caio.playerId)!.push(back);
}

/**
 * One round played by three phones: Ana finds w1 and w2, Bia w2 and w3, Caio w4,
 * so w2 is shared and the others are unique. After the submits Caio reconnects;
 * the round ends on the alarm.
 */
async function playRound(
  code: string,
  tv: Client,
  phones: Phone[],
  sessions: Sessions,
  start: RoundStartMessage,
): Promise<PlayedRound> {
  const [w1, w2, w3, w4] = solutionPaths(start.board);
  const [ana, bia, caio] = phones as [Phone, Phone, Phone];
  await setClock(code, start.startsAt + 5000);
  const plan: [Phone, { word: string; path: number[] }[]][] = [
    [ana, [w1!, w2!]],
    [bia, [w2!, w3!]],
    [caio, [w4!]],
  ];
  for (const [phone, words] of plan) {
    phone.client.send({ type: 'submit', paths: words.map((w) => w.path) });
    expect(await phone.client.skipTo('submit-result')).toEqual({
      type: 'submit-result',
      results: words.map((w) => ({ ok: true, word: w.word })),
    });
  }
  await reconnect(code, phones, sessions, [w4!.word]);
  await setClock(code, start.endsAt + 300);
  expect(await runDurableObjectAlarm(stubOf(code))).toBe(true);
  // The TV gets the final counts right before the results.
  const results = await tv.skipTo('round-results');
  const tvMessages = messagesOf(tv);
  expect(tvMessages[tvMessages.indexOf(results) - 1]).toEqual({
    type: 'counts',
    counts: plan.map(([p, words]) => ({ playerId: p.playerId, count: words.length })),
  });
  for (const p of phones) expect(await p.client.skipTo('round-results')).toEqual(results);
  return { start, results, found: new Map(plan.map(([p, words]) => [p.playerId, words.map((w) => w.word)])) };
}

/** Every client reads up to its `round-start`; phones also get the hash frame. */
async function readStart(tv: Client, phones: Phone[]): Promise<RoundStartMessage> {
  const start = await tv.skipTo('round-start');
  for (const p of phones) {
    expect(await p.client.skipTo('round-start')).toEqual({ ...start, salt: expect.any(String) });
    expect((await p.client.hashes()).roundId).toBe(start.id);
  }
  return start;
}

/** A 2-round match with a TV and 3 phones, from the lobby to "play again". */
async function playMatch() {
  const { code, tv } = await roomWithTv();
  const phones = [await joinPhone(code, 'Ana', 0), await joinPhone(code, 'Bia', 1), await joinPhone(code, 'Caio', 2)];
  const [host] = phones as [Phone];
  const sessions: Sessions = new Map(phones.map((p) => [p.playerId, [p.client]]));
  host.client.send({ type: 'settings', patch: { rounds: 2, seconds: 60 } });
  expect(await tv.skipTo('settings')).toMatchObject({ settings: { rounds: 2, seconds: 60 } });

  host.client.send({ type: 'start' });
  const round1 = await playRound(code, tv, phones, sessions, await readStart(tv, phones));
  host.client.send({ type: 'next' });
  const round2 = await playRound(code, tv, phones, sessions, await readStart(tv, phones));
  host.client.send({ type: 'next' });
  const podium = await tv.skipTo('podium');
  for (const p of phones) expect(await p.client.skipTo('podium')).toEqual(podium);
  const afterPodium = await liveState(code);

  host.client.send({ type: 'play-again' });
  const again = await readStart(tv, phones);
  const afterPlayAgain = await liveState(code);
  return { code, tv, phones, sessions, rounds: [round1, round2], podium, afterPodium, afterPlayAgain, again };
}

/** Text values of a message that could carry a word: everything but the random `salt` and `token`. */
function texts(value: unknown, key = ''): string[] {
  if (key === 'salt' || key === 'token') return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap((v) => texts(v));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => texts(v, k));
  return [];
}

describe('full match', () => {
  it('plays a 2-round match with a TV and 3 phones', async () => {
    const { phones, rounds, podium, afterPodium, afterPlayAgain, again } = await playMatch();
    const ids = phones.map((p) => p.playerId);
    const total = new Map(ids.map((id) => [id, 0]));

    rounds.forEach(({ start, results, found }, index) => {
      expect(start.index).toBe(index);
      expect(results.index).toBe(index);
      expect(results.last).toBe(index === 1);
      const score = scoreRound(new Map([...found].map(([id, words]) => [id, new Set(words)])));
      for (const id of ids) total.set(id, total.get(id)! + score.totals.get(id)!);
      expect(results.shared.map((w) => w.word)).toEqual([...score.shared]);
      // Players from the lowest to the highest accumulated score, each with their unique words.
      expect(results.players.map((p) => p.score)).toEqual([...results.players.map((p) => p.score)].sort((a, b) => a - b));
      for (const p of results.players) {
        expect(p.roundPoints).toBe(score.totals.get(p.playerId));
        expect(p.score).toBe(total.get(p.playerId));
        expect(p.unique.map((w) => w.word).sort()).toEqual([...score.unique.get(p.playerId)!].sort());
      }
      expect(results.longest).not.toBeNull();
      expect(results.longest!.path).toEqual(findPath(start.board, results.longest!.word));
    });
    expect(rounds[1]!.start.id).toBe(rounds[0]!.start.id + 1);

    // The podium from the highest to the lowest score; the leaders get a win.
    expect(podium.ranking.map((r) => r.score)).toEqual([...total.values()].sort((a, b) => b - a));
    const top = Math.max(...total.values());
    expect(afterPodium?.players.map((p) => [p.id, p.wins])).toEqual(ids.map((id) => [id, total.get(id) === top ? 1 : 0]));

    // Play again: a new match starts at once, with zeroed scores, the same players and host.
    expect(again.index).toBe(0);
    expect(afterPlayAgain?.phase).toBe('round');
    expect(afterPlayAgain?.hostId).toBe(ids[0]);
    expect(afterPlayAgain?.players.map((p) => [p.id, p.score, p.wins])).toEqual(
      ids.map((id) => [id, 0, total.get(id) === top ? 1 : 0]),
    );
  });

  it('never sends round words to phones before the results', async () => {
    const { phones, sessions, rounds, again } = await playMatch();
    const words = (board: string[][]) => solutionPaths(board).map((s) => s.word);
    const boards = [...rounds.map((r) => r.start.board), again.board];

    for (const phone of phones) {
      // Every socket of the phone, in order: Caio's reconnections add `welcome` and `players` mid-round.
      const messages: ServerMessage[] = sessions.get(phone.playerId)!.flatMap(messagesOf);
      const startsAt = messages.flatMap((m, i) => (m.type === 'round-start' ? [i] : []));
      const resultsAt = messages.flatMap((m, i) => (m.type === 'round-results' ? [i] : []));
      expect(startsAt).toHaveLength(boards.length);
      expect(resultsAt).toHaveLength(rounds.length);
      // During each played round the phone got the room view again: `players` or, for Caio, `welcome`.
      resultsAt.forEach((end, k) => {
        const during = messages.slice(startsAt[k], end).filter((m) => m.type === 'players' || m.type === 'welcome');
        expect(during.length).toBeGreaterThan(0);
      });
      boards.forEach((board, k) => {
        // A round's board exists only after the previous results, and its words are public at its own results.
        const from = k === 0 ? 0 : resultsAt[k - 1]! + 1;
        const to = resultsAt[k] ?? messages.length;
        const roundWords = words(board);
        for (const msg of messages.slice(from, to)) {
          // The accepted word of the phone's own submission is the one exception.
          if (msg.type === 'submit-result') continue;
          // A reconnecting phone's own `found` holds only those same accepted words (checked in `reconnect`).
          const scanned = msg.type === 'welcome' && msg.role === 'player' ? { ...msg, found: [] } : msg;
          for (const text of texts(scanned)) {
            for (const w of roundWords) expect(text.includes(w), `${w} in ${JSON.stringify(msg)}`).toBe(false);
          }
        }
      });
    }
  });
});
