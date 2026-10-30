import '../styles/confetti.css';

/** A piece of confetti: where it falls from, when it starts, and its color slot. */
interface ConfettiPiece {
  /** Share of the card's width, in %. */
  left: number;
  delayMs: number;
  tone: 1 | 2 | 3 | 4 | 5;
}

/** A fixed pattern, so the pictures and tests see the same screen every time. */
const CONFETTI_PIECES: readonly ConfettiPiece[] = [
  { left: 4, delayMs: 0, tone: 1 },
  { left: 12, delayMs: 900, tone: 2 },
  { left: 21, delayMs: 300, tone: 3 },
  { left: 30, delayMs: 1500, tone: 4 },
  { left: 38, delayMs: 600, tone: 5 },
  { left: 47, delayMs: 1200, tone: 1 },
  { left: 55, delayMs: 200, tone: 2 },
  { left: 63, delayMs: 1800, tone: 3 },
  { left: 71, delayMs: 450, tone: 4 },
  { left: 79, delayMs: 1050, tone: 5 },
  { left: 87, delayMs: 750, tone: 1 },
  { left: 95, delayMs: 1350, tone: 2 },
];

/** Falling confetti in the winner's card, animated only with transform and opacity (TVRES-01 AC 9, TVUI-01 AC 3). */
export function Confetti() {
  return (
    <div class="confetti" aria-hidden="true" data-testid="confetti">
      {CONFETTI_PIECES.map((piece) => (
        <span
          key={piece.left}
          class={`confetti__piece confetti__piece--tone${piece.tone}`}
          style={{ left: `${piece.left}%`, animationDelay: `${piece.delayMs}ms` }}
        />
      ))}
    </div>
  );
}
