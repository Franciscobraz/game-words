import { DEFAULT_SETTINGS } from '@bwords/core';
import type { ReadonlySignal } from '@preact/signals';
import type { MusicPlayer } from '../device/music.ts';
import { matchTempo, musicTrack } from '../model/music.ts';
import { advanceMusic, INITIAL_MUSIC_CLOCK, type MusicClock } from '../model/music-clock.ts';
import type { RoomView } from '../model/room-view.ts';
import type { Screen } from '../model/screen.ts';

/** What the music needs from the rest of the TV; the tests pass fakes (style guide §4, D). */
export interface MusicDeps {
  player: MusicPlayer;
  /** The screen on the TV; the track comes from it (MUSIC-01 AC 1-2, 6-9). */
  screen: ReadonlySignal<Screen>;
  room: ReadonlySignal<RoomView>;
  /** The real time in ms. The server clock jumps on a resync, and the music must not. */
  now(): number;
}

/** The music of the TV (MUSIC-01). */
export interface MusicStore {
  /** Reads the server clock: moves the music by the real time since the last reading and plays what is due. */
  tick(serverNow: number): void;
}

/**
 * Links the screen, the room and the clocks to the player: `musicTrack`, `matchTempo` and `advanceMusic` decide, and
 * this only plays. The music moves by the rule whether the browser lets the sound out or not, so the unlock starts it
 * where it would be (MUSIC-01 AC 15).
 */
export function createMusicStore({ player, screen, room, now }: MusicDeps): MusicStore {
  let clock: MusicClock = INITIAL_MUSIC_CLOCK;
  let lastReadingMs = now();

  return {
    tick(serverNow) {
      const readingMs = now();
      const elapsedMs = Math.max(0, readingMs - lastReadingMs);
      lastReadingMs = readingMs;

      const view = room.peek();
      const settings = view.settings ?? DEFAULT_SETTINGS;
      const track = musicTrack(screen.peek(), view.phase, view.settings);
      const tempo = matchTempo(view, serverNow);
      clock = advanceMusic(clock, track, elapsedMs, tempo);

      const positionS = clock.track === null ? 0 : clock.positionsS[clock.track];
      player.play({ track: clock.track, positionS, tempo, volume: settings.volume, muted: settings.muted });
    },
  };
}
