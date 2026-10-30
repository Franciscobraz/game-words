import { useMemo } from 'preact/hooks';
import '../styles/lobby.css';
import { QrCode } from '../components/QrCode.tsx';
import { qrMatrix, roomUrl } from '../model/qr.ts';
import { useStore } from '../state/store.ts';

/** The lobby; the rest of its content comes with TVLOBBY-01. */
export function LobbyScreen() {
  const { room } = useStore();
  const code = room.room.value.code ?? '';
  const matrix = useMemo(() => qrMatrix(roomUrl(location.origin, code)), [code]);
  return (
    <main class="screen" data-testid="lobby-screen">
      <div class="lobby__qr">
        <QrCode matrix={matrix} withMark />
      </div>
    </main>
  );
}
