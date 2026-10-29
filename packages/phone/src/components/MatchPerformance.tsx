import { wordLetters } from '../model/board-view.ts';
import type { LongestFound } from '../model/match-summary.ts';
import { spellingsLabel } from '../model/results.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/match-performance.css';
import { SpellcheckIcon } from './icons.tsx';

/** Props of `MatchPerformance`. */
export interface MatchPerformanceProps {
  /** The player's words in the rounds this phone saw. */
  wordCount: number;
  /** Null when the player found no word. */
  longest: LongestFound | null;
}

/**
 * "SEU RENDIMENTO" with the player's word count, and "MAIOR PALAVRA ENCONTRADA" in
 * tiles without accents, with the real spellings, the points and the letters; both
 * summed on the phone from the rounds it saw (POD-01 AC 4-6, AD-007).
 */
export function MatchPerformance({ wordCount, longest }: MatchPerformanceProps) {
  return (
    <section class="match-performance" aria-label={STRINGS.yourPerformance}>
      <h2 class="match-performance__title">{STRINGS.yourPerformance}</h2>
      <p class="match-performance__words">
        <span class="match-performance__icon">
          <SpellcheckIcon />
        </span>
        <span class="match-performance__count">{wordCount}</span>
        <span class="match-performance__count-label">{STRINGS.wordsFound}</span>
      </p>
      {longest !== null && <LongestWordCard longest={longest} />}
    </section>
  );
}

interface LongestWordCardProps {
  longest: LongestFound;
}

function LongestWordCard({ longest }: LongestWordCardProps) {
  const spellings = spellingsLabel(longest.spellings);
  return (
    <section class="match-performance__longest" aria-label={STRINGS.longestWord}>
      <div class="match-performance__longest-head">
        <h3 class="match-performance__longest-title">{STRINGS.longestWord}</h3>
        {spellings !== null && <span class="match-performance__spellings">{spellings}</span>}
        <span class="match-performance__points">{STRINGS.gainedPointsUpper(longest.points)}</span>
      </div>
      <div class="match-performance__longest-body">
        <ol class="match-performance__tiles">
          {wordLetters(longest.word).map((letter, index) => (
            <li key={index} class="match-performance__tile">
              {letter}
            </li>
          ))}
        </ol>
        <span class="match-performance__letters">{STRINGS.letterCount(longest.letters)}</span>
      </div>
    </section>
  );
}
