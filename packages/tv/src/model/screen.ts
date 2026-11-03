import type { CloseReason } from '@bwords/core';
import type { RoomStatus } from '../state/room.ts';
import type { RevealStage } from './reveal.ts';
import type { RoomView } from './room-view.ts';

/** Every screen of the TV; `app.tsx` maps each one to a component (style guide §4, O). */
export type Screen =
  | 'opening'
  | 'open-failed'
  | 'lobby'
  | 'countdown'
  | 'round'
  | 'words'
  | 'result'
  | 'expired'
  | 'replaced';

/** The screen of each close reason (TVEXIT-01 AC 1-2, 4). A host closing the room leads to a new one; a TV is never kicked. */
const CLOSE_SCREENS: Record<CloseReason, Screen> = {
  idle: 'expired',
  'tv-gone': 'expired',
  replaced: 'replaced',
  'closed-by-host': 'opening',
  kicked: 'opening',
};

/** The screen of each stage after a round: "Tempo!" sits over the board of the round (TVPLAY-01 AC 10, WORDCTL-01 AC 9). */
const REVEAL_SCREENS: Record<RevealStage, Screen> = {
  'time-up': 'round',
  words: 'words',
  result: 'result',
};

/**
 * The screen for the room as the server last described it, at `serverNow` on the server clock: by close reason, then
 * by phase, then by `stage` on the words. Only the phases `results` and `podium`, which the host's "Ver resultado"
 * opens, show the result (WORDCTL-01 AC 9). `stage` is null while the reveal waits for its results or the first clock
 * sample; the words wait on their own screen. A dropped connection keeps the screen (TVEXIT-01 AC 5).
 */
export function tvScreen(view: RoomView, status: RoomStatus, stage: RevealStage | null, serverNow: number): Screen {
  if (view.closeReason !== null) return CLOSE_SCREENS[view.closeReason];
  switch (view.phase) {
    case null:
      return status === 'create-failed' ? 'open-failed' : 'opening';
    case 'lobby':
      return 'lobby';
    case 'round':
      return roundScreen(view, serverNow);
    case 'words':
      return stage === null ? 'words' : REVEAL_SCREENS[stage];
    case 'results':
    case 'podium':
      return 'result';
    default: {
      const never: never = view.phase;
      return never;
    }
  }
}

/** No letter shows before `startsAt` on the server clock (TVPLAY-01 AC 1-2). */
function roundScreen(view: RoomView, serverNow: number): Screen {
  return view.round === null || serverNow < view.round.startsAt ? 'countdown' : 'round';
}
