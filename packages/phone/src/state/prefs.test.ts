import { hashPrefixes, type Phase, type PlayerInfo, type ServerMessage, type Settings, type WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { fakeClock, fakeConnection, fakeDevice, fakeScreen, fakeStorage, throwingStorage } from '../testing/fakes.ts';
import type { KeyValueStorage } from './room.ts';
import { createPhoneStore } from './store.ts';

const SETTINGS: Settings = {
  size: 4,
  seconds: 60,
  rounds: 2,
  minLength: 3,
  filterProfanity: true,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

const BETO: PlayerInfo = { id: 'beto', nickname: 'Beto', color: '#ff5e5e', connected: true, spectator: false, score: 0, wins: 0 };

/** Beto, in room KBXT at `phase`. */
function welcome(phase: Phase): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'player',
    code: 'KBXT',
    phase,
    settings: SETTINGS,
    players: [BETO],
    hostId: 'beto',
    round: null,
    playerId: 'beto',
    found: [],
    salt: null,
  };
}

/** CASA is the first row, 0-1-2-3. */
const CASA = [0, 1, 2, 3];

const ROUND_START: ServerMessage = {
  type: 'round-start',
  id: 1,
  index: 0,
  board: [
    ['c', 'a', 's', 'a'],
    ['l', 'u', 'z', 'i'],
    ['m', 'a', 'r', 'e'],
    ['t', 'o', 'd', 'o'],
  ],
  startsAt: 3_000,
  endsAt: 63_000,
  salt: 'AQID',
};

/** A phone store over fake server, clock, device and screen, with `storage`. */
function setup(storage: KeyValueStorage = fakeStorage(), canVibrate = true) {
  const clock = fakeClock();
  const connection = fakeConnection(() => clock.now());
  const screen = fakeScreen();
  const device = fakeDevice();
  const store = createPhoneStore({
    openConnection: connection.openConnection,
    storage,
    schedule: clock.schedule,
    device: { vibrate: device.vibrate, playHitSound: device.playHitSound, canVibrate: () => canVibrate },
    wakeLock: screen.wakeLock,
    onVisible: screen.onVisible,
  });
  return { store, connection, screen, device, clock };
}

describe('preferences', () => {
  test('starts with both preferences off', () => {
    const { store } = setup();

    expect(store.prefs.prefs.value).toEqual({ vibrate: false, sound: false });
  });

  test('keeps preferences across reloads', () => {
    // PREF-01 AC 2: what the player turned on is still on in the next page load, which reads the same storage.
    const storage = fakeStorage();
    const before = setup(storage).store;
    before.prefs.setPref('vibrate', true);
    before.prefs.setPref('sound', true);
    before.prefs.setPref('sound', false);

    const afterReload = setup(storage).store;

    expect(afterReload.prefs.prefs.value).toEqual({ vibrate: true, sound: false });
  });

  test('falls back to both off when the saved preferences are not readable', () => {
    const storage = fakeStorage({ 'bwords.prefs': 'not json' });

    const { store } = setup(storage);

    expect(store.prefs.prefs.value).toEqual({ vibrate: false, sound: false });
  });

  test('a storage that throws does not break the store', () => {
    // design, Error Handling: a blocked localStorage throws on every access; the phone still plays and the switches still work.
    const { store, connection } = setup(throwingStorage());

    store.prefs.setPref('sound', true);
    store.room.openRoom('KBXT');
    connection.receive(welcome('lobby'));

    expect(store.prefs.prefs.value).toEqual({ vibrate: false, sound: true });
    expect(store.room.room.value.phase).toBe('lobby');
  });

  test('a valid word vibrates and beeps by the preferences the sheet set', async () => {
    // PLAY-01 AC 18-19 through the real preferences: the round reads what the player switched on.
    const { store, connection, device, clock } = setup();
    store.prefs.setPref('vibrate', true);
    store.room.openRoom('KBXT');
    connection.handlers().onStatus('open');
    connection.receive(welcome('lobby'));
    connection.receive(ROUND_START);
    connection.handlers().onHashes({ roundId: 1, prefixes: await hashPrefixes(new Uint8Array([1, 2, 3]), ['casa']) });
    clock.advance(4_000);

    for (const tile of CASA) store.round.extendPathTo(tile);
    await store.round.releasePath();

    expect(device.vibrations).toEqual([50]);
    expect(device.sounds).toBe(0);
  });

  test('says whether the device can vibrate', () => {
    // PREF-01 AC 3: without navigator.vibrate the sheet hides "Vibrar".
    expect(setup(fakeStorage(), true).store.prefs.canVibrate).toBe(true);
    expect(setup(fakeStorage(), false).store.prefs.canVibrate).toBe(false);
  });

  test('opens and closes the preferences sheet', () => {
    const { store } = setup();
    expect(store.prefs.isSheetOpen.value).toBe(false);

    store.prefs.openSheet();
    expect(store.prefs.isSheetOpen.value).toBe(true);

    store.prefs.closeSheet();
    expect(store.prefs.isSheetOpen.value).toBe(false);
  });
});

describe('wake lock', () => {
  test('holds the wake lock in the lobby and the round and asks again when visible', () => {
    // PREF-01 AC 4: held in the lobby and the round, let go in the results and the podium, and asked for again
    // when the page comes back to the front, since the browser lets go of it when the page hides.
    const { store, connection, screen } = setup();
    store.room.openRoom('KBXT');
    expect(screen.held).toBe(false);

    connection.receive(welcome('lobby'));
    expect(screen.held).toBe(true);
    screen.hide();
    screen.show();
    expect(screen.held).toBe(true);

    connection.receive(ROUND_START);
    expect(screen.held).toBe(true);
    screen.hide();
    expect(screen.held).toBe(false);
    screen.show();
    expect(screen.held).toBe(true);

    connection.receive({ type: 'round-results', index: 0, shared: [], players: [], longest: null, possibleWords: 0, last: true });
    expect(screen.held).toBe(false);
    screen.hide();
    screen.show();
    expect(screen.held).toBe(false);

    connection.receive({ type: 'podium', ranking: [] });
    expect(screen.held).toBe(false);

    connection.receive(welcome('lobby'));
    expect(screen.held).toBe(true);

    connection.receive({ type: 'closed', reason: 'closed-by-host' });
    expect(screen.held).toBe(false);
    screen.show();
    expect(screen.held).toBe(false);
  });
});
