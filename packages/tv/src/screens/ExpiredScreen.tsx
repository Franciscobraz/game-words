import { ExitNotice } from '../components/ExitNotice.tsx';
import { STRINGS } from '../strings/pt-BR.ts';

/** The room expired; a key or a click opens a new one, and `app.tsx` listens for it (TVEXIT-01 AC 2-3). */
export function ExpiredScreen() {
  return (
    <main class="screen" data-testid="expired-screen">
      <ExitNotice title={STRINGS.roomExpired} hint={STRINGS.pressOkForNewRoom} />
    </main>
  );
}
