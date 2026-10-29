import { type ReadonlySignal, useComputed, useSignal } from '@preact/signals';
import type { ComponentType } from 'preact';
import { useEffect } from 'preact/hooks';
import { type Screen, screenFor } from './model/screen.ts';
import { CodeEntryScreen } from './screens/CodeEntryScreen.tsx';
import { ConnectingScreen } from './screens/ConnectingScreen.tsx';
import { JoinScreen } from './screens/JoinScreen.tsx';
import { useStore } from './state/store.ts';

/** How often the app reads the server clock, so the board replaces the countdown on time (COUNT-01 AC 2). */
const SERVER_CLOCK_TICK_MS = 100;

/**
 * The component of each screen (style guide §4, O): a new screen is a new entry.
 * Screens of later tasks show the connecting screen until they are built.
 */
const SCREENS: Record<Screen, ComponentType> = {
  'code-entry': CodeEntryScreen,
  connecting: ConnectingScreen,
  join: JoinScreen,
  lobby: ConnectingScreen,
  'host-lobby': ConnectingScreen,
  countdown: ConnectingScreen,
  board: ConnectingScreen,
  spectator: ConnectingScreen,
  'round-result': ConnectingScreen,
  podium: ConnectingScreen,
  kicked: ConnectingScreen,
  'room-closed': ConnectingScreen,
  replaced: ConnectingScreen,
};

/** Shows the screen for the room as the server describes it, at the server's time (UI-01). */
export function App() {
  const { room } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const screen = useComputed(() => screenFor(room.room.value, serverNow.value));
  const Current = SCREENS[screen.value];
  return <Current />;
}

/** The server clock as a signal, read every `SERVER_CLOCK_TICK_MS` (COUNT-01 AC 3). */
function useServerClock(read: () => number): ReadonlySignal<number> {
  const now = useSignal(read());
  useEffect(() => {
    const id = setInterval(() => {
      now.value = read();
    }, SERVER_CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [now, read]);
  return now;
}
