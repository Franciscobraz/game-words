import type { FoundChip } from '../model/board-view.ts';
import '../styles/found-words.css';
import { ChecklistIcon } from './icons.tsx';

/** Props of `FoundWords`. */
export interface FoundWordsProps {
  title: string;
  /** "5 no total". */
  total: string;
  /** Newest first. */
  chips: readonly FoundChip[];
  /** The player's color, which marks the newest word. */
  color: string;
}

/** "PALAVRAS ENCONTRADAS": the total and the words as chips with their points, newest first, scrolling sideways (PLAY-01 AC 17). */
export function FoundWords({ title, total, chips, color }: FoundWordsProps) {
  return (
    <section class="found-words" style={{ '--path-color': color }} aria-label={title}>
      <div class="found-words__head">
        <h2 class="found-words__title">
          <ChecklistIcon />
          {title}
        </h2>
        <span class="found-words__total">{total}</span>
      </div>
      <ul class="found-words__list">
        {chips.map((chip, index) => (
          <li key={chip.word} class={`found-words__chip${index === 0 ? ' found-words__chip--newest' : ''}`}>
            <span class="found-words__word">{chip.word}</span>
            <span class="found-words__points">{chip.points}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
