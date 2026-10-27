import type { ConnRef, Effect, RoomDeps } from './effects.ts';
import { type RoomInput, step } from './machine.ts';
import type { ServerMessage } from './protocol.ts';
import { createRoom, type Player, type RoomState } from './state.ts';

/** Shared fixtures of the room tests. Not exported from the package. */

export const TV_TOKEN = 'tv-secret';

export function newRoom(now = 0): RoomState {
  return createRoom('ABCD', TV_TOKEN, now, { idleMin: 30, tvGoneMin: 10 });
}

/** Deterministic tokens: `token-1`, `token-2`, ... */
export function fakeDeps(): RoomDeps {
  let n = 0;
  return { randomToken: () => `token-${++n}` };
}

export const pending = (id: string): ConnRef => ({ id, role: 'pending' });
export const guest = (id: string): ConnRef => ({ id, role: 'guest' });
export const tvConn = (id: string): ConnRef => ({ id, role: 'tv' });
export const playerConn = (p: Player): ConnRef => ({ id: p.connId ?? `conn-${p.id}`, role: 'player', playerId: p.id });

export const message = (conn: ConnRef, msg: object): RoomInput => ({ kind: 'message', conn, data: JSON.stringify(msg) });

/** A player built directly, connected unless told otherwise. */
export function makePlayer(id: string, extra: Partial<Player> = {}): Player {
  return {
    id,
    token: `secret-${id}`,
    nickname: `Nick ${id}`,
    color: '#FFFFFF',
    joinedAt: 0,
    connected: true,
    connId: `conn-${id}`,
    spectator: false,
    score: 0,
    found: [],
    ...extra,
  };
}

/** A room with these players; the first one is the host. */
export function roomWith(players: Player[], extra: Partial<RoomState> = {}): RoomState {
  return { ...newRoom(), players, hostId: players[0]?.id ?? null, joinCount: players.length, ...extra };
}

/** Messages sent to one connection id, or broadcast when `id` is `'*'`. */
export function sentTo(effects: Effect[], id: string): ServerMessage[] {
  return effects.flatMap((e) => {
    if (id === '*') return e.kind === 'broadcast' ? [e.msg] : [];
    return e.kind === 'send' && e.to.id === id ? [e.msg] : [];
  });
}

/** Every JSON message in the effects, sent or broadcast. */
export function allMessages(effects: Effect[]): ServerMessage[] {
  return effects.flatMap((e) => (e.kind === 'send' || e.kind === 'broadcast' ? [e.msg] : []));
}

/** Runs inputs in order, all at `now`, and returns the final state and every effect. */
export function run(state: RoomState, inputs: RoomInput[], now = 0, deps = fakeDeps()) {
  const effects: Effect[] = [];
  for (const input of inputs) {
    const r = step(state, input, now, deps);
    state = r.state;
    effects.push(...r.effects);
  }
  return { state, effects };
}
