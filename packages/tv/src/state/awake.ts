import type { CloseReason } from '@bwords/core';
import { computed, effect, type ReadonlySignal } from '@preact/signals';
import type { RoomView } from '../model/room-view.ts';

/** The Screen Wake Lock; `request` rejects when the browser refuses it or has no such API (TVAWAKE-01 AC 4). */
export interface WakeLock {
  request(): Promise<void>;
  release(): void;
}

/** What the keep-awake needs from the browser and the room; the tests pass fakes (style guide §4, D). */
export interface KeepAwakeDeps {
  wakeLock: WakeLock;
  /** Calls `listener` each time the page comes back to the front; returns the function that stops it. */
  onVisible(listener: () => void): () => void;
  room: ReadonlySignal<RoomView>;
}

/**
 * Whether each close reason leaves the TV open on a room: an expired room and a replaced tab end it; a host who
 * closed the room, or a kick, lead the TV to open another one (assumption "Quando a tela fica ativa").
 */
const AWAKE_AFTER_CLOSE: Record<CloseReason, boolean> = {
  idle: false,
  'tv-gone': false,
  replaced: false,
  'closed-by-host': true,
  kicked: true,
};

/** Whether the TV keeps its screen on: in every phase, until the room expires or the tab is replaced (TVAWAKE-01 AC 1). */
export function keepsAwake(view: RoomView): boolean {
  if (view.closeReason === null) return true;
  return AWAKE_AFTER_CLOSE[view.closeReason];
}

/**
 * Holds the Screen Wake Lock while `keepsAwake`, and asks again each time the page comes back to the front, because
 * the browser lets go of it when the page hides (TVAWAKE-01 AC 1-2). A refusal is logged and the game goes on, with
 * nothing on the screen (TVAWAKE-01 AC 4-5).
 */
export function createKeepAwake({ wakeLock, onVisible, room }: KeepAwakeDeps): void {
  const wantsWakeLock = computed(() => keepsAwake(room.value));

  effect(() => {
    if (wantsWakeLock.value) requestWakeLock(wakeLock);
    else wakeLock.release();
  });
  onVisible(() => {
    if (wantsWakeLock.peek()) requestWakeLock(wakeLock);
  });
}

function requestWakeLock(wakeLock: WakeLock): void {
  wakeLock.request().catch((error: unknown) => console.warn('The screen wake lock was refused', error));
}
