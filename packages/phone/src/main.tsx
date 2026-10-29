import { render } from 'preact';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/700.css';
import '@fontsource/nunito-sans/800.css';
import '@bwords/theme/tokens.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './app.tsx';
import { playHitSound } from './device/hit-sound.ts';
import { browserStorage } from './device/storage.ts';
import { canVibrate, vibrate } from './device/vibration.ts';
import { browserWakeLock, onPageVisible } from './device/wake-lock.ts';
import { parseRoomPath } from './model/room-code.ts';
import { browserSchedule, browserSocket } from './net/browser.ts';
import { createRoomConnection } from './net/room-connection.ts';
import { createPhoneStore, StoreContext } from './state/store.ts';

/** Mounts the phone app over the real socket, clock, storage and device (UI-01, PREF-01). */
const store = createPhoneStore({
  openConnection: (handlers) =>
    createRoomConnection({ openSocket: browserSocket, now: () => Date.now(), schedule: browserSchedule, ...handlers }),
  storage: browserStorage,
  schedule: browserSchedule,
  device: { vibrate, playHitSound, canVibrate },
  wakeLock: browserWakeLock(),
  onVisible: onPageVisible,
});

// `/KBXT` opens room KBXT; `/` stays on the code screen (ENTRY-01 AC 1-2).
const code = parseRoomPath(location.pathname);
if (code !== null) store.room.openRoom(code);

render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById('app')!,
);
