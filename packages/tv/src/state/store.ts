import { computed, type ReadonlySignal, signal } from '@preact/signals';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { AudioDevice } from '../device/audio.ts';
import type { MusicPlayer } from '../device/music.ts';
import { type Screen, tvScreen } from '../model/screen.ts';
import { createMusicStore, type MusicStore } from './music.ts';
import { createRevealClock, type RevealClock } from './reveal.ts';
import { createRoomStore, type RoomDeps, type RoomStore } from './room.ts';
import { createSoundStore, type SoundStore } from './sound.ts';
import { createWordScrollStore, type WordScrollStore } from './word-scroll.ts';

/** The TV's state: signals and actions, one store per app (AD-015). */
export interface TvStore {
  room: RoomStore;
  reveal: RevealClock;
  sound: SoundStore;
  words: WordScrollStore;
  music: MusicStore;
  /** The screen for the room at the last reading of the server clock; the app and the music follow it. */
  screen: ReadonlySignal<Screen>;
  /** Reads the server clock: the screen, the sounds, the list and the music follow it. */
  tick(serverNow: number): void;
  /** A key or a click, the only input a TV has: it unlocks the sound and does what the room is waiting for (TVEXIT-01 AC 3, 10, TVAUDIO-01 AC 4). */
  press(): void;
}

/** The sound devices of the TV, over one `AudioContext`, so one unlock lets both play. */
export interface TvDevices {
  audio: AudioDevice;
  music: MusicPlayer;
  /** The real time in ms, which the music moves by. */
  now(): number;
}

/**
 * Creates the store. It is built by a factory, not as a module singleton, so each
 * test gets its own store with fake dependencies; `main.tsx` builds the real one.
 */
export function createTvStore(deps: RoomDeps, { audio, music: player, now }: TvDevices): TvStore {
  const room = createRoomStore(deps);
  const reveal = createRevealClock({ room: room.room, serverNow: room.serverNow, clockSynced: room.clockSynced });
  const serverNow = signal(room.serverNow());
  const screen = computed(() =>
    tvScreen(room.room.value, room.status.value, reveal.stageAt(serverNow.value), serverNow.value),
  );
  const sound = createSoundStore({ audio, room: room.room, plan: reveal.plan, clockSynced: room.clockSynced });
  const words = createWordScrollStore({
    room: room.room,
    plan: reveal.plan,
    results: reveal.results,
    serverNow: room.serverNow,
    playCheck: () => sound.play('check'),
  });
  const music = createMusicStore({ player, screen, room: room.room, now });
  room.onMessage((msg) => {
    if (msg.type === 'scroll') words.step(msg.direction);
  });
  return {
    room,
    reveal,
    sound,
    words,
    music,
    screen,
    tick(reading) {
      serverNow.value = reading;
      sound.tick(reading);
      words.tick(reading);
      music.tick(reading);
    },
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
