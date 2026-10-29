import { TopBar } from '../components/TopBar.tsx';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';

/** The lobby of a player who is not the host (LOBBY-01). */
export function LobbyScreen() {
  const view = useStore().room.room.value;
  return (
    <main class="screen">
      <TopBar code={view.code ?? ''} />
      <h2>{STRINGS.playersTitle}</h2>
    </main>
  );
}
