import type { Feedback } from '../model/judge.ts';
import type { RackTone } from '../model/board-view.ts';
import '../styles/word-rack.css';
import { FeedbackPill } from './FeedbackPill.tsx';

/** Props of `WordRack`. */
export interface WordRackProps {
  /** One label per tile of the word ("Qu" in one). */
  letters: readonly string[];
  tone: RackTone;
  /** The player's color, which lights the swipe and a valid word. */
  color: string;
  /** The verdict on screen, with its text; null when none shows. */
  feedback: { kind: Feedback['kind']; text: string } | null;
}

/**
 * The word above the board: the tiles under the finger while it swipes, then the
 * judged word with its verdict for half a second (PLAY-01 AC 5-11, phone-board.png,
 * phone-feedbacks.png). Its height never changes, so the board does not move.
 */
export function WordRack({ letters, tone, color, feedback }: WordRackProps) {
  return (
    <section class="word-rack" style={{ '--path-color': color, '--letters': Math.max(letters.length, 1) }}>
      {/* The key restarts the shake of each invalid word. */}
      <div key={`${tone}-${letters.join('')}`} class={`word-rack__word word-rack__word--${tone}`} aria-live="polite">
        {letters.map((letter, index) => (
          <span key={index} class="word-rack__tile">
            {letter}
          </span>
        ))}
      </div>
      <div class="word-rack__verdict">{feedback !== null && <FeedbackPill kind={feedback.kind} text={feedback.text} />}</div>
    </section>
  );
}
