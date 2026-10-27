import { type ConnRef, type Effect, type Handler, playersMessage, reject } from './effects.ts';
import type { ClientMessageType } from './protocol.ts';
import type { RoomState } from './state.ts';

/** Commands only the host may send (HOST-01 AC 4); anyone else gets `not-host`. */
export const HOST_COMMANDS: readonly ClientMessageType[] = [
  'settings',
  'start',
  'next',
  'transfer-host',
  'kick',
  'play-again',
  'close-room',
];

/** Whether `conn` is the host's phone. */
export function isHost(state: RoomState, conn: ConnRef): boolean {
  return conn.role === 'player' && state.hostId !== null && conn.playerId === state.hostId;
}

/** Hands the host role to another connected player and tells everyone. */
export const handleTransferHost: Handler<'transfer-host'> = ({ state, conn }, msg) => {
  const target = state.players.find((p) => p.id === msg.playerId);
  if (!target || target.id === state.hostId || !target.connected) return reject(state, conn, 'bad-target');
  const next: RoomState = { ...state, hostId: target.id, hostOfflineSince: null };
  return {
    state: next,
    effects: [
      { kind: 'persist', keys: ['room'] },
      { kind: 'broadcast', msg: playersMessage(next) },
    ],
  };
};

/**
 * Removes a player with their points and words. Their token stops working, their
 * connection closes with `kicked`, and coming back by the code makes a new player.
 */
export const handleKick: Handler<'kick'> = ({ state, conn }, msg) => {
  const target = state.players.find((p) => p.id === msg.playerId);
  if (!target || target.id === state.hostId) return reject(state, conn, 'bad-target');
  const next: RoomState = { ...state, players: state.players.filter((p) => p.id !== target.id) };
  const effects: Effect[] = [{ kind: 'persist', keys: ['room', `found:${target.id}`] }];
  if (target.connId !== null) {
    const theirs: ConnRef = { id: target.connId, role: 'player', playerId: target.id };
    effects.push({ kind: 'send', to: theirs, msg: { type: 'closed', reason: 'kicked' } }, { kind: 'close', to: theirs });
  }
  effects.push({ kind: 'broadcast', msg: playersMessage(next) });
  return { state: next, effects };
};
