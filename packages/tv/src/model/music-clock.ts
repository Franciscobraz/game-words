import type { MusicTrack } from './music.ts';

/** Where the music of the TV is. */
export interface MusicClock {
  /** The track playing now; null in silence. */
  track: MusicTrack | null;
  /** Where each track is, in seconds of its score; the real time is this divided by the tempo. */
  positionsS: Readonly<Record<MusicTrack, number>>;
}

/** Every track at its start, and none playing: a TV that just opened. */
export const INITIAL_MUSIC_CLOCK: MusicClock = {
  track: null,
  positionsS: { lobby: 0, match: 0, jingle: 0, finale: 0 },
};

/** Tracks that start again from the top each time they play: the result's songs (MUSIC-01 AC 6-7). */
const RESTARTING_TRACKS: ReadonlySet<MusicTrack> = new Set(['jingle', 'finale']);

const MS_PER_S = 1_000;

/**
 * Moves the music `elapsedMs` of real time forward and turns to `track`. The track that was playing went `elapsedMs *
 * tempo` along its score; the lobby and the match keep where they stopped and go on from there, and the jingle and the
 * finale start from the top each time they turn on (MUSIC-01 AC 5-7). The clock moves whether the browser lets the
 * sound out or not, so the unlock starts the music where it would be (AC 15).
 */
export function advanceMusic(clock: MusicClock, track: MusicTrack | null, elapsedMs: number, tempo: number): MusicClock {
  const positionsS = { ...clock.positionsS };
  if (clock.track !== null) positionsS[clock.track] += (elapsedMs / MS_PER_S) * tempo;
  if (track !== null && track !== clock.track && RESTARTING_TRACKS.has(track)) positionsS[track] = 0;
  return { track, positionsS };
}
