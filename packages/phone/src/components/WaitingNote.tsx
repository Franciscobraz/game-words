import '../styles/waiting-note.css';
import { GamepadIcon } from './icons.tsx';

/** Props of `WaitingNote`. */
export interface WaitingNoteProps {
  /** As "Aguardando Ana avançar…". */
  text: string;
}

/** The note a player who is not the host sees in place of the host's buttons (RES-01 AC 9, POD-01 AC 12). */
export function WaitingNote({ text }: WaitingNoteProps) {
  return (
    <section class="waiting-note">
      <span class="waiting-note__icon">
        <GamepadIcon />
      </span>
      <p class="waiting-note__text">{text}</p>
    </section>
  );
}
