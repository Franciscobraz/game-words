import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/audio-notice.css';
import { SoundOffIcon } from './icons.tsx';

/** Asks for a key or a click when the browser blocks the sound (TVAUDIO-01 AC 3, tv-lobby.png). */
export function AudioNotice() {
  return (
    <p class="audio-notice" data-testid="audio-notice">
      <span class="audio-notice__icon">
        <SoundOffIcon />
      </span>
      {STRINGS.soundNoticeBefore} <span class="audio-notice__key">{STRINGS.soundNoticeKey}</span> {STRINGS.soundNoticeAfter}
    </p>
  );
}
