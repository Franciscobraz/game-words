import { type LanguagePack, pickLongestWord } from '@bwords/core';
import { useState } from 'preact/hooks';

interface SolutionsProps {
  pack: LanguagePack;
  size: number;
  /** `boardSolutions(...)` with the current options. */
  solutions: { words: ReadonlySet<string>; common: ReadonlySet<string> };
  found: readonly string[];
  filterProfanity: boolean;
}

/** Board stats and the "Mostrar soluções" panel: every solution, common ones marked, and the longest word. */
export function Solutions({ pack, size, solutions, found, filterProfanity }: SolutionsProps) {
  const [open, setOpen] = useState(false);
  const longest = pickLongestWord(solutions.words, pack, new Map([['você', new Set(found)]]), filterProfanity);
  const words = [...solutions.words].sort();

  return (
    <section class="solutions">
      <ul class="stats">
        <li data-testid="stat-solutions">Soluções: {solutions.words.size}</li>
        <li data-testid="stat-common">Comuns: {solutions.common.size}</li>
        <li data-testid="stat-min">
          Mínimo de comuns ({size}x{size}): {pack.meta.minCommonWords[size] ?? 0}
        </li>
      </ul>
      <button type="button" onClick={() => setOpen(!open)}>
        {open ? 'Esconder soluções' : 'Mostrar soluções'}
      </button>
      {open && (
        <>
          <p data-testid="longest" class="longest">
            Maior palavra: {longest ? pack.spellings(longest.word).join(' / ') : '-'}
          </p>
          <ul data-testid="solutions" class="solution-list">
            {words.map((w) => (
              <li
                key={w}
                data-testid="solution"
                data-word={w}
                data-common={solutions.common.has(w) ? 'true' : 'false'}
                data-longest={longest?.word === w ? 'true' : 'false'}
                class={[solutions.common.has(w) && 'common', longest?.word === w && 'longest-word'].filter(Boolean).join(' ')}
              >
                {pack.spellings(w).join(' / ')}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
