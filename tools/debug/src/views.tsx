import { crownedPlayers, type PlayerInfo, type PodiumEntry, type RoundInfo, type RoundResultsMessage, type Settings } from '@bwords/core';
import { useState } from 'preact/hooks';
import type { LogEntry, View } from './socket.ts';

/** Tile text as the game shows it. */
export const tileText = (tile: string) => (tile === 'qu' ? 'Qu' : tile.toUpperCase());

export function nameOf(players: readonly PlayerInfo[], id: string): string {
  return players.find((p) => p.id === id)?.nickname ?? id;
}

/** Connection status, room code, phase and the last error. */
export function Header({ view }: { view: View }) {
  return (
    <dl class="facts">
      <dt>socket</dt>
      <dd class={`status-${view.status}`}>{view.status}</dd>
      <dt>sala</dt>
      <dd>
        <strong>{view.code ?? '-'}</strong>
      </dd>
      <dt>fase</dt>
      <dd>{view.phase ?? '-'}</dd>
      {view.lastError && (
        <>
          <dt>último erro</dt>
          <dd class="error">{view.lastError}</dd>
        </>
      )}
      {view.closedReason && (
        <>
          <dt>closed</dt>
          <dd class="error">{view.closedReason}</dd>
        </>
      )}
    </dl>
  );
}

export function SettingsView({ settings }: { settings: Settings | null }) {
  if (!settings) return null;
  return (
    <p class="small">
      {Object.entries(settings)
        .map(([k, v]) => `${k}=${String(v)}`)
        .join(' · ')}
    </p>
  );
}

/** Players with wins, crown, host marker and connection state; `counts` adds the TV's live counts. */
export function PlayersView({ view, counts }: { view: View; counts?: Record<string, number> }) {
  const crowned = new Set(crownedPlayers(view.players).map((p) => p.id));
  if (view.players.length === 0) return <p class="small">Nenhum jogador.</p>;
  return (
    <ul class="players">
      {view.players.map((p) => (
        <li key={p.id} class={p.connected ? '' : 'offline'}>
          <span class="swatch" style={{ background: p.color }} />
          {crowned.has(p.id) && <span title="coroa">👑</span>}
          <strong>{p.nickname}</strong>
          {p.id === view.hostId && <span class="tag">host</span>}
          {p.spectator && <span class="tag">spectator</span>}
          {!p.connected && <span class="tag">offline</span>}
          <span class="small">
            score {p.score} · wins {p.wins}
            {counts && ` · palavras ${counts[p.id] ?? 0}`}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Countdown until `startsAt`, then the time left until `endsAt`. */
export function Clock({ round, now }: { round: RoundInfo | null; now: number }) {
  if (!round) return null;
  if (now < round.startsAt) return <p class="clock">Contagem: {Math.ceil((round.startsAt - now) / 1000)} s</p>;
  if (now < round.endsAt) return <p class="clock">Tempo: {Math.ceil((round.endsAt - now) / 1000)} s</p>;
  return <p class="clock">Tempo esgotado</p>;
}

export function StaticBoard({ board }: { board: string[][] }) {
  return (
    <div class="board" style={{ gridTemplateColumns: `repeat(${board.length}, 2.2em)` }}>
      {board.flat().map((t, i) => (
        <span key={i} class="tile">
          {tileText(t)}
        </span>
      ))}
    </div>
  );
}

const wordText = (w: { word: string; points: number; spellings?: string[] }) =>
  `${w.word} (${w.points})${w.spellings ? ` [${w.spellings.join(', ')}]` : ''}`;

export function ResultsView({ results, players }: { results: RoundResultsMessage; players: readonly PlayerInfo[] }) {
  return (
    <div class="block">
      <h4>
        Resultado da rodada {results.index + 1}
        {results.last ? ' (última)' : ''}
      </h4>
      <p class="small">
        <strong>Comuns:</strong> {results.shared.map(wordText).join(', ') || '-'}
      </p>
      <ul>
        {results.players.map((r) => (
          <li key={r.playerId}>
            <strong>{nameOf(players, r.playerId)}</strong>: +{r.roundPoints} = {r.score} · únicas:{' '}
            {r.unique.map(wordText).join(', ') || '-'}
          </li>
        ))}
      </ul>
      <p class="small">
        <strong>Maior:</strong>{' '}
        {results.longest
          ? `${wordText(results.longest)} path [${results.longest.path.join(',')}] por ${
              results.longest.foundBy.map((id) => nameOf(players, id)).join(', ') || 'ninguém'
            }`
          : '-'}
      </p>
    </div>
  );
}

export function PodiumView({ ranking, players }: { ranking: PodiumEntry[]; players: readonly PlayerInfo[] }) {
  return (
    <div class="block">
      <h4>Pódio</h4>
      <ol>
        {ranking.map((e) => (
          <li key={e.playerId}>
            {nameOf(players, e.playerId)}: {e.score}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Collapsible log of sent (→) and received (←) messages, newest last. */
export function LogView({ log, onClear }: { log: LogEntry[]; onClear: () => void }) {
  const [open, setOpen] = useState(true);
  return (
    <details class="log" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        Log ({log.length}){' '}
        <button type="button" onClick={(e) => (e.preventDefault(), onClear())}>
          limpar
        </button>
      </summary>
      <ol>
        {log.map((l) => (
          <li key={l.id} class={`log-${l.dir}`}>
            <span class="small">{new Date(l.at).toLocaleTimeString()}</span> {l.dir === 'in' ? '←' : l.dir === 'out' ? '→' : '·'} {l.text}
          </li>
        ))}
      </ol>
    </details>
  );
}
