import type { RoundInfo, Settings } from '@bwords/core';
import { useMemo } from 'preact/hooks';
import { BoardGrid } from '../components/BoardGrid.tsx';
import { BrandHeader } from '../components/BrandHeader.tsx';
import { LongestWordCard } from '../components/LongestWordCard.tsx';
import { PodiumCard } from '../components/PodiumCard.tsx';
import { RoomCard } from '../components/RoomCard.tsx';
import { StandingLine } from '../components/StandingLine.tsx';
import { boardLabels } from '../model/board-labels.ts';
import { litTiles } from '../model/lit-tiles.ts';
import { longestCard } from '../model/longest-card.ts';
import { qrMatrix, roomUrl } from '../model/qr.ts';
import { resultHeader } from '../model/result-header.ts';
import { resultStartAt } from '../model/reveal.ts';
import { standings } from '../model/standings.ts';
import { useServerClock } from '../state/server-clock.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/result.css';

/** The result: the board with the longest word, the accumulated score, and what the host decides next (TVRES-01). */
export function ResultScreen() {
  const { room, reveal } = useStore();
  const { code, players, hostId, round, settings } = room.room.value;
  const results = reveal.results.value;
  const roomCode = code ?? '';
  const matrix = useMemo(() => qrMatrix(roomUrl(location.origin, roomCode)), [roomCode]);
  // A TV that just connected to this phase has no results for an instant.
  if (results === null || settings === null) return <main class="screen" data-testid="result-screen" />;

  const { top, rest } = standings(players);
  const hostName = players.find((player) => player.id === hostId)?.nickname ?? null;
  const header = resultHeader(results, { top }, hostName, settings.rounds);
  return (
    <main class="screen result" data-testid="result-screen">
      <header class="result__header">
        <BrandHeader size="compact" />
        <div class="result__header-end">
          <h1 class="result__title" data-testid="result-title">
            {header.prefix !== null && (
              <span class="result__title-prefix">
                {header.prefix}
                <span class="result__title-separator">·</span>
              </span>
            )}
            {header.title}
          </h1>
          <RoomCard label={STRINGS.roomCodeLabel} code={roomCode} matrix={matrix} size="result" />
        </div>
      </header>
      <div class="result__body">
        <div class="result__left">
          <div class="result__board-panel">
            {round !== null && <LitBoard round={round} settings={settings} path={results.longest?.path ?? []} />}
          </div>
          {results.longest !== null && <LongestWordCard card={longestCard(results.longest, players)} />}
        </div>
        <div class="result__right">
          <div class="result__standings-title">
            <h2 class="result__standings-heading">{STRINGS.matchStandings}</h2>
            <span class="result__standings-round">{STRINGS.afterRound(results.index + 1)}</span>
          </div>
          <div class="result__cards">
            {top.map((row) => (
              <PodiumCard row={row} confetti={header.confetti && row.place === 1} key={row.id} />
            ))}
          </div>
          {rest.length > 0 && (
            <div class="result__rest" data-testid="result-rest">
              {rest.map((row) => (
                <StandingLine row={row} key={row.id} />
              ))}
            </div>
          )}
        </div>
      </div>
      <footer class="result__footer">
        {header.footer !== null && (
          <>
            <span class="result__footer-dot" aria-hidden="true" />
            <span data-testid="result-footer">{header.footer}</span>
          </>
        )}
      </footer>
    </main>
  );
}

interface LitBoardProps {
  round: RoundInfo;
  settings: Settings;
  path: readonly number[];
}

/** The board; it reads the clock itself, so a tick repaints only the board (TVRES-01 AC 5). */
function LitBoard({ round, settings, path }: LitBoardProps) {
  const { room, reveal } = useStore();
  const serverNow = useServerClock(room.serverNow);
  const plan = reveal.plan.value;
  const elapsedMs = plan === null ? 0 : serverNow.value - resultStartAt(plan);
  return (
    <div class="result__board">
      <BoardGrid labels={boardLabels(round.board)} size={settings.size} lit={litTiles(path, elapsedMs)} />
    </div>
  );
}
