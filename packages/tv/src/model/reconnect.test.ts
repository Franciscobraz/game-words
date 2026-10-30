import { type ConnectionStatus, createRoomConnection, type Settings, tvHello, type WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { STRINGS } from '../strings/pt-BR.ts';
import { fakeClock, fakeSockets } from '../testing/fakes.ts';
import { bannerTexts, type ConnectionLoss, GIVE_UP_AFTER_MS, reconnectDelayMs, TV_RECONNECT_POLICY } from './reconnect.ts';

const NINE_MINUTES_59_S = 599_000;

/** The waits add up to 63.5 s after the seventh attempt, and then 60 s each: the last attempt before 10 min is at 9:03.5. */
const LAST_ATTEMPT_AT_MS = 543_500;

const WELCOME: WelcomeMessage = { type: 'welcome', role: 'tv', code: 'KBXT', phase: 'lobby', settings: {} as Settings, players: [], hostId: null, round: null };

/** The real connection under the TV's policy, with its socket just dropped. */
function dropped() {
  const clock = fakeClock(1_000_000);
  const sockets = fakeSockets();
  const statuses: ConnectionStatus[] = [];
  const connection = createRoomConnection({
    openSocket: sockets.openSocket,
    now: clock.now,
    schedule: clock.schedule,
    hello: tvHello,
    reconnect: TV_RECONNECT_POLICY,
    onMessage: () => {},
    onStatus: (status) => statuses.push(status),
  });
  connection.connect('KBXT', 'tv-secret');
  sockets.last().open();
  sockets.last().drop();

  /** Advances time while every new attempt fails at once, as on a dead network. */
  function advanceFailing(ms: number): void {
    let remaining = ms;
    let failed = sockets.opened.length;
    while (remaining > 0) {
      const step = Math.min(100, remaining);
      clock.advance(step);
      remaining -= step;
      for (; failed < sockets.opened.length; failed++) sockets.opened[failed]?.drop();
    }
  }

  return { clock, sockets, status: () => statuses.at(-1), advanceFailing };
}

describe('the waits between attempts', () => {
  test('waits longer after each attempt up to one minute', () => {
    const { clock, sockets } = dropped();
    const expectedWaits = [500, 1_000, 2_000, 4_000, 8_000, 16_000, 32_000, 60_000, 60_000, 60_000];

    for (const wait of expectedWaits) {
      const attempts = sockets.opened.length;
      clock.advance(wait - 1);
      expect(sockets.opened).toHaveLength(attempts);
      clock.advance(1);
      expect(sockets.opened).toHaveLength(attempts + 1);
      sockets.last().drop();
    }

    expect(expectedWaits.map((_, attempt) => reconnectDelayMs(attempt))).toEqual(expectedWaits);
    expect(reconnectDelayMs(1_000)).toBe(60_000);
  });
});

describe('the limit of attempts', () => {
  test('stops trying after ten minutes', () => {
    const { clock, sockets, status, advanceFailing } = dropped();
    expect(GIVE_UP_AFTER_MS).toBe(600_000);

    advanceFailing(NINE_MINUTES_59_S);
    const attemptsAt9m59s = sockets.opened.length;
    expect(status()).toBe('reconnecting');
    expect(attemptsAt9m59s).toBeGreaterThan(8);
    advanceFailing(999);
    expect(status()).toBe('reconnecting');

    advanceFailing(1);
    expect(status()).toBe('offline');

    clock.advance(GIVE_UP_AFTER_MS * 6);
    expect(sockets.opened).toHaveLength(attemptsAt9m59s);
    expect(status()).toBe('offline');
  });

  test('comes back with the last attempt before the limit and stays', () => {
    const { clock, sockets, status, advanceFailing } = dropped();
    advanceFailing(LAST_ATTEMPT_AT_MS - 100);
    clock.advance(100);

    sockets.last().open();
    sockets.last().receive(WELCOME);
    clock.advance(GIVE_UP_AFTER_MS);

    expect(status()).toBe('open');
  });
});

describe('the banner', () => {
  test.each<[ConnectionLoss, string | null, string | null]>([
    ['none', null, null],
    ['reconnecting', 'Reconectando…', null],
    ['no-connection', 'Sem conexão', null],
    ['gave-up', 'Sem conexão', 'Aperte OK no controle para tentar de novo'],
  ])('says what the loss %s asks', (loss, title, hint) => {
    const texts = bannerTexts(loss);

    expect(texts === null ? null : STRINGS[texts.title]).toBe(title);
    expect(texts === null || texts.hint === null ? null : STRINGS[texts.hint]).toBe(hint);
  });
});
