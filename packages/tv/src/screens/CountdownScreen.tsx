import { countdownNumber } from '../model/clock.ts';
import { roundTitle } from '../model/round-title.ts';
import { useServerClock } from '../state/server-clock.ts';
import { useStore } from '../state/store.ts';
import '../styles/countdown.css';

/** "RODADA N DE M" and the giant number; no letter of the board reaches the screen before `startsAt` (TVPLAY-01 AC 1). */
export function CountdownScreen() {
  const { room } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const { round, settings } = room.room.value;
  const number = round === null ? null : countdownNumber(serverNow.value, round.startsAt);
  return (
    <main class="screen countdown" data-testid="countdown-screen">
      {round !== null && settings !== null && <h1 class="countdown__title">{roundTitle(round.index, settings.rounds)}</h1>}
      {number !== null && (
        // A new element per number restarts the entrance.
        <p class="countdown__number" key={number} data-testid="countdown-number">
          {number}
        </p>
      )}
    </main>
  );
}
