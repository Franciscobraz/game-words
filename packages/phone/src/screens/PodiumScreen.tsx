import { HostMenu } from '../components/HostMenu.tsx';
import { MatchPerformance } from '../components/MatchPerformance.tsx';
import { PodiumHighlight } from '../components/PodiumHighlight.tsx';
import { PodiumHostActions } from '../components/PodiumHostActions.tsx';
import { RankingList } from '../components/RankingList.tsx';
import { WaitingNote } from '../components/WaitingNote.tsx';
import { myPlacement, podiumRows, rankingLines } from '../model/players.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/podium.css';
import { RoomTopBar } from './RoomTopBar.tsx';

/**
 * The end of the match: the personal card with confetti for the winner, the
 * player's words and longest word summed on the phone, the ranking, and the host's
 * three buttons or "Aguardando <anfitrião> decidir…". A spectator of the whole match
 * sees only the ranking and "Você joga na próxima partida" (POD-01, phone-podium.jpg).
 */
export function PodiumScreen() {
  const { room, match } = useStore();
  const view = room.room.value;
  if (view.podium === null) return null;

  const isHost = view.hostId !== null && view.hostId === view.myId;
  const host = view.players.find((p) => p.id === view.hostId) ?? null;
  const me = view.players.find((p) => p.id === view.myId) ?? null;
  const rows = podiumRows(view.podium, view.players);
  const placement = myPlacement(rows, view.myId);
  const lines = rankingLines(rows, view.players, view.hostId, view.myId);
  const summary = match.summary.value;

  return (
    <main class="screen podium">
      <RoomTopBar
        menu={isHost ? <HostMenu items={[{ label: STRINGS.closeRoom, confirm: STRINGS.confirmCloseRoom, onConfirm: room.closeRoom }]} /> : undefined}
      />

      {placement !== null && me !== null && (
        <>
          <PodiumHighlight nickname={me.nickname} color={me.color} place={placement.place} total={placement.total} wins={placement.wins} />
          <MatchPerformance wordCount={summary.wordCount} longest={summary.longest} />
        </>
      )}
      {placement === null && <p class="podium__spectator">{STRINGS.playsNextMatch}</p>}

      <RankingList lines={lines} />

      {isHost && <PodiumHostActions onPlayAgain={room.playAgain} onBackToLobby={room.backToLobby} onCloseRoom={room.closeRoom} />}
      {!isHost && placement !== null && host !== null && <WaitingNote text={STRINGS.waitingForHostToDecide(host.nickname)} />}
    </main>
  );
}
