import { BoardGrid } from '../components/BoardGrid.tsx';
import { FitSquare } from '../components/FitSquare.tsx';
import { FoundWords } from '../components/FoundWords.tsx';
import { RoundTimer } from '../components/RoundTimer.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { WordRack } from '../components/WordRack.tsx';
import { isBoardOpen } from '../model/board-lock.ts';
import { boardLabels, feedbackText, foundChips, pathLine, rackContent } from '../model/board-view.ts';
import { formatClock, isAlert, isTimeUp } from '../model/clock.ts';
import { foundTotals } from '../model/found.ts';
import { roundPosition } from '../model/round-position.ts';
import { useServerClock } from '../state/server-clock.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/board-screen.css';

/**
 * The round of a player: the timer with the round and the tally, the word under the
 * finger and its verdict, the board to swipe and the found words. The board locks
 * and shows "Tempo!" from `endsAt` until the results (PLAY-01, phone-board.png,
 * phone-feedbacks.png).
 */
export function BoardScreen() {
  const { room, round } = useStore();
  const serverNow = useServerClock(room.serverNow).value;
  const view = room.room.value;
  const current = view.round;
  if (current === null) return null;

  const size = current.board.length;
  const me = view.players.find((p) => p.id === view.myId);
  const color = me?.color ?? '';
  const position = roundPosition(current, view.settings);
  const remainingMs = current.endsAt - serverNow;
  const totals = foundTotals(view.found);
  const path = round.path.value;
  const feedback = round.feedback.value;
  const rack = rackContent(current.board, path, feedback);
  const timeUp = isTimeUp(serverNow, current.endsAt);
  const locked = !isBoardOpen(view, room.connection.value, serverNow);

  return (
    <main class="screen board-screen">
      <TopBar code={view.code ?? ''} />

      <RoundTimer
        clock={formatClock(remainingMs)}
        alert={isAlert(remainingMs)}
        roundLabel={position === null ? null : STRINGS.roundShort(position.round, position.total)}
        tally={STRINGS.roundTally(totals.words, totals.points)}
      />

      <WordRack
        letters={rack.letters}
        tone={rack.tone}
        color={color}
        feedback={feedback === null ? null : { kind: feedback.kind, text: feedbackText(feedback) }}
      />

      <FitSquare
        below={
          <FoundWords
            title={STRINGS.foundWords}
            total={STRINGS.foundTotal(view.found.length)}
            chips={foundChips(view.found)}
            color={color}
          />
        }
      >
        <BoardGrid
          labels={boardLabels(current.board)}
          size={size}
          path={path}
          line={pathLine(path, size)}
          color={color}
          locked={locked}
          label={STRINGS.board}
          onReachTile={round.extendPathTo}
          onRelease={() => void round.releasePath()}
        />
        {timeUp && (
          <p class="board-screen__time-up" role="alert">
            {STRINGS.timeUp}
          </p>
        )}
      </FitSquare>
    </main>
  );
}
