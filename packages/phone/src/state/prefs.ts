import { computed, effect, type ReadonlySignal, signal } from '@preact/signals';
import type { RoomView } from '../model/room-view.ts';
import type { KeyValueStorage, RoomStore } from './room.ts';

/** The player's switches in the preferences sheet (PREF-01 AC 1). */
export interface Prefs {
  vibrate: boolean;
  sound: boolean;
}

/** Both switches start off (PREF-01 AC 1). */
export const DEFAULT_PREFS: Prefs = { vibrate: false, sound: false };

/** Where the preferences are kept, for every room alike (PREF-01 AC 2). */
export const PREFS_KEY = 'bwords.prefs';

/** The Screen Wake Lock; the browser adapter swallows a refusal (design, Error Handling). */
export interface WakeLock {
  request(): void;
  release(): void;
}

/** Dependencies of the preferences store; `device/` gives the browser ones, tests fakes (style guide §4, D). */
export interface PrefsDeps {
  /** Already guarded by `safeStorage`, so it never throws. */
  storage: KeyValueStorage;
  wakeLock: WakeLock;
  /** Calls `listener` each time the page comes back to the front; returns the function that stops it. */
  onVisible(listener: () => void): () => void;
  device: { canVibrate(): boolean };
}

/** The preferences, their sheet and the wake lock (PREF-01). */
export interface PrefsStore {
  prefs: ReadonlySignal<Prefs>;
  /** False without `navigator.vibrate`: the sheet hides "Vibrar" (PREF-01 AC 3). */
  canVibrate: boolean;
  /** Switches one preference and saves both (PREF-01 AC 2). */
  setPref(name: keyof Prefs, on: boolean): void;
  isSheetOpen: ReadonlySignal<boolean>;
  /** The person icon of the top bar (PREF-01 AC 1). */
  openSheet(): void;
  closeSheet(): void;
}

/**
 * Whether the screen should stay on: in the lobby and in the round, while the room
 * is open; the results and the podium let it sleep (PREF-01 AC 4).
 */
export function holdsWakeLock(view: RoomView): boolean {
  if (view.closeReason !== null) return false;
  return view.phase === 'lobby' || view.phase === 'round';
}

/** Creates the preferences from storage and follows the room's phase to hold or let go of the wake lock. */
export function createPrefsStore(deps: PrefsDeps, room: RoomStore): PrefsStore {
  const prefs = signal<Prefs>(loadPrefs(deps.storage));
  const isSheetOpen = signal(false);
  const wantsWakeLock = computed(() => holdsWakeLock(room.room.value));

  effect(() => {
    if (wantsWakeLock.value) deps.wakeLock.request();
    else deps.wakeLock.release();
  });
  // The browser lets go of the wake lock when the page hides; it is asked for again on the way back.
  deps.onVisible(() => {
    if (wantsWakeLock.value) deps.wakeLock.request();
  });

  return {
    prefs,
    canVibrate: deps.device.canVibrate(),
    setPref(name, on) {
      prefs.value = { ...prefs.value, [name]: on };
      deps.storage.set(PREFS_KEY, JSON.stringify(prefs.value));
    },
    isSheetOpen,
    openSheet: () => {
      isSheetOpen.value = true;
    },
    closeSheet: () => {
      isSheetOpen.value = false;
    },
  };
}

/** The saved preferences, or both off when there are none or they do not parse. */
function loadPrefs(storage: KeyValueStorage): Prefs {
  const saved = storage.get(PREFS_KEY);
  if (saved === null) return DEFAULT_PREFS;
  try {
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_PREFS;
    const fields = parsed as Record<string, unknown>;
    return { vibrate: fields.vibrate === true, sound: fields.sound === true };
  } catch (error) {
    console.warn('The saved preferences are not valid', error);
    return DEFAULT_PREFS;
  }
}
