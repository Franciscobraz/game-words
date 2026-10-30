import { ArrowForwardIcon, CelebrationIcon, DoorIcon, DoorOutlineIcon, TvIcon, WavingHandIcon } from '../components/icons.tsx';
import { PrimaryButton } from '../components/PrimaryButton.tsx';
import { closingHostName } from '../model/messages.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/exit.css';

/** "ENTRAR EM OUTRA SALA": back to `/` and the code screen (EXIT-01 AC 5). */
function useEnterAnotherRoom(): () => void {
  const { room } = useStore();
  return () => {
    history.pushState(null, '', '/');
    room.leaveRoom();
  };
}

/** Removed by the host: a neutral icon, no red alert, and the way to another room (EXIT-01 AC 1, phone-kicked.png). */
export function KickedScreen() {
  const enterAnotherRoom = useEnterAnotherRoom();
  return (
    <main class="screen exit">
      <span class="exit__emblem">
        <span class="exit__icon">
          <DoorOutlineIcon />
        </span>
        <span class="exit__badge">
          <WavingHandIcon />
        </span>
      </span>
      <h1 class="exit__title">{STRINGS.kicked}</h1>
      <div class="exit__action">
        <PrimaryButton tone="action" onPress={enterAnotherRoom}>
          {STRINGS.enterAnotherRoom}
          <ArrowForwardIcon />
        </PrimaryButton>
      </div>
    </main>
  );
}

/**
 * The room is over: "<anfitrião> encerrou a sala" with "Obrigado por jogar!" when the
 * host closed it, "A sala foi encerrada" when it closed on its own (EXIT-01 AC 2-3,
 * phone-room-closed.png).
 */
export function RoomClosedScreen() {
  const { room } = useStore();
  const view = room.room.value;
  const enterAnotherRoom = useEnterAnotherRoom();
  const host = view.closeReason === null ? null : closingHostName(view.closeReason, view.players, view.hostId);

  return (
    <main class="screen exit">
      <section class="exit__card">
        <span class="exit__emblem" aria-hidden="true">
          <span class="exit__icon exit__icon--celebration">
            <CelebrationIcon />
          </span>
          <span class="exit__dot exit__dot--large" />
          <span class="exit__dot exit__dot--small" />
          <span class="exit__dot exit__dot--medium" />
        </span>
        <h1 class="exit__title">{host === null ? STRINGS.roomClosed : STRINGS.hostClosedRoom(host)}</h1>
        {host !== null && <p class="exit__thanks">{STRINGS.thanksForPlaying}</p>}
      </section>
      <div class="exit__action">
        <PrimaryButton tone="action" onPress={enterAnotherRoom}>
          <DoorIcon />
          {STRINGS.enterAnotherRoom}
        </PrimaryButton>
      </div>
    </main>
  );
}

/** The same token opened elsewhere took this phone's place; it does not reconnect (EXIT-01 AC 4). */
export function ReplacedScreen() {
  return (
    <main class="screen exit">
      <span class="exit__icon">
        <TvIcon />
      </span>
      <h1 class="exit__title">{STRINGS.replaced}</h1>
    </main>
  );
}
