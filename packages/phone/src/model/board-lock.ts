import type { ConnectionStatus } from '@bwords/core';
import type { RoomView } from './room-view.ts';

/**
 * Whether the finger may swipe the board at `serverNow` on the server clock: the
 * round is open (from `startsAt` until `endsAt`), this phone plays it and is not a
 * spectator, and the connection is up. The board locks when the time is up
 * (PLAY-01 AC 20), for a spectator (SPEC-01 AC 1) and while reconnecting (RECON-01 AC 2).
 */
export function isBoardOpen(view: RoomView, status: ConnectionStatus, serverNow: number): boolean {
  if (status !== 'open' || view.phase !== 'round' || view.round === null) return false;
  if (serverNow < view.round.startsAt || serverNow >= view.round.endsAt) return false;
  const me = view.players.find((p) => p.id === view.myId);
  return me !== undefined && !me.spectator;
}
