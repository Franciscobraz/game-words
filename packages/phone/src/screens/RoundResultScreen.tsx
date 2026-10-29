import { HostMenu } from '../components/HostMenu.tsx';
import { TvIcon } from '../components/icons.tsx';
import { QuickScoreboard } from '../components/QuickScoreboard.tsx';
import { ResultHostActions } from '../components/ResultHostActions.tsx';
import { ResultWordList } from '../components/ResultWordList.tsx';
import { RoundScoreCard } from '../components/RoundScoreCard.tsx';
import { WaitingNote } from '../components/WaitingNote.tsx';
import { quickScoreboard } from '../model/players.ts';
import { myRoundSummary, myWordRows, resultRounds } from '../model/results.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/round-result.css';
import { RoomTopBar } from './RoomTopBar.tsx';

/**
 * The round result while the TV reveals it: "Rodada N de M • RESULTADO", "OLHE PARA A
 * TV", the player's points and words, the quick scoreboard, and the host's buttons or
 * "Aguardando <anfitrião> avançar…"; a spectator sees "Você joga na próxima rodada!"
 * in place of the points and words (RES-01, phone-round-result.jpg).
 */
export function RoundResultScreen() {
  const { room } = useStore();
  const view = room.room.value;
  const results = view.results;
  if (results === null) return null;

  const isHost = view.hostId !== null && view.hostId === view.myId;
  const host = view.players.find((p) => p.id === view.hostId) ?? null;
  const rounds = resultRounds(results, view.settings);
  const summary = myRoundSummary(results, view.myId);
  const next = rounds?.next ?? null;
  const nextLabel = next === null ? STRINGS.seePodium : STRINGS.nextRound(next.round, next.total);

  return (
    <main class="screen round-result">
      <RoomTopBar
        menu={isHost ? <HostMenu items={[{ label: STRINGS.closeRoom, confirm: STRINGS.confirmCloseRoom, onConfirm: room.closeRoom }]} /> : undefined}
      />

      {rounds !== null && (
        <p class="round-result__round">
          {STRINGS.resultRound(rounds.ended.round, rounds.ended.total)}
          <span class="round-result__tag">{STRINGS.resultTag}</span>
        </p>
      )}

      <section class="round-result__tv">
        <span class="round-result__tv-icon">
          <TvIcon />
        </span>
        <div class="round-result__tv-text">
          <h2 class="round-result__tv-title">{STRINGS.lookAtTv}</h2>
          <p class="round-result__tv-hint">{STRINGS.lookAtTvHint}</p>
        </div>
      </section>

      {summary === null ? (
        <p class="round-result__spectator">{STRINGS.playsNextRound}</p>
      ) : (
        <>
          <RoundScoreCard summary={summary} />
          <ResultWordList rows={myWordRows(view.found, results, view.myId)} />
        </>
      )}

      <QuickScoreboard rows={quickScoreboard(view.players)} myId={view.myId} />

      {isHost && <ResultHostActions nextLabel={nextLabel} onNext={room.next} onBackToLobby={room.backToLobby} />}
      {!isHost && host !== null && <WaitingNote text={STRINGS.waitingForHostToAdvance(host.nickname)} />}
    </main>
  );
}
