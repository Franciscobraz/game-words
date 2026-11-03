import type { ScrollDirection } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/words-host-controls.css';
import { ArrowDownIcon, ArrowUpIcon } from './icons.tsx';
import { PrimaryButton } from './PrimaryButton.tsx';

/** Props of `WordsHostControls`. */
export interface WordsHostControlsProps {
  /** ▲ or ▼: the TV steps the words list half a panel (WORDCTL-01 AC 5-6). */
  onScroll: (direction: ScrollDirection) => void;
  /** "VER RESULTADO": the TV and the phones open the result (WORDCTL-01 AC 8). */
  onShowResult: () => void;
}

/**
 * The host's controls while the TV shows "Tempo!" and the words: ▲ and ▼ side by
 * side, and "VER RESULTADO" under them, every target 48 px or more (WORDCTL-01 AC 4).
 */
export function WordsHostControls({ onScroll, onShowResult }: WordsHostControlsProps) {
  return (
    <section class="words-host-controls" aria-label={STRINGS.wordsControls}>
      <div class="words-host-controls__steps">
        <button type="button" class="words-host-controls__step" aria-label={STRINGS.scrollUp} onClick={() => onScroll('up')}>
          <ArrowUpIcon />
        </button>
        <button type="button" class="words-host-controls__step" aria-label={STRINGS.scrollDown} onClick={() => onScroll('down')}>
          <ArrowDownIcon />
        </button>
      </div>
      <PrimaryButton tone="action" onPress={onShowResult}>
        {STRINGS.showResult}
      </PrimaryButton>
    </section>
  );
}
