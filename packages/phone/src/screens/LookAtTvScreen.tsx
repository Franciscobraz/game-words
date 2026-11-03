import { MatchHostMenu } from '../components/HostMenu.tsx';
import { TvIcon } from '../components/icons.tsx';
import { WordsHostControls } from '../components/WordsHostControls.tsx';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/look-at-tv.css';
import { RoomTopBar } from './RoomTopBar.tsx';

/**
 * While the TV shows "Tempo!" and the words: "Olhe para a TV" on every phone, and the
 * host's ▲, ▼ and "VER RESULTADO" on the host's phone, whoever the host is now
 * (SYNC-01 AC 1, 5; WORDCTL-01 AC 4, 12). No word of the round reaches this screen.
 */
export function LookAtTvScreen() {
  const { room } = useStore();
  const view = room.room.value;
  const isHost = view.hostId !== null && view.hostId === view.myId;

  return (
    <main class="screen look-at-tv">
      <RoomTopBar menu={isHost ? <MatchHostMenu onBackToLobby={room.backToLobby} /> : undefined} />

      <section class="look-at-tv__notice">
        <span class="look-at-tv__icon">
          <TvIcon />
        </span>
        <h1 class="look-at-tv__title">{STRINGS.lookAtTvTitle}</h1>
        <p class="look-at-tv__hint">{STRINGS.wordsOnTv}</p>
      </section>

      {isHost && <WordsHostControls onScroll={room.scroll} onShowResult={room.showResult} />}
    </main>
  );
}
