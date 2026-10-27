import { checkColor } from './colors.ts';
import { type ConnRef, type Handler, playersMessage, reject } from './effects.ts';
import { cleanNickname, nicknameKey } from './nickname.ts';
import type { Player, RoomState } from './state.ts';

/** Most players in a room, connected or not (JOIN-01 AC 7). */
export const MAX_PLAYERS = 10;

/**
 * `join` from a phone on the join screen: checks the room size, the nickname and
 * the color, then registers the player. During the countdown, the round or the
 * results the newcomer is a spectator with 0 points until the next countdown.
 */
export const handleJoin: Handler<'join'> = ({ state, conn, now, deps }, msg) => {
  if (state.players.length >= MAX_PLAYERS) return reject(state, conn, 'room-full');
  const nickname = cleanNickname(msg.nickname);
  if (nickname === null) return reject(state, conn, 'bad-nickname');
  const key = nicknameKey(nickname);
  if (state.players.some((p) => nicknameKey(p.nickname) === key)) return reject(state, conn, 'nickname-taken');
  const colorError = checkColor(
    msg.color,
    state.players.map((p) => p.color),
  );
  if (colorError) return reject(state, conn, colorError);

  const player: Player = {
    id: `p${state.joinCount + 1}`,
    token: deps.randomToken(),
    nickname,
    color: msg.color,
    joinedAt: now,
    connected: true,
    connId: conn.id,
    spectator: state.phase === 'round' || state.phase === 'results',
    score: 0,
    found: [],
  };
  const next: RoomState = { ...state, players: [...state.players, player], joinCount: state.joinCount + 1 };
  const me: ConnRef = { id: conn.id, role: 'player', playerId: player.id };
  return {
    state: next,
    effects: [
      { kind: 'persist', keys: ['room'] },
      { kind: 'bind', conn: me },
      { kind: 'send', to: me, msg: { type: 'joined', playerId: player.id, token: player.token } },
      { kind: 'broadcast', msg: playersMessage(next) },
    ],
  };
};
