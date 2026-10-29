import { Logo } from '../components/Logo.tsx';
import { RoomTag } from '../components/RoomTag.tsx';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';

/** The join screen of a room (ENTRY-01 AC 1, phone-join.png). */
export function JoinScreen() {
  const code = useStore().room.room.value.code ?? '';
  return (
    <main class="screen">
      <header class="top-bar">
        <Logo />
        <RoomTag code={code} />
      </header>
      <label class="card">
        <span>{STRINGS.nicknameLabel}</span>
        <input type="text" />
      </label>
    </main>
  );
}
