import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { createRevealClock, type RevealClock } from './reveal.ts';
import { createRoomStore, type RoomDeps, type RoomStore } from './room.ts';

/** The TV's state: signals and actions, one store per app (AD-015). */
export interface TvStore {
  room: RoomStore;
  reveal: RevealClock;
}

/**
 * Creates the store. It is built by a factory, not as a module singleton, so each
 * test gets its own store with fake dependencies; `main.tsx` builds the real one.
 */
export function createTvStore(deps: RoomDeps): TvStore {
  const room = createRoomStore(deps);
  return { room, reveal: createRevealClock({ room: room.room, serverNow: room.serverNow }) };
}

/** Hands the store to the screens. */
export const StoreContext = createContext<TvStore | null>(null);

/** The store of the app; only screens read it, components get props (style guide §2.1). */
export function useStore(): TvStore {
  const store = useContext(StoreContext);
  if (store === null) throw new Error('useStore needs a StoreContext provider');
  return store;
}
