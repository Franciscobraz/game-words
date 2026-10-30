import { bannerTexts, type ConnectionLoss } from '../model/reconnect.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/connection-banner.css';

/** Props of `ConnectionBanner`. */
export interface ConnectionBannerProps {
  loss: ConnectionLoss;
}

/** A thin strip over the current screen while the room is out of reach (TVEXIT-01 AC 5-7, 9). */
export function ConnectionBanner({ loss }: ConnectionBannerProps) {
  const texts = bannerTexts(loss);
  if (texts === null) return null;
  const look = loss === 'reconnecting' ? 'connection-banner--waiting' : 'connection-banner--lost';
  return (
    <div class={`connection-banner ${look}`} role="status" data-testid="connection-banner">
      <span class="connection-banner__title">{STRINGS[texts.title]}</span>
      {texts.hint !== null && <span class="connection-banner__hint">{STRINGS[texts.hint]}</span>}
    </div>
  );
}
