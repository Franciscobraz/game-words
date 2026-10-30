import type { RoundInfo } from '@bwords/core';
import { type ReadonlySignal, useComputed } from '@preact/signals';
import { useMemo } from 'preact/hooks';
import { BoardGrid } from '../components/BoardGrid.tsx';
import { BrandHeader } from '../components/BrandHeader.tsx';
import { RoomCard } from '../components/RoomCard.tsx';
import { RoundPlayerCard } from '../components/RoundPlayerCard.tsx';
import { TimeUpOverlay } from '../components/TimeUpOverlay.tsx';
import { boardLabels } from '../model/board-labels.ts';
import { formatClock, isAlert, isTimeUp } from '../model/clock.ts';
import { qrMatrix, roomUrl } from '../model/qr.ts';
import { type RoundPlayerRow, roundColumns } from '../model/round-columns.ts';
import { roundTitle } from '../model/round-title.ts';
import { useServerClock } from '../state/server-clock.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/round.css';

/** The round: the board in the center and the players beside it, with the numbers and never the words (TVPLAY-01). */
export function RoundScreen() {
  const { room } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const { code, round, settings, players, hostId, counts } = room.room.value;
  const roomCode = code ?? '';
  const matrix = useMemo(() => qrMatrix(roomUrl(location.origin, roomCode)), [roomCode]);
  const timeUp = useComputed(() => round !== null && isTimeUp(serverNow.value, round.endsAt));
  if (round === null || settings === null) return null;
  const { left, right } = roundColumns(players, counts, hostId);
  return (
    <main class="screen round" data-testid="round-screen">
      <header class="round__header">
        <BrandHeader size="small" />
        <RoomCard label={STRINGS.roomCodeLabel} code={roomCode} matrix={matrix} size="small" />
      </header>
      <div class="round__body">
        <PlayerColumn rows={left} />
        <div class="round__center">
          <div class="round__bar">
            <h1 class="round__title">{roundTitle(round.index, settings.rounds)}</h1>
            <RoundClock round={round} serverNow={serverNow} />
          </div>
          <div class={timeUp.value ? 'round__board round__board--time-up' : 'round__board'}>
            <BoardGrid labels={boardLabels(round.board)} size={settings.size} />
            {timeUp.value && <TimeUpOverlay />}
          </div>
        </div>
        <PlayerColumn rows={right} />
      </div>
    </main>
  );
}

interface PlayerColumnProps {
  rows: readonly RoundPlayerRow[];
}

function PlayerColumn({ rows }: PlayerColumnProps) {
  return (
    <div class="round__column">
      {rows.map((row) => (
        <div class="round__player" key={row.id}>
          <RoundPlayerCard row={row} />
        </div>
      ))}
    </div>
  );
}

interface RoundClockProps {
  round: RoundInfo;
  serverNow: ReadonlySignal<number>;
}

/** The time left; it reads the clock itself, so a tick repaints only the timer (TVPLAY-01 AC 3-4). */
function RoundClock({ round, serverNow }: RoundClockProps) {
  const remainingMs = round.endsAt - serverNow.value;
  return (
    <span class={clockClass(remainingMs)} data-testid="round-clock">
      {formatClock(remainingMs)}
    </span>
  );
}

/** The timer's look: plain, then in the alert color and pulsing, and still at "0:00" (TVPLAY-01 AC 4, 10). */
function clockClass(remainingMs: number): string {
  if (remainingMs <= 0) return 'round__clock round__clock--alert round__clock--over';
  return isAlert(remainingMs) ? 'round__clock round__clock--alert' : 'round__clock';
}
