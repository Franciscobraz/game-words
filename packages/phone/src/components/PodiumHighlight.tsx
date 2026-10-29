import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/podium-highlight.css';
import { Confetti } from './Confetti.tsx';
import { TrophyIcon } from './icons.tsx';
import { PlayerAvatar } from './PlayerAvatar.tsx';

/** Props of `PodiumHighlight`. */
export interface PodiumHighlightProps {
  nickname: string;
  color: string;
  place: number;
  total: number;
  /** Matches won in this room, this one included. */
  wins: number;
}

/**
 * The personal card of the podium: "Você ficou em Nº Lugar!", "PONTUAÇÃO TOTAL" and
 * the wins "NA SESSÃO" (POD-01 AC 2). The winner's confetti falls inside the card,
 * behind its texts, so it never covers anything to read (POD-01 AC 3).
 */
export function PodiumHighlight({ nickname, color, place, total, wins }: PodiumHighlightProps) {
  const isWinner = place === 1;
  return (
    <section class="podium-highlight" aria-label={STRINGS.yourFinalPlace(place)}>
      {isWinner && <Confetti />}
      <span class="podium-highlight__avatar">
        <PlayerAvatar nickname={nickname} color={color} size="large" />
        {isWinner && (
          <span class="podium-highlight__trophy" role="img" aria-label={STRINGS.winner}>
            <TrophyIcon />
          </span>
        )}
      </span>
      <h1 class="podium-highlight__place">{STRINGS.yourFinalPlace(place)}</h1>
      <div class="podium-highlight__stats">
        <p class="podium-highlight__stat">
          <span class="podium-highlight__label">{STRINGS.totalScore}</span>
          <span class="podium-highlight__value podium-highlight__value--score">{STRINGS.points(total)}</span>
        </p>
        <p class="podium-highlight__stat">
          <span class="podium-highlight__label">{STRINGS.inSession}</span>
          <span class="podium-highlight__value">
            <TrophyIcon />
            {STRINGS.winsLabel(wins)}
          </span>
        </p>
      </div>
    </section>
  );
}
