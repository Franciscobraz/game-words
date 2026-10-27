import type { RoomDO } from './room-do.ts';

/** Bindings and vars of the Worker (`wrangler.jsonc`). */
export interface Env {
  /** Static assets: the language packs under `<id>/`. */
  ASSETS: Fetcher;
  ROOM: DurableObjectNamespace<RoomDO>;
  ROOM_IDLE_TIMEOUT_MIN?: string;
  TV_DISCONNECT_TIMEOUT_MIN?: string;
}
