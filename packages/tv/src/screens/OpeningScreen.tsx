import { STRINGS } from '../strings/pt-BR.ts';

/** The moment before the first `welcome`. */
export function OpeningScreen() {
  return <main class="screen" data-testid="opening-screen" />;
}

/** The server could not give a room; the store keeps asking (TVROOM-01 AC 5). */
export function OpenFailedScreen() {
  return (
    <main class="screen screen--message" data-testid="open-failed-screen">
      {STRINGS.roomOpenFailed}
    </main>
  );
}
