import { describe, expect, test } from 'vitest';
import { type Banner, nextBanner } from './connection-banner.ts';

const status = (s: 'connecting' | 'open' | 'reconnecting' | 'offline' | 'closed') => ({ type: 'status', status: s }) as const;
const WELCOME = { type: 'welcome' } as const;

describe('nextBanner', () => {
  test('shows Reconectando on a drop', () => {
    // RECON-01 AC 1.
    expect(nextBanner(null, status('reconnecting'))).toBe('reconnecting');
    expect(nextBanner('connected', status('reconnecting'))).toBe('reconnecting');
  });

  test('turns into Sem conexão when the phone gives up', () => {
    // RECON-01 AC 4.
    expect(nextBanner('reconnecting', status('offline'))).toBe('offline');
  });

  test('keeps waiting while the socket is open but the room is not rebuilt yet', () => {
    expect(nextBanner('reconnecting', status('open'))).toBe('reconnecting');
    expect(nextBanner('offline', status('open'))).toBe('offline');
    expect(nextBanner(null, status('open'))).toBeNull();
  });

  test('says Conectado once the welcome rebuilds the room', () => {
    // RECON-01 AC 3.
    expect(nextBanner('reconnecting', WELCOME)).toBe('connected');
    expect(nextBanner('offline', WELCOME)).toBe('connected');
  });

  test('shows nothing on the first connection, its welcome or a closed room', () => {
    expect(nextBanner(null, status('connecting'))).toBeNull();
    expect(nextBanner(null, WELCOME)).toBeNull();
    const shown: Banner[] = ['reconnecting', 'offline', 'connected'];
    for (const banner of shown) expect(nextBanner(banner, status('closed'))).toBeNull();
    expect(nextBanner('reconnecting', status('connecting'))).toBeNull();
  });

  test('a second welcome keeps Conectado as it is', () => {
    expect(nextBanner('connected', WELCOME)).toBe('connected');
  });
});
