import { ExitNotice } from '../components/ExitNotice.tsx';
import { STRINGS } from '../strings/pt-BR.ts';

/** The room was opened in another tab: this one only says so and stops (TVEXIT-01 AC 4). */
export function ReplacedScreen() {
  return (
    <main class="screen" data-testid="replaced-screen">
      <ExitNotice title={STRINGS.openedInAnotherTab} hint={null} />
    </main>
  );
}
