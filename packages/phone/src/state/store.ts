import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { type BannerStore, createBannerStore } from './banner.ts';
import { createMatchStore, type MatchStore } from './match.ts';
import { createPrefsStore, type PrefsDeps, type PrefsStore } from './prefs.ts';
import { createRoomStore, type RoomDeps, type RoomStore } from './room.ts';
import { createRoundStore, type RoundDeps, type RoundStore } from './round.ts';
import { safeStorage } from './safe-storage.ts';

/** Everything the phone store needs from the outside; the tests pass fakes (style guide §4, D). */
export type PhoneDeps = RoomDeps &
  Omit<RoundDeps, 'room' | 'prefs' | 'device'> &
  Omit<PrefsDeps, 'device'> & { device: RoundDeps['device'] & PrefsDeps['device'] };

/** The phone's state: signals and actions, one store per app (AD-015). */
export interface PhoneStore {
  room: RoomStore;
  round: RoundStore;
  match: MatchStore;
  prefs: PrefsStore;
  banner: BannerStore;
}

/**
 * Creates the store. It is built by a factory, not as a module singleton, so each
 * test gets its own store with fake dependencies; `main.tsx` builds the real one.
 */
export function createPhoneStore(deps: PhoneDeps): PhoneStore {
  const storage = safeStorage(deps.storage);
  const room = createRoomStore({ ...deps, storage });
  const prefs = createPrefsStore({ ...deps, storage }, room);
  const round = createRoundStore({ ...deps, room, prefs: () => prefs.prefs.value });
  return { room, round, match: createMatchStore(room), prefs, banner: createBannerStore(room, deps.schedule) };
}

/** Hands the store to the screens. */
export const StoreContext = createContext<PhoneStore | null>(null);

/** The store of the app; only screens read it, components get props (style guide §2.1). */
export function useStore(): PhoneStore {
  const store = useContext(StoreContext);
  if (store === null) throw new Error('useStore needs a StoreContext provider');
  return store;
}
