import type { ReconnectPolicy } from '@bwords/core';
import type { StringKey } from '../strings/pt-BR.ts';

/** The waits between attempts; the last one repeats (TVEXIT-01 AC 8). */
export const RECONNECT_WAITS_MS = [500, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000, 60_000] as const;

/** Time without the room before the banner says "Sem conexão"; the TV keeps trying (TVEXIT-01 AC 6). */
export const NO_CONNECTION_AFTER_MS = 30_000;

/** Time without the room before the TV stops trying; by then the room has expired too (TVEXIT-01 AC 9). */
export const GIVE_UP_AFTER_MS = 600_000;

/** How long the room has been out of reach. */
export type ConnectionLoss = 'none' | 'reconnecting' | 'no-connection' | 'gave-up';

/** The wait before attempt `attempt` (0-based) (TVEXIT-01 AC 8). */
export function reconnectDelayMs(attempt: number): number {
  const lastIndex = RECONNECT_WAITS_MS.length - 1;
  // The index is clamped to the array, so the entry exists.
  return RECONNECT_WAITS_MS[Math.min(attempt, lastIndex)]!;
}

/** The TV has no "Tentar de novo" on screen, so it waits longer and tries for longer than the phone (TVEXIT-01 AC 8-9). */
export const TV_RECONNECT_POLICY: ReconnectPolicy = { delayMs: reconnectDelayMs, giveUpAfterMs: GIVE_UP_AFTER_MS };

/** The texts of the connection banner. */
export interface BannerTexts {
  title: StringKey;
  hint: StringKey | null;
}

const BANNER_TEXTS: Record<ConnectionLoss, BannerTexts | null> = {
  none: null,
  reconnecting: { title: 'reconnecting', hint: null },
  'no-connection': { title: 'noConnection', hint: null },
  'gave-up': { title: 'noConnection', hint: 'pressOkToRetry' },
};

/** What the banner says for `loss`; null when it does not show (TVEXIT-01 AC 5-7, 9). */
export function bannerTexts(loss: ConnectionLoss): BannerTexts | null {
  return BANNER_TEXTS[loss];
}
