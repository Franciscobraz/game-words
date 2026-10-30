import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/time-up-overlay.css';

/** "Tempo!" over the faded board, when the round's time is up (TVPLAY-01 AC 10). */
export function TimeUpOverlay() {
  return (
    <div class="time-up" data-testid="time-up">
      <span class="time-up__text">{STRINGS.timeUp}</span>
    </div>
  );
}
