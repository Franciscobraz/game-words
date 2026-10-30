import { useComputed } from '@preact/signals';
import type { ComponentType } from 'preact';
import { type Screen, tvScreen } from './model/screen.ts';
import { CountdownScreen } from './screens/CountdownScreen.tsx';
import { ExpiredScreen } from './screens/ExpiredScreen.tsx';
import { LobbyScreen } from './screens/LobbyScreen.tsx';
import { OpenFailedScreen, OpeningScreen } from './screens/OpeningScreen.tsx';
import { ReplacedScreen } from './screens/ReplacedScreen.tsx';
import { ResultScreen } from './screens/ResultScreen.tsx';
import { RoundScreen } from './screens/RoundScreen.tsx';
import { WordsScreen } from './screens/WordsScreen.tsx';
import { useServerClock } from './state/server-clock.ts';
import { useStore } from './state/store.ts';

/** The component of each screen (style guide §4, O): a new screen is a new entry. */
const SCREENS: Record<Screen, ComponentType> = {
  opening: OpeningScreen,
  'open-failed': OpenFailedScreen,
  lobby: LobbyScreen,
  countdown: CountdownScreen,
  round: RoundScreen,
  words: WordsScreen,
  result: ResultScreen,
  expired: ExpiredScreen,
  replaced: ReplacedScreen,
};

/** Shows the screen for the room as the server describes it, at the server's time (TVUI-01). */
export function App() {
  const { room, reveal } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const screen = useComputed(() => tvScreen(room.room.value, room.status.value, reveal.stageAt(serverNow.value), serverNow.value));
  const Current = SCREENS[screen.value];
  return <Current />;
}
