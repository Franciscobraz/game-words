import type { RankingLine } from '../model/players.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/ranking-list.css';
import { CrownIcon, EyeIcon } from './icons.tsx';
import { PlayerAvatar } from './PlayerAvatar.tsx';
import { PlayerTagPill } from './PlayerTagPill.tsx';

/** Props of `RankingList`. */
export interface RankingListProps {
  /** From `rankingLines`: the server's ranking, spectators last. */
  lines: readonly RankingLine[];
}

/**
 * "CLASSIFICAÇÃO DA MESA": place, color, nickname, crown, tags, session wins and
 * points; a spectator reads "Espectador(a)" and 0 points (POD-01 AC 7).
 */
export function RankingList({ lines }: RankingListProps) {
  return (
    <section class="ranking" aria-label={STRINGS.tableRanking}>
      <div class="ranking__head">
        <h2 class="ranking__title">{STRINGS.tableRanking}</h2>
        <span class="ranking__count">{STRINGS.playerCount(lines.length)}</span>
      </div>
      <ol class="ranking__list">
        {lines.map((line) => (
          <RankingItem key={line.row.id} line={line} />
        ))}
      </ol>
    </section>
  );
}

interface RankingItemProps {
  line: RankingLine;
}

function RankingItem({ line }: RankingItemProps) {
  const { row, tags, disconnected } = line;
  const isMine = tags.includes('you');
  const itemClass = `ranking__item${isMine ? ' ranking__item--mine' : ''}${disconnected ? ' ranking__item--dimmed' : ''}`;
  return (
    <li class={itemClass} style={{ borderLeftColor: row.color }}>
      <span class="ranking__place">{row.place}</span>
      <PlayerAvatar nickname={row.nickname} color={row.color} size="small" />
      <span class="ranking__who">
        <span class="ranking__name-line">
          <span class="ranking__name">{row.nickname}</span>
          {row.crowned && (
            <span class="ranking__crown" role="img" aria-label={STRINGS.crown}>
              <CrownIcon />
            </span>
          )}
          {disconnected && <span class="ranking__disconnected">{STRINGS.disconnectedNote}</span>}
          {row.spectator && (
            <span class="ranking__eye">
              <EyeIcon />
            </span>
          )}
          {tags.map((tag) => (
            <PlayerTagPill key={tag} tag={tag} />
          ))}
        </span>
        <span class={`ranking__detail${row.spectator ? ' ranking__detail--spectator' : ''}`}>
          {row.spectator ? STRINGS.spectatorLong : STRINGS.winsInSession(row.wins)}
        </span>
      </span>
      <span class="ranking__score">
        <span class="ranking__points">{row.score}</span>
        <span class="ranking__unit">{STRINGS.pointsUnit}</span>
      </span>
    </li>
  );
}
