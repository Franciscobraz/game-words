import { BoardGrid } from '../components/BoardGrid.tsx';
import { MatchHostMenu } from '../components/HostMenu.tsx';
import { GamepadIcon, GroupIcon } from '../components/icons.tsx';
import { PlayerRow } from '../components/PlayerRow.tsx';
import { RoundTimer } from '../components/RoundTimer.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { WaitingDots } from '../components/WaitingDots.tsx';
import { boardLabels } from '../model/board-view.ts';
import { formatClock, isAlert, remainingShare } from '../model/clock.ts';
import { lobbyRows } from '../model/players.ts';
import { roundPosition } from '../model/round-position.ts';
import { useServerClock } from '../state/server-clock.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/spectator.css';

/**
 * The round as a spectator sees it: the timer with its bar, the board faded and
 * deaf to the finger under "Você entra na próxima rodada.", and the players in the
 * room without their word counts, which only the TV gets (SPEC-01, AD-011,
 * phone-spectator.png).
 */
export function SpectatorScreen() {
  const { room } = useStore();
  const serverNow = useServerClock(room.serverNow).value;
  const view = room.room.value;
  const current = view.round;
  if (current === null) return null;

  const isHost = view.hostId !== null && view.hostId === view.myId;
  const position = roundPosition(current, view.settings);
  const remainingMs = current.endsAt - serverNow;
  const rows = lobbyRows(view.players, view.hostId, view.myId);

  return (
    <main class="screen spectator">
      <TopBar code={view.code ?? ''} menu={isHost ? <MatchHostMenu onBackToLobby={room.backToLobby} /> : undefined} />

      <RoundTimer
        clock={formatClock(remainingMs)}
        alert={isAlert(remainingMs)}
        roundLabel={position === null ? null : STRINGS.roundShort(position.round, position.total)}
        progress={remainingShare(serverNow, current.startsAt, current.endsAt)}
      />

      <div class="spectator__board">
        <BoardGrid labels={boardLabels(current.board)} size={current.board.length} path={[]} line={[]} color="" locked label={STRINGS.board} />
        <section class="spectator__notice">
          <span class="spectator__notice-icon">
            <GamepadIcon />
          </span>
          <p class="spectator__notice-text">{STRINGS.joinsNextRound}</p>
          <p class="spectator__watching">
            {STRINGS.watching}
            <WaitingDots />
          </p>
        </section>
      </div>

      <section class="spectator__players" aria-label={STRINGS.playersInRoomTitle}>
        <div class="spectator__players-head">
          <h2 class="spectator__players-title">
            <GroupIcon />
            {STRINGS.playersInRoomTitle}
          </h2>
          <span class="spectator__count">{STRINGS.playerCount(view.players.length)}</span>
        </div>
        <ul class="spectator__list">
          {rows.map((row) => (
            <PlayerRow key={row.id} nickname={row.nickname} color={row.color} crowned={false} tags={row.tags} dimmed={row.dimmed} />
          ))}
        </ul>
      </section>
    </main>
  );
}
