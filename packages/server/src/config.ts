import type { RoomConfig } from '@bwords/core';

/** Defaults of the expiry timeouts, in minutes (EXP-01 AC 1). */
export const DEFAULT_IDLE_MIN = 30;
export const DEFAULT_TV_GONE_MIN = 10;

/** The Worker vars `readConfig` reads; wrangler passes them as strings. */
export interface ConfigVars {
  ROOM_IDLE_TIMEOUT_MIN?: unknown;
  TV_DISCONNECT_TIMEOUT_MIN?: unknown;
}

/** A whole number of minutes >= 0, or the default for anything else (EXP-01 AC 6). */
function minutes(value: unknown, fallback: number): number {
  const text = typeof value === 'number' ? String(value) : value;
  return typeof text === 'string' && /^\d+$/.test(text) ? Number(text) : fallback;
}

/** The room's expiry timeouts from the Worker vars; 0 turns a rule off (EXP-01 AC 4). */
export function readConfig(env: ConfigVars): RoomConfig {
  return {
    idleMin: minutes(env.ROOM_IDLE_TIMEOUT_MIN, DEFAULT_IDLE_MIN),
    tvGoneMin: minutes(env.TV_DISCONNECT_TIMEOUT_MIN, DEFAULT_TV_GONE_MIN),
  };
}
