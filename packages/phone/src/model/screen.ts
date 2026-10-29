import type { CloseReason } from '@bwords/core';
import type { RoomView } from './room-view.ts';

/** Every screen of the phone; `app.tsx` maps each one to a component (style guide §4, O). */
export type Screen =
  | 'code-entry'
  | 'connecting'
  | 'join'
  | 'lobby'
  | 'host-lobby'
  | 'countdown'
  | 'board'
  | 'spectator'
  | 'round-result'
  | 'podium'
  | 'kicked'
  | 'room-closed'
  | 'replaced';

/** The exit screen of each close reason (EXIT-01 AC 1-4). */
const EXIT_SCREENS: Record<CloseReason, Screen> = {
  kicked: 'kicked',
  'closed-by-host': 'room-closed',
  idle: 'room-closed',
  'tv-gone': 'room-closed',
  replaced: 'replaced',
};

// SPEC_DEVIATION: tasks.md T8 names `screenFor(view, connection, now)` and the
// design's `Screen` has no 'connecting'.
// Reason: RECON-01 AC 2 keeps the current screen while reconnecting, so the status
// never picks a screen and is left out; 'connecting' covers the moment between
// opening a room and its first `welcome`, so a phone with a saved token does not
// flash the join screen (ENTRY-01 AC 6).
/**
 * The screen for the room as the server last described it, at `serverNow` on the
 * server clock: by close reason, then by entry state, then by phase and role
 * (ENTRY-01, COUNT-01 AC 2, SPEC-01, EXIT-01).
 */
export function screenFor(view: RoomView, serverNow: number): Screen {
  if (view.closeReason !== null) return EXIT_SCREENS[view.closeReason];
  if (view.code === null || view.joinError === 'room-not-found') return 'code-entry';
  if (view.phase === null) return 'connecting';
  if (view.myId === null) return 'join';
  switch (view.phase) {
    case 'lobby':
      return view.hostId === view.myId ? 'host-lobby' : 'lobby';
    case 'round':
      return roundScreen(view, serverNow);
    case 'results':
      return 'round-result';
    case 'podium':
      return 'podium';
    default: {
      const never: never = view.phase;
      return never;
    }
  }
}

/** No letter shows before `startsAt` on the server clock, not even to a spectator (COUNT-01 AC 2). */
function roundScreen(view: RoomView, serverNow: number): Screen {
  if (view.round === null || serverNow < view.round.startsAt) return 'countdown';
  const me = view.players.find((p) => p.id === view.myId);
  return me?.spectator ? 'spectator' : 'board';
}
