import { useComputed } from '@preact/signals';
import type { ComponentType } from 'preact';
import { PrefsSheet } from './components/PrefsSheet.tsx';
import { type Screen, screenFor } from './model/screen.ts';
import { BoardScreen } from './screens/BoardScreen.tsx';
import { CodeEntryScreen } from './screens/CodeEntryScreen.tsx';
import { CountdownScreen } from './screens/CountdownScreen.tsx';
import { ConnectingScreen } from './screens/ConnectingScreen.tsx';
import { KickedScreen, ReplacedScreen, RoomClosedScreen } from './screens/ExitScreens.tsx';
import { HostLobbyScreen } from './screens/HostLobbyScreen.tsx';
import { JoinScreen } from './screens/JoinScreen.tsx';
import { LobbyScreen } from './screens/LobbyScreen.tsx';
import { PodiumScreen } from './screens/PodiumScreen.tsx';
import { RoundResultScreen } from './screens/RoundResultScreen.tsx';
import { SpectatorScreen } from './screens/SpectatorScreen.tsx';
import { useServerClock } from './state/server-clock.ts';
import { useStore } from './state/store.ts';

/**
 * The component of each screen (style guide §4, O): a new screen is a new entry.
 */
const SCREENS: Record<Screen, ComponentType> = {
  'code-entry': CodeEntryScreen,
  connecting: ConnectingScreen,
  join: JoinScreen,
  lobby: LobbyScreen,
  'host-lobby': HostLobbyScreen,
  countdown: CountdownScreen,
  board: BoardScreen,
  spectator: SpectatorScreen,
  'round-result': RoundResultScreen,
  podium: PodiumScreen,
  kicked: KickedScreen,
  'room-closed': RoomClosedScreen,
  replaced: ReplacedScreen,
};

/**
 * Shows the screen for the room as the server describes it, at the server's time,
 * with the preferences sheet over it when the person icon opened it (UI-01, PREF-01 AC 1).
 */
export function App() {
  const { room, prefs } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const screen = useComputed(() => screenFor(room.room.value, serverNow.value));
  const Current = SCREENS[screen.value];
  const chosen = prefs.prefs.value;
  return (
    <>
      <Current />
      {prefs.isSheetOpen.value && (
        <PrefsSheet
          vibrate={chosen.vibrate}
          sound={chosen.sound}
          canVibrate={prefs.canVibrate}
          onToggle={(name) => prefs.setPref(name, !chosen[name])}
          onClose={prefs.closeSheet}
        />
      )}
    </>
  );
}
