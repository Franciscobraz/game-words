import type { ComponentChildren } from 'preact';
import { ReconnectBanner } from '../components/ReconnectBanner.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { useStore } from '../state/store.ts';

/** Props of `RoomTopBar`. */
export interface RoomTopBarProps {
  /** The host's menu (⋮), only on the host's phone. */
  menu?: ComponentChildren;
}

/**
 * The top of every room screen with the store wired in: the room tag, the
 * preferences icon, the host's menu and, under them, the reconnect strip
 * (UI-01 AC 6, PREF-01 AC 1, RECON-01 AC 1-4).
 */
export function RoomTopBar({ menu }: RoomTopBarProps) {
  const { room, prefs } = useStore();
  return (
    <>
      <TopBar code={room.room.value.code ?? ''} onOpenPrefs={prefs.openSheet} menu={menu} />
      <ConnectionBanner />
    </>
  );
}

/** The reconnect strip alone, for the screens with their own header (RECON-01). */
export function ConnectionBanner() {
  const { room, banner } = useStore();
  return <ReconnectBanner banner={banner.banner.value} onRetry={room.retry} />;
}
