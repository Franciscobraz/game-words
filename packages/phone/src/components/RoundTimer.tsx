import '../styles/round-timer.css';
import { TimerIcon } from './icons.tsx';

/** Props of `RoundTimer`. */
export interface RoundTimerProps {
  /** The time left, as "01:47". */
  clock: string;
  /** 10 s or less left: the clock turns to the alert color. */
  alert: boolean;
  /** "Rodada 1/3"; null before the settings arrive. */
  roundLabel: string | null;
  /** "12 pal · 18 pts", for a player; a spectator has none. */
  tally?: string;
  /** The share of the round left, from 1 to 0, drawn as a bar under the card (spectator). */
  progress?: number;
}

/** The round's timer card: clock, round and the player's tally or the spectator's bar (PLAY-01 AC 14-15, SPEC-01 AC 2). */
export function RoundTimer({ clock, alert, roundLabel, tally, progress }: RoundTimerProps) {
  return (
    <section class="round-timer">
      <div class="round-timer__card">
        <span class="round-timer__icon">
          <TimerIcon />
        </span>
        <span class="round-timer__time">
          <span class={`round-timer__clock${alert ? ' round-timer__clock--alert' : ''}`} role="timer">
            {clock}
          </span>
          {roundLabel !== null && <span class="round-timer__round">{roundLabel}</span>}
        </span>
        {tally !== undefined && <span class="round-timer__tally">{tally}</span>}
      </div>
      {progress !== undefined && (
        <div class="round-timer__bar" role="progressbar" aria-valuemin={0} aria-valuemax={1} aria-valuenow={progress}>
          <span class="round-timer__bar-fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
      )}
    </section>
  );
}
