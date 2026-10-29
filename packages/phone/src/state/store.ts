import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { createRoomStore, type RoomDeps, type RoomStore } from './room.ts';

/** Everything the phone store needs from the outside; the tests pass fakes (style guide §4, D). */
export type PhoneDeps = RoomDeps;

/** The phone's state: signals and actions, one store per app (AD-015). */
export interface PhoneStore {
  room: RoomStore;
}

/**
 * Creates the store. It is built by a factory, not as a module singleton, so each
 * test gets its own store with fake dependencies; `main.tsx` builds the real one.
 */
export function createPhoneStore(deps: PhoneDeps): PhoneStore {
  return { room: createRoomStore(deps) };
}

/** Hands the store to the screens. */
export const StoreContext = createContext<PhoneStore | null>(null);

/** The store of the app; only screens read it, components get props (style guide §2.1). */
export function useStore(): PhoneStore {
  const store = useContext(StoreContext);
  if (store === null) throw new Error('useStore needs a StoreContext provider');
  return store;
}
