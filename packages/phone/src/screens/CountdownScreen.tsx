import { TimerIcon } from '../components/icons.tsx';
import { MatchHostMenu } from '../components/HostMenu.tsx';
import { countdownNumber } from '../model/clock.ts';
import { roundPosition } from '../model/round-position.ts';
import { useServerClock } from '../state/server-clock.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/countdown.css';
import { RoomTopBar } from './RoomTopBar.tsx';

/**
 * The countdown before the board: "RODADA N DE M", the room tag, 3, 2 and 1 one per
 * second on the server clock, and "Prepare o dedo!"; no letter of the board shows
 * here (COUNT-01 AC 1-2, phone-countdown.png).
 */
export function CountdownScreen() {
  const { room } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const view = room.room.value;
  const isHost = view.hostId !== null && view.hostId === view.myId;
  const position = roundPosition(view.round, view.settings);
  const number = view.round === null ? null : countdownNumber(serverNow.value, view.round.startsAt);

  return (
    <main class="screen countdown">
      <RoomTopBar menu={isHost ? <MatchHostMenu onBackToLobby={room.backToLobby} /> : undefined} />

      {position !== null && (
        <p class="countdown__round">
          <TimerIcon />
          {STRINGS.roundOfUpper(position.round, position.total)}
        </p>
      )}

      <div class="countdown__body">
        {/* The key restarts the pop of each new number. */}
        <span key={number} class="countdown__number" role="timer" aria-live="assertive">
          {number}
        </span>
        <h1 class="countdown__ready">{STRINGS.getReady}</h1>
        <p class="countdown__hint">{STRINGS.lettersSoon}</p>
      </div>
    </main>
  );
}
