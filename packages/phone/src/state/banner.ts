import { effect, type ReadonlySignal, signal } from '@preact/signals';
import { type Banner, type BannerEvent, nextBanner } from '../model/connection-banner.ts';
import type { Schedule } from '../net/room-connection.ts';
import type { RoomStore } from './room.ts';

/** How long the green "Conectado" stays after the room is back (RECON-01 AC 3). */
export const CONNECTED_BANNER_MS = 1_000;

/** The reconnect strip, following the connection and the `welcome` that rebuilds the room (RECON-01). */
export interface BannerStore {
  banner: ReadonlySignal<Banner>;
}

/** Creates the strip's signal; "Conectado" goes away by itself after `CONNECTED_BANNER_MS`. */
export function createBannerStore(room: RoomStore, schedule: Schedule): BannerStore {
  const banner = signal<Banner>(null);
  let cancelHide: (() => void) | null = null;

  function apply(event: BannerEvent): void {
    const next = nextBanner(banner.value, event);
    if (next === banner.value) return;
    cancelHide?.();
    cancelHide = null;
    banner.value = next;
    if (next === 'connected') cancelHide = schedule(hide, CONNECTED_BANNER_MS);
  }

  function hide(): void {
    cancelHide = null;
    banner.value = null;
  }

  effect(() => apply({ type: 'status', status: room.connection.value }));
  room.listen((msg) => {
    if (msg.type === 'welcome') apply({ type: 'welcome' });
  });

  return { banner };
}
