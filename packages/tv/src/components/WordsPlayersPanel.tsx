import type { WordsPlayerCard } from '../model/words-players.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/words-players.css';
import { PlayerCircle } from './PlayerCircle.tsx';

/** Props of `WordsPlayersPanel`. */
export interface WordsPlayersPanelProps {
  cards: readonly WordsPlayerCard[];
  /** The round, from 1. */
  round: number;
  /** The highlighted word: a card that scored on it plays its animation again for each word. */
  highlight: number | null;
}

/**
 * The "Jogadores" panel beside the words: one card per player of the round, each sliding with a `transform` to its place
 * by points; the panel and the cards never change size (WORDCTL-01 AC 18-29, tv-words.png).
 */
export function WordsPlayersPanel({ cards, round, highlight }: WordsPlayersPanelProps) {
  return (
    <section class="words-players" data-testid="words-players" aria-label={STRINGS.playersTitle}>
      <header class="words-players__header">
        <h2 class="words-players__title">{STRINGS.playersTitle}</h2>
        <span class="words-players__count">{STRINGS.playersInRoom(cards.length)}</span>
        <span class="words-players__round">{STRINGS.roundTag(round)}</span>
      </header>
      <div class="words-players__list">
        {cards.map((card) => (
          <WordsPlayerRow card={card} pulse={card.scored ? highlight : null} key={card.id} />
        ))}
      </div>
    </section>
  );
}

interface WordsPlayerRowProps {
  card: WordsPlayerCard;
  /** The word this card scored on; a new one plays the animation again. */
  pulse: number | null;
}

function WordsPlayerRow({ card, pulse }: WordsPlayerRowProps) {
  const leader = card.leader ? ' words-player__card--leader' : '';
  const away = card.connected ? '' : ' words-player__card--away';
  const scored = pulse === null ? '' : ' words-player__card--scored';
  return (
    <div class="words-player" style={{ '--place': card.place, '--player-color': card.color }} data-testid={`words-player-${card.id}`}>
      {/* The key mounts the card again on each word it scores, so the animation plays with each "check". */}
      <div class={`words-player__card${leader}${away}${scored}`} key={pulse ?? 'still'}>
        <PlayerCircle nickname={card.nickname} color={card.color} shape="small-circle" />
        <div class="words-player__identity">
          <span class="words-player__name-line">
            <span class="words-player__name">{card.nickname}</span>
            {!card.connected && <span class="words-player__tag">{STRINGS.disconnectedTag}</span>}
          </span>
          <span class="words-player__words">{card.wordsText}</span>
        </div>
        <span class={card.pointsInColor ? 'words-player__points words-player__points--colored' : 'words-player__points'}>
          <span class="words-player__number" data-testid="words-player-points">
            {card.points}
          </span>
          <span class="words-player__unit">{card.unit}</span>
        </span>
      </div>
    </div>
  );
}
