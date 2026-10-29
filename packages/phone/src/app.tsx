import { useComputed } from '@preact/signals';
import type { ComponentType } from 'preact';
import { type Screen, screenFor } from './model/screen.ts';
import { BoardScreen } from './screens/BoardScreen.tsx';
import { CodeEntryScreen } from './screens/CodeEntryScreen.tsx';
import { CountdownScreen } from './screens/CountdownScreen.tsx';
import { ConnectingScreen } from './screens/ConnectingScreen.tsx';
import { KickedScreen, ReplacedScreen, RoomClosedScreen } from './screens/ExitScreens.tsx';
import { HostLobbyScreen } from './screens/HostLobbyScreen.tsx';
import { JoinScreen } from './screens/JoinScreen.tsx';
import { LobbyScreen } from './screens/LobbyScreen.tsx';
import { RoundResultScreen } from './screens/RoundResultScreen.tsx';
import { SpectatorScreen } from './screens/SpectatorScreen.tsx';
import { useServerClock } from './state/server-clock.ts';
import { useStore } from './state/store.ts';

/**
 * The component of each screen (style guide §4, O): a new screen is a new entry.
 * Screens of later tasks show the connecting screen until they are built.
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
  podium: ConnectingScreen,
  kicked: KickedScreen,
  'room-closed': RoomClosedScreen,
  replaced: ReplacedScreen,
};

/** Shows the screen for the room as the server describes it, at the server's time (UI-01). */
export function App() {
  const { room } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const screen = useComputed(() => screenFor(room.room.value, serverNow.value));
  const Current = SCREENS[screen.value];
  return <Current />;
}
