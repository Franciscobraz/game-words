import { createRoomConnection, tvHello } from '@bwords/core';
import { render } from 'preact';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/700.css';
import '@fontsource/nunito-sans/800.css';
import '@fontsource/nunito-sans/900.css';
import '@bwords/theme/tokens.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './app.tsx';
import { browserAudioContext, createAudio } from './device/audio.ts';
import { TV_RECONNECT_POLICY } from './model/reconnect.ts';
import { browserSchedule, browserSocket, requestNewRoom } from './net/browser.ts';
import { createTvStore, StoreContext } from './state/store.ts';
import { createTokenStore } from './state/token-store.ts';

/** Mounts the TV app over the real socket, clock and storage, and opens the room (TVROOM-01, TVUI-01). */
const store = createTvStore(
  {
    openConnection: (handlers) =>
      createRoomConnection({
        openSocket: browserSocket,
        now: () => Date.now(),
        schedule: browserSchedule,
        hello: tvHello,
        reconnect: TV_RECONNECT_POLICY,
        ...handlers,
      }),
    createRoom: requestNewRoom,
    tokens: createTokenStore(() => localStorage),
    schedule: browserSchedule,
  },
  createAudio(browserAudioContext),
);

store.room.open();

render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById('app')!,
);
