import type { ScoreRow } from '../model/players.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/quick-scoreboard.css';
import { PlayerAvatar } from './PlayerAvatar.tsx';

/** Props of `QuickScoreboard`. */
export interface QuickScoreboardProps {
  /** From `quickScoreboard`: the highest score first, spectators last. */
  rows: readonly ScoreRow[];
  /** This phone's player, whose column is highlighted. */
  myId: string | null;
}

/**
 * "PLACAR RÁPIDO DA MESA": one column per player with the place, the circle, the
 * nickname and the score; a spectator shows "Esp." in place of the score (RES-01 AC 6).
 * More players than the width holds scroll sideways inside the card, never the page.
 */
export function QuickScoreboard({ rows, myId }: QuickScoreboardProps) {
  return (
    <section class="quick-scoreboard" aria-label={STRINGS.quickScoreboard}>
      <h2 class="quick-scoreboard__title">{STRINGS.quickScoreboard}</h2>
      <ol class="quick-scoreboard__list">
        {rows.map((row) => (
          <li key={row.id} class={itemClass(row, myId)}>
            <span class="quick-scoreboard__place">{STRINGS.ordinal(row.place)}</span>
            <PlayerAvatar nickname={row.nickname} color={row.color} size="small" />
            <span class="quick-scoreboard__name">{row.nickname}</span>
            {row.spectator ? (
              <span class="quick-scoreboard__spectator">{STRINGS.spectatorShort}</span>
            ) : (
              <span class="quick-scoreboard__score">{row.score}</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** The column's class: highlighted for this phone, muted for a spectator. */
function itemClass(row: ScoreRow, myId: string | null): string {
  const mine = row.id === myId ? ' quick-scoreboard__item--mine' : '';
  const spectator = row.spectator ? ' quick-scoreboard__item--spectator' : '';
  return `quick-scoreboard__item${mine}${spectator}`;
}
