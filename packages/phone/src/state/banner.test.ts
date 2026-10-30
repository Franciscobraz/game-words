import type { WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { fakeClock, fakeConnection, fakeStorage } from '../testing/fakes.ts';
import { createBannerStore } from './banner.ts';
import { createRoomStore } from './room.ts';

const WELCOME: WelcomeMessage = {
  type: 'welcome',
  role: 'player',
  code: 'KBXT',
  phase: 'lobby',
  settings: { size: 4, seconds: 60, rounds: 2, minLength: 3, filterProfanity: true, pack: 'pt-BR', volume: 80, muted: false },
  players: [],
  hostId: null,
  round: null,
  playerId: null,
  found: [],
  salt: null,
};

/** A room store and its strip over a fake connection and clock, connected to KBXT. */
function setup() {
  const clock = fakeClock();
  const connection = fakeConnection();
  const room = createRoomStore({ openConnection: connection.openConnection, storage: fakeStorage() });
  const { banner } = createBannerStore(room, clock.schedule);
  room.openRoom('KBXT');
  connection.handlers().onStatus('connecting');
  connection.handlers().onStatus('open');
  connection.receive(WELCOME);
  return { clock, connection, banner };
}

describe('reconnect banner', () => {
  test('shows nothing on the first connection', () => {
    const { banner } = setup();

    expect(banner.value).toBeNull();
  });

  test('shows Conectado for 1 s once the welcome is back', () => {
    // RECON-01 AC 1, 3: "Reconectando…" during the drop, "Conectado" from the welcome until 1 s later (L-001).
    const { clock, connection, banner } = setup();
    connection.handlers().onStatus('reconnecting');
    expect(banner.value).toBe('reconnecting');
    connection.handlers().onStatus('open');
    expect(banner.value).toBe('reconnecting');

    connection.receive(WELCOME);
    expect(banner.value).toBe('connected');
    clock.advance(999);
    expect(banner.value).toBe('connected');
    clock.advance(1);
    expect(banner.value).toBeNull();
  });

  test('shows Sem conexão until the retry and its welcome', () => {
    // RECON-01 AC 4: "Sem conexão" stays; "Tentar de novo" goes back to "Reconectando…".
    const { clock, connection, banner } = setup();
    connection.handlers().onStatus('reconnecting');
    connection.handlers().onStatus('offline');
    clock.advance(60_000);
    expect(banner.value).toBe('offline');

    connection.handlers().onStatus('reconnecting');
    expect(banner.value).toBe('reconnecting');
    connection.handlers().onStatus('open');
    connection.receive(WELCOME);
    expect(banner.value).toBe('connected');
  });

  test('a new drop while Conectado shows Reconectando and stays', () => {
    const { clock, connection, banner } = setup();
    connection.handlers().onStatus('reconnecting');
    connection.handlers().onStatus('open');
    connection.receive(WELCOME);

    connection.handlers().onStatus('reconnecting');
    clock.advance(1_000);

    expect(banner.value).toBe('reconnecting');
  });
});
