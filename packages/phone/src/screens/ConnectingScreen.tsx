import { RoomTag } from '../components/RoomTag.tsx';
import { useStore } from '../state/store.ts';

/**
 * Between opening a room and its first `welcome`: only the room tag, so a phone
 * with a saved token does not flash the join screen (ENTRY-01 AC 6).
 */
export function ConnectingScreen() {
  const code = useStore().room.room.value.code;
  return (
    <main class="screen" aria-busy="true">
      {code !== null && (
        <header class="top-bar">
          <RoomTag code={code} />
        </header>
      )}
    </main>
  );
}
