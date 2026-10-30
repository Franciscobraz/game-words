import type { ConnectionStatus } from '@bwords/core';

/** The thin strip under the top bar about the connection (RECON-01); null when there is none. */
export type Banner = 'reconnecting' | 'connected' | 'offline' | null;

/** What moves the banner: a new connection status, or the `welcome` that rebuilds the room. */
export type BannerEvent = { type: 'status'; status: ConnectionStatus } | { type: 'welcome' };

/**
 * The banner after `event` (RECON-01 AC 1, 3, 4). A drop shows "Reconectando…" and
 * 30 s without success "Sem conexão". An open socket is not enough to say
 * "Conectado": the strip waits for the `welcome` that rebuilds the screen. The
 * first connection and a closed room show nothing.
 */
export function nextBanner(banner: Banner, event: BannerEvent): Banner {
  if (event.type === 'welcome') return isWaitingForWelcome(banner) ? 'connected' : banner;
  switch (event.status) {
    case 'reconnecting':
      return 'reconnecting';
    case 'offline':
      return 'offline';
    case 'open':
      // Socket open again; the room is not rebuilt until its welcome.
      return banner;
    case 'connecting':
    case 'closed':
      return null;
    default: {
      const never: never = event.status;
      return never;
    }
  }
}

/** The strip that the `welcome` turns into "Conectado". */
function isWaitingForWelcome(banner: Banner): boolean {
  return banner === 'reconnecting' || banner === 'offline';
}
