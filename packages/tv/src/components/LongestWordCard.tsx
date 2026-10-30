import type { LongestCard } from '../model/longest-card.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/longest-word-card.css';

/** Props of `LongestWordCard`. */
export interface LongestWordCardProps {
  card: LongestCard;
}

/** "A maior palavra do tabuleiro", the word with its spellings, and who found it (TVRES-01 AC 6). */
export function LongestWordCard({ card }: LongestWordCardProps) {
  return (
    <section class="longest-word" data-testid="longest-word">
      <div class="longest-word__text">
        <h2 class="longest-word__label">{STRINGS.longestWordLabel}</h2>
        <p class="longest-word__word-line">
          <span class="longest-word__word">{card.word}</span>
          {card.spellings.length > 0 && <span class="longest-word__spellings">{STRINGS.spellings(card.spellings)}</span>}
        </p>
      </div>
      <span class="longest-word__finders">{card.finders}</span>
    </section>
  );
}
