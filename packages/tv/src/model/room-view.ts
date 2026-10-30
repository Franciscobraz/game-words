import type {
  CloseReason,
  Phase,
  PlayerInfo,
  PodiumEntry,
  RoundInfo,
  RoundResultsMessage,
  RoundStartMessage,
  ServerMessage,
  Settings,
  WelcomeMessage,
} from '@bwords/core';

/** Everything the TV knows about the room, built only from server messages (TVROOM-01, TVEXIT-01). */
export interface RoomView {
  code: string | null;
  phase: Phase | null;
  settings: Settings | null;
  players: readonly PlayerInfo[];
  hostId: string | null;
  round: RoundInfo | null;
  /** Words accepted per player id this round; only the numbers, never the words (TVPLAY-01 AC 5). */
  counts: Readonly<Record<string, number>>;
  results: RoundResultsMessage | null;
  podium: readonly PodiumEntry[] | null;
  closeReason: CloseReason | null;
}

/** The view before the first `welcome`. */
export const INITIAL_VIEW: RoomView = {
  code: null,
  phase: null,
  settings: null,
  players: [],
  hostId: null,
  round: null,
  counts: {},
  results: null,
  podium: null,
  closeReason: null,
};

// SPEC_DEVIATION: design.md names `applyServerMessage(view, msg, now)`.
// Reason: nothing in the view depends on the time; `createRevealClock` keeps the moment `round-results` arrived.
/**
 * Folds one server message into the view; the server is authoritative. Messages the TV never acts on
 * (`joined`, `submit-result`, `time`) and errors, which the store handles, leave the view as it is.
 */
export function applyServerMessage(view: RoomView, msg: ServerMessage): RoomView {
  switch (msg.type) {
    case 'welcome':
      return viewFromWelcome(msg);
    case 'players':
      return { ...view, players: msg.players, hostId: msg.hostId };
    case 'settings':
      return { ...view, settings: msg.settings };
    case 'round-start':
      return startRound(view, msg);
    case 'counts':
      return { ...view, counts: Object.fromEntries(msg.counts.map(({ playerId, count }) => [playerId, count])) };
    case 'round-results':
      return { ...view, phase: 'results', results: msg };
    case 'podium':
      return { ...view, phase: 'podium', podium: msg.ranking };
    case 'closed':
      return { ...view, closeReason: msg.reason };
    case 'joined':
    case 'submit-result':
    case 'time':
    case 'error':
      return view;
    default: {
      const never: never = msg;
      return never;
    }
  }
}

/** A `welcome` rebuilds the view from scratch: on a reconnect, the server's state replaces the old one (TVEXIT-01 AC 7). */
function viewFromWelcome(msg: WelcomeMessage): RoomView {
  return {
    ...INITIAL_VIEW,
    code: msg.code,
    phase: msg.phase,
    settings: msg.settings,
    players: msg.players,
    hostId: msg.hostId,
    round: msg.round,
  };
}

/** A new round: its board and times, no counts yet, and nothing of the round before. */
function startRound(view: RoomView, msg: RoundStartMessage): RoomView {
  const { type: _type, salt: _salt, ...round } = msg;
  return { ...view, phase: 'round', round, counts: {}, results: null, podium: null };
}
