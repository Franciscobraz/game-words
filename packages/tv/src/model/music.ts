import { DEFAULT_SETTINGS, type Phase, type Settings } from '@bwords/core';
import type { RoomView } from './room-view.ts';
import type { Screen } from './screen.ts';

/** The four songs of the TV (AD-028 and its complement). */
export type MusicTrack = 'lobby' | 'match' | 'jingle' | 'finale';

/** The tempo of the match music in the last seconds of a round: 1.5 times faster, in the same pitch (MUSIC-01 AC 3). */
export const FAST_TEMPO = 1.5;

/** The normal tempo of every song. */
export const NORMAL_TEMPO = 1;

/** The match music speeds up this long before the end of the round (MUSIC-01 AC 3). */
export const FAST_TEMPO_REMAINING_MS = 15_000;

/**
 * The track of each screen (style guide §4, O). The result is the jingle or the finale by phase; the replaced tab is
 * silent (MUSIC-01 AC 1-2, 6-8). "Abrindo a sala" failing is still a TV screen, so it plays the lobby music too.
 */
const SCREEN_TRACKS: Record<Exclude<Screen, 'result'>, MusicTrack | null> = {
  opening: 'lobby',
  'open-failed': 'lobby',
  lobby: 'lobby',
  expired: 'lobby',
  countdown: 'match',
  round: 'match',
  words: 'match',
  replaced: null,
};

/**
 * The track the TV plays on `screen`, or null for silence. The screen already keeps itself while the connection is down,
 * so "Reconectando…" keeps the music (MUSIC-01 AC 9). With the room's music off no track plays, and the other sounds go
 * on (AC 13); before the first `welcome` the room has the defaults, music on (AC 14).
 */
export function musicTrack(screen: Screen, phase: Phase | null, settings: Settings | null): MusicTrack | null {
  if (!(settings ?? DEFAULT_SETTINGS).music) return null;
  if (screen === 'result') return phase === 'podium' ? 'finale' : 'jingle';
  return SCREEN_TRACKS[screen];
}

/**
 * The tempo of the match music at `serverNow`: fast from `FAST_TEMPO_REMAINING_MS` before the end of the round until the
 * end, and normal on "Tempo!", the words and the next countdown (MUSIC-01 AC 3-4).
 */
export function matchTempo(view: RoomView, serverNow: number): number {
  const { phase, round } = view;
  if (round === null || (phase !== 'round' && phase !== 'words')) return NORMAL_TEMPO;
  const inLastSeconds = serverNow >= round.endsAt - FAST_TEMPO_REMAINING_MS && serverNow < round.endsAt;
  return inLastSeconds ? FAST_TEMPO : NORMAL_TEMPO;
}
