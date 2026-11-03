import type { Effect, Handler } from './effects.ts';
import { podiumMessage } from './flow.ts';
import { isLastRound } from './round.ts';
import type { RoomState } from './state.ts';

/**
 * The words stage after a round (AD-024): the TV lists the words while the host
 * steps through them and decides when the result shows. The position of the list
 * lives only on the TV; the room relays the host's steps and owns the moment the
 * result opens, so the TV and the phones change together (AD-026).
 */

/**
 * `scroll` from the host on the words: the step goes to the TV only, with the same
 * direction, and to nobody when no TV is connected (WORDCTL-01 AC 5-6). The room
 * keeps no position, but the step is a host action for the idle timeout.
 */
export const handleScroll: Handler<'scroll'> = ({ state }, msg) => {
  const effects: Effect[] = [{ kind: 'persist', keys: ['room'] }];
  if (state.tvConn !== null) {
    effects.push({ kind: 'send', to: { id: state.tvConn, role: 'tv' }, msg: { type: 'scroll', direction: msg.direction } });
  }
  return { state: { ...state }, effects };
};

/**
 * `show-result` from the host on the words (WORDCTL-01 AC 8-9): the phones and the
 * guests get the round's results only now (SYNC-01 AC 4, L-008); the TV has had
 * them since the round ended. In the middle of the match the room goes to
 * `results` and everyone gets `phase` with `results` (SYNC-01 AC 2); after the last
 * round it goes to the podium, which everyone gets (SYNC-01 AC 3). A second
 * `show-result` finds the room out of `words` and gets `wrong-phase`.
 */
export const handleShowResult: Handler<'show-result'> = ({ state }) => {
  const last = isLastRound(state);
  const next: RoomState = { ...state, phase: last ? 'podium' : 'results' };
  const effects: Effect[] = [{ kind: 'persist', keys: ['room'] }];
  if (state.results !== null) effects.push({ kind: 'broadcast', msg: state.results, roles: ['player', 'guest'] });
  effects.push({ kind: 'broadcast', msg: last ? podiumMessage(next) : { type: 'phase', phase: 'results' } });
  return { state: next, effects };
};
