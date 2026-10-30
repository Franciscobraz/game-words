import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { AudioDevice } from '../device/audio.ts';
import { createRevealClock, type RevealClock } from './reveal.ts';
import { createRoomStore, type RoomDeps, type RoomStore } from './room.ts';
import { createSoundStore, type SoundStore } from './sound.ts';

/** The TV's state: signals and actions, one store per app (AD-015). */
export interface TvStore {
  room: RoomStore;
  reveal: RevealClock;
  sound: SoundStore;
  /** A key or a click, the only input a TV has: it unlocks the sound and does what the room is waiting for (TVEXIT-01 AC 3, 10, TVAUDIO-01 AC 4). */
  press(): void;
}

/**
 * Creates the store. It is built by a factory, not as a module singleton, so each
 * test gets its own store with fake dependencies; `main.tsx` builds the real one.
 */
export function createTvStore(deps: RoomDeps, audio: AudioDevice): TvStore {
  const room = createRoomStore(deps);
  const reveal = createRevealClock({ room: room.room, serverNow: room.serverNow });
  const sound = createSoundStore({ audio, room: room.room, plan: reveal.plan });
  return {
    room,
    reveal,
    sound,
    press() {
      sound.unlock();
      room.pressOk();
    },
  };
}

/** Hands the store to the screens. */
export const StoreContext = createContext<TvStore | null>(null);

/** The store of the app; only screens read it, components get props (style guide §2.1). */
export function useStore(): TvStore {
  const store = useContext(StoreContext);
  if (store === null) throw new Error('useStore needs a StoreContext provider');
  return store;
}
