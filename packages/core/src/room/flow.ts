import { type ConnRef, type Effect, type Handler, type PersistKey, type StepResult, welcomeBase } from './effects.ts';
import type { CloseReason, ServerMessage } from './protocol.ts';
import { requestRound } from './round.ts';
import type { RoomState } from './state.ts';

/** Players from the highest to the lowest score, ties in joining order (RES-01 AC 6). */
export function podiumMessage(state: RoomState): ServerMessage {
  const ranking = [...state.players].sort((a, b) => b.score - a.score).map((p) => ({ playerId: p.id, score: p.score }));
  return { type: 'podium', ranking };
}

/**
 * One more win to every player with the highest score of the finished match, all
 * of them on a tie, and to nobody when that score is 0 (WINS-01 AC 1-2).
 */
export function awardWins(players: RoomState['players']): RoomState['players'] {
  const top = Math.max(0, ...players.map((p) => p.score));
  return top === 0 ? players : players.map((p) => (p.score === top ? { ...p, wins: p.wins + 1 } : p));
}

/**
 * `next` from the host in the results: the countdown of the next round with the
 * prepared board (RES-01 AC 5). The results only exist while rounds remain, because
 * the last round goes straight to the podium (PROTO-02 AC 4).
 */
export const handleNext: Handler<'next'> = ({ state, now }) => requestRound(state, now);

/**
 * Back to the lobby with the same players, colors, settings and host: every score
 * at zero (wins stay), the round words and any prepared board dropped. Every connection gets a
 * fresh `welcome`, which tells it the room is in the lobby.
 */
function returnToLobby(state: RoomState): StepResult {
  const next: RoomState = {
    ...state,
    phase: 'lobby',
    players: state.players.map((p) => ({ ...p, score: 0, found: [], spectator: false })),
    roundIndex: 0,
    solutions: null,
    nextRound: null,
    nextSolutions: null,
    pendingStart: false,
    results: null,
    rateWindow: {},
    tvCounts: { dirty: false, lastSentAt: 0 },
  };
  const base = welcomeBase(next);
  const keys: PersistKey[] = ['room', 'round:solutions', 'round:next', ...next.players.map((p) => `found:${p.id}` as const)];
  const effects: Effect[] = [{ kind: 'persist', keys }];
  if (next.tvConn !== null) {
    effects.push({ kind: 'send', to: { id: next.tvConn, role: 'tv' }, msg: { type: 'welcome', role: 'tv', ...base } });
  }
  for (const p of next.players) {
    if (p.connId === null) continue;
    const to: ConnRef = { id: p.connId, role: 'player', playerId: p.id };
    effects.push({ kind: 'send', to, msg: { type: 'welcome', role: 'player', ...base, playerId: p.id, found: [], salt: null } });
  }
  effects.push({
    kind: 'broadcast',
    msg: { type: 'welcome', role: 'player', ...base, playerId: null, found: [], salt: null },
    roles: ['guest'],
  });
  return { state: next, effects };
}

/**
 * `play-again` from the host on the podium: the countdown of a new match with the
 * same players, colors, settings and host, every score at zero, without the lobby
 * (RES-01 AC 7). Uses a prepared board that fits the settings, or asks for one.
 */
export const handlePlayAgain: Handler<'play-again'> = ({ state, now }) => requestRound(state, now);

/**
 * `back-to-lobby` from the host in the countdown, the round, the results or the
 * podium (RES-01 AC 10): the running round ends without results and its words are
 * dropped. Leaving the `round` phase also drops the round-end deadline, so a
 * pending alarm sends nothing and a late `submit` gets `wrong-phase`.
 */
export const handleBackToLobby: Handler<'back-to-lobby'> = ({ state }) => returnToLobby(state);

/**
 * Closes the room for good: every connection gets `closed` with the reason, then
 * the adapter closes them, wipes the storage and frees the code.
 */
export function closeRoom(state: RoomState, reason: CloseReason): StepResult {
  return {
    state: { ...state, closed: true },
    effects: [{ kind: 'broadcast', msg: { type: 'closed', reason } }, { kind: 'close-room' }],
  };
}

/** `close-room` from the host (RES-01 AC 8). */
export const handleCloseRoom: Handler<'close-room'> = ({ state }) => closeRoom(state, 'closed-by-host');
