import { spellingsLabel, type WordRow, wordLabel } from '../model/results.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/result-word-list.css';
import { SpellcheckIcon, StarIcon } from './icons.tsx';

/** Props of `ResultWordList`. */
export interface ResultWordListProps {
  rows: readonly WordRow[];
}

/**
 * "MINHAS PALAVRAS ENCONTRADAS (N)": each word in upper case without accents with its
 * real spellings, "ÚNICA ×2 (+N pts)" with the doubled points and "base +N", or
 * "em comum" with the simple points (RES-01 AC 3-5, AD-008).
 */
export function ResultWordList({ rows }: ResultWordListProps) {
  const title = STRINGS.myFoundWords(rows.length);
  return (
    <section class="result-words" aria-label={title}>
      <h2 class="result-words__title">
        <SpellcheckIcon />
        {title}
      </h2>
      <ul class="result-words__list">
        {rows.map((row) => (
          <ResultWordLine key={row.word} row={row} />
        ))}
      </ul>
    </section>
  );
}

interface ResultWordLineProps {
  row: WordRow;
}

function ResultWordLine({ row }: ResultWordLineProps) {
  const spellings = spellingsLabel(row.spellings);
  const isUnique = row.kind === 'unique';
  return (
    <li class="result-words__item">
      <div class="result-words__word">
        <p class="result-words__text">
          {wordLabel(row.word)}
          {spellings !== null && <span class="result-words__spellings">{spellings}</span>}
        </p>
        {isUnique ? (
          <span class="result-words__unique">
            <StarIcon />
            {STRINGS.uniqueBonus(row.points)}
          </span>
        ) : (
          <span class="result-words__shared">{STRINGS.shared}</span>
        )}
      </div>
      <div class="result-words__score">
        <span class={`result-words__points${isUnique ? ' result-words__points--unique' : ''}`}>{STRINGS.gainedPoints(row.points)}</span>
        {isUnique && <span class="result-words__base">{STRINGS.basePoints(row.basePoints)}</span>}
      </div>
    </li>
  );
}
