import { describe, expect, test } from 'vitest';
import { step } from './machine.ts';
import type { PlayerInfo, ServerMessage } from './protocol.ts';
import { fakeDeps, guest, makePlayer, message, pending, playerConn, roomWith, sentTo, TV_TOKEN } from './test-helpers.ts';
import { crownedPlayers } from './wins.ts';

const deps = fakeDeps();

/** The players list a message carries, as [id, connected, wins]. */
function winsIn(msg: ServerMessage | undefined) {
  expect(msg && 'players' in msg && msg.type !== 'round-results').toBe(true);
  return (msg as { players: PlayerInfo[] }).players.map((p) => [p.id, p.connected, p.wins]);
}

describe('session wins', () => {
  test("lists every player's wins to the TV and phones", () => {
    const ana = makePlayer('p1', { wins: 2 });
    const bia = makePlayer('p2', { color: '#E53935', wins: 1, connected: false, connId: null });
    const cid = makePlayer('p3', { color: '#1E88E5' });
    const state = roomWith([ana, bia, cid]);

    const tv = step(state, message(pending('c-tv'), { type: 'hello', role: 'tv', token: TV_TOKEN }), 0, deps);
    expect(winsIn(sentTo(tv.effects, 'c-tv')[0])).toEqual([
      ['p1', true, 2],
      ['p2', false, 1],
      ['p3', true, 0],
    ]);

    const g = step(state, message(pending('c-g'), { type: 'hello', role: 'player' }), 0, deps);
    expect(winsIn(sentTo(g.effects, 'c-g')[0])).toEqual([
      ['p1', true, 2],
      ['p2', false, 1],
      ['p3', true, 0],
    ]);

    // Bia comes back: her welcome and everyone's players list carry the wins.
    const back = step(state, message(pending('c-bia'), { type: 'hello', role: 'player', token: bia.token }), 0, deps);
    const expected = [
      ['p1', true, 2],
      ['p2', true, 1],
      ['p3', true, 0],
    ];
    expect(winsIn(sentTo(back.effects, 'c-bia')[0])).toEqual(expected);
    expect(winsIn(sentTo(back.effects, '*')[0])).toEqual(expected);

    // Cid drops: the list still has him and his wins.
    const drop = step(state, { kind: 'disconnect', conn: playerConn(cid) }, 0, deps);
    expect(winsIn(sentTo(drop.effects, '*')[0])).toEqual([
      ['p1', true, 2],
      ['p2', false, 1],
      ['p3', false, 0],
    ]);

    // A newcomer starts at 0 wins.
    const join = step(state, message(guest('c-dan'), { type: 'join', nickname: 'Dan', color: '#43A047' }), 0, deps);
    expect(winsIn(sentTo(join.effects, '*')[0])).toEqual([
      ['p1', true, 2],
      ['p2', false, 1],
      ['p3', true, 0],
      ['p4', true, 0],
    ]);
  });

  // WINS-01 AC 6: one row per crown case (L-007).
  const CROWN_ROWS: [string, number[], string[]][] = [
    ['one leader', [1, 3, 2], ['p2']],
    ['a tie of two', [2, 0, 2], ['p1', 'p3']],
    ['everyone at 0', [0, 0, 0], []],
    ['a single player', [1], ['p1']],
    ['a single player at 0', [0], []],
    ['no players', [], []],
  ];

  test.each(CROWN_ROWS)('crowns every player with the most wins and nobody at 0: %s', (_name, wins, crowned) => {
    const players = wins.map((w, i) => ({ id: `p${i + 1}`, wins: w }));
    expect(crownedPlayers(players).map((p) => p.id)).toEqual(crowned);
  });
});
