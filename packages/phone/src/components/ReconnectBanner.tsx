import type { Banner } from '../model/connection-banner.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/reconnect-banner.css';
import { CheckCircleIcon } from './icons.tsx';

/** Props of `ReconnectBanner`. */
export interface ReconnectBannerProps {
  banner: Banner;
  /** "Tentar de novo" after "Sem conexão" (RECON-01 AC 4). */
  onRetry: () => void;
}

/**
 * The thin strip under the top bar: "Reconectando…" with a spinner, the green
 * "Conectado" for 1 s, or "Sem conexão" with "Tentar de novo" (RECON-01 AC 1, 3, 4).
 */
export function ReconnectBanner({ banner, onRetry }: ReconnectBannerProps) {
  switch (banner) {
    case null:
      return null;
    case 'reconnecting':
      return (
        <p class="reconnect-banner reconnect-banner--waiting" aria-live="polite">
          <span class="reconnect-banner__spinner" aria-hidden="true" />
          {STRINGS.reconnecting}
        </p>
      );
    case 'connected':
      return (
        <p class="reconnect-banner reconnect-banner--connected" aria-live="polite">
          <CheckCircleIcon />
          {STRINGS.connected}
        </p>
      );
    case 'offline':
      return (
        <div class="reconnect-banner reconnect-banner--offline" aria-live="assertive">
          <span class="reconnect-banner__text">{STRINGS.offline}</span>
          <button type="button" class="reconnect-banner__retry" onClick={onRetry}>
            {STRINGS.tryAgain}
          </button>
        </div>
      );
    default: {
      const never: never = banner;
      return never;
    }
  }
}
