import { hashPrefixes, type PlayerInfo, type RoundResultsMessage, type Settings, type WelcomeMessage } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { fakeClock, fakeConnection, fakeDevice, fakeStorage } from '../testing/fakes.ts';
import { createRoomStore } from './room.ts';
import { createRoundStore, type HitPrefs } from './round.ts';

/**
 * The test round, a 4x4 board, row-major:
 *
 *    c  a  s  a        0  1  2  3
 *    Qu e  r  o        4  5  6  7
 *    l  u  z  i        8  9 10 11
 *    m  a  r  e       12 13 14 15
 *
 * Valid words: casa (0-1-2-3), quero (4-5-6-7) and mar (12-13-14).
 */
const BOARD = [
  ['c', 'a', 's', 'a'],
  ['Qu', 'e', 'r', 'o'],
  ['l', 'u', 'z', 'i'],
  ['m', 'a', 'r', 'e'],
];
const CASA = [0, 1, 2, 3];
const QUERO = [4, 5, 6, 7];
const MAR = [12, 13, 14];
/** "cas" is on the board but not a word. */
const CAS = [0, 1, 2];
/** "ca" is shorter than the 3-letter minimum. */
const CA = [0, 1];
const VALID_WORDS = ['casa', 'quero', 'mar'];

const SALT = new Uint8Array([3, 1, 4, 1, 5, 9, 2, 6]);
const ROUND_ID = 7;
/** The round opens at 100 s on the server clock and lasts 60 s. */
const STARTS_AT = 100_000;
const ENDS_AT = 160_000;

const SETTINGS: Settings = {
  size: 4,
  seconds: 60,
  rounds: 2,
  minLength: 3,
  filterProfanity: true,
  fastMode: false,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

function player(id: string, nickname: string): PlayerInfo {
  return { id, nickname, color: '#ff5e5e', connected: true, spectator: false, score: 0, wins: 0 };
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Beto, back in the open round of KBXT. */
function roundWelcome(found: string[] = []): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'player',
    code: 'KBXT',
    phase: 'round',
    settings: SETTINGS,
    players: [player('ana', 'Ana'), player('beto', 'Beto')],
    hostId: 'ana',
    round: { id: ROUND_ID, index: 0, board: BOARD, startsAt: STARTS_AT, endsAt: ENDS_AT },
    playerId: 'beto',
    found,
    salt: base64Url(SALT),
  };
}

const RESULTS: RoundResultsMessage = { type: 'round-results', index: 0, shared: [], players: [], longest: null, last: false };

/** Beto's phone in the open round, 10 s in, with fake server, clock and device. */
async function setup(options: { prefs?: HitPrefs; at?: number } = {}) {
  const clock = fakeClock(options.at ?? STARTS_AT + 10_000);
  const connection = fakeConnection(() => clock.now());
  const device = fakeDevice();
  const prefs: HitPrefs = options.prefs ?? { vibrate: false, sound: false };
  const room = createRoomStore({ openConnection: connection.openConnection, storage: fakeStorage() });
  const round = createRoundStore({ room, schedule: clock.schedule, device, prefs: () => prefs });

  room.openRoom('KBXT');
  connection.handlers().onStatus('open');
  connection.receive(roundWelcome());
  connection.handlers().onHashes({ roundId: ROUND_ID, prefixes: await hashPrefixes(SALT, VALID_WORDS) });

  /** The finger goes over `tiles` and lifts. */
  async function swipe(tiles: readonly number[]): Promise<void> {
    for (const tile of tiles) round.extendPathTo(tile);
    await round.releasePath();
  }

  const submits = () => connection.sent.filter((msg) => msg.type === 'submit');
  const foundWords = () => room.room.value.found.map((f) => f.word);

  return { clock, connection, device, room, round, swipe, submits, foundWords };
}

describe('swiping', () => {
  test('follows the finger over the board and clears the path on release', async () => {
    const { round } = await setup();

    round.extendPathTo(0);
    round.extendPathTo(1);
    round.extendPathTo(2);
    expect(round.path.value).toEqual([0, 1, 2]);
    round.extendPathTo(1);
    expect(round.path.value).toEqual([0, 1]);

    await round.releasePath();
    expect(round.path.value).toEqual([]);
  });

  test('ignores the finger while the board is locked', async () => {
    // Before startsAt, at endsAt (PLAY-01 AC 20) and while reconnecting (RECON-01 AC 2).
    const early = await setup({ at: STARTS_AT - 1 });
    early.round.extendPathTo(0);
    expect(early.round.path.value).toEqual([]);

    const late = await setup({ at: ENDS_AT });
    late.round.extendPathTo(0);
    expect(late.round.path.value).toEqual([]);

    const dropped = await setup();
    dropped.connection.handlers().onStatus('reconnecting');
    dropped.round.extendPathTo(0);
    expect(dropped.round.path.value).toEqual([]);
  });
});

describe('feedback', () => {
  test('shows valid with the points and puts the word first in the list', async () => {
    // PLAY-01 AC 7.
    const { round, swipe, foundWords } = await setup();

    await swipe(MAR);
    await swipe(CASA);

    expect(round.feedback.value).toEqual({ kind: 'valid', word: 'casa', points: 2 });
    expect(foundWords()).toEqual(['casa', 'mar']);
  });

  test('shows already found for a word in the list, and invalid for a hash that does not match', async () => {
    // PLAY-01 AC 8-9.
    const { round, swipe, foundWords } = await setup();

    await swipe(CASA);
    await swipe(CASA);
    expect(round.feedback.value).toEqual({ kind: 'already-found', word: 'casa' });

    await swipe(CAS);
    expect(round.feedback.value).toEqual({ kind: 'invalid', word: 'cas' });
    expect(foundWords()).toEqual(['casa']);
  });

  test('shows too short and queues nothing below the minimum', async () => {
    // PLAY-01 AC 10.
    const { clock, round, swipe, submits } = await setup();

    await swipe(CA);

    expect(round.feedback.value).toEqual({ kind: 'too-short', word: 'ca' });
    expect(round.pendingPaths.value).toEqual([]);
    clock.advance(1_000);
    expect(submits()).toEqual([]);
  });

  test('clears the feedback after 500 ms', async () => {
    // PLAY-01 AC 11, L-001: still shown at 499 ms, gone at 500 ms.
    const { clock, round, swipe } = await setup();

    await swipe(CAS);
    clock.advance(499);
    expect(round.feedback.value).toEqual({ kind: 'invalid', word: 'cas' });
    clock.advance(1);
    expect(round.feedback.value).toBeNull();
  });

  test('keeps a new feedback its full 500 ms when it replaces an older one', async () => {
    const { clock, round, swipe } = await setup();

    await swipe(CAS);
    clock.advance(300);
    await swipe(MAR);
    clock.advance(300);
    expect(round.feedback.value).toEqual({ kind: 'valid', word: 'mar', points: 1 });
    clock.advance(200);
    expect(round.feedback.value).toBeNull();
  });

  test('ignores a release with a single tile', async () => {
    // Edge Cases: one tile shows no feedback and sends nothing.
    const { clock, round, swipe, submits } = await setup();

    await swipe([5]);

    expect(round.feedback.value).toBeNull();
    expect(round.pendingPaths.value).toEqual([]);
    clock.advance(1_000);
    expect(submits()).toEqual([]);
  });
});

describe('device feedback', () => {
  test('vibrates 50 ms on a valid word when the preference is on', async () => {
    // PLAY-01 AC 18: on, a valid word vibrates 50 ms and the others do not.
    const on = await setup({ prefs: { vibrate: true, sound: false } });
    await on.swipe(CASA);
    expect(on.device.vibrations).toEqual([50]);
    await on.swipe(CAS);
    await on.swipe(CASA);
    await on.swipe(CA);
    expect(on.device.vibrations).toEqual([50]);

    // Off, nothing vibrates.
    const off = await setup({ prefs: { vibrate: false, sound: true } });
    await off.swipe(CASA);
    expect(off.device.vibrations).toEqual([]);
  });

  test('plays the hit sound on a valid word when the preference is on', async () => {
    // PLAY-01 AC 19: on, a valid word plays the sound once and the others do not.
    const on = await setup({ prefs: { vibrate: false, sound: true } });
    await on.swipe(CASA);
    expect(on.device.sounds).toBe(1);
    await on.swipe(CAS);
    await on.swipe(CASA);
    expect(on.device.sounds).toBe(1);

    // Off, no sound.
    const off = await setup({ prefs: { vibrate: true, sound: false } });
    await off.swipe(CASA);
    expect(off.device.sounds).toBe(0);
  });
});

describe('sending', () => {
  test('groups valid paths in one submit 500 ms after the last one', async () => {
    // PLAY-01 AC 12: each valid path restarts the 500 ms wait.
    const { clock, round, swipe, submits } = await setup();

    await swipe(CASA);
    clock.advance(200);
    await swipe(MAR);
    expect(round.pendingPaths.value.map((q) => q.word)).toEqual(['casa', 'mar']);

    clock.advance(499);
    expect(submits()).toEqual([]);
    clock.advance(1);
    expect(submits()).toEqual([{ type: 'submit', paths: [CASA, MAR] }]);
    expect(round.pendingPaths.value).toEqual([]);
  });

  test('sends only valid words not found yet', async () => {
    const { clock, swipe, submits } = await setup();

    await swipe(CAS);
    await swipe(CA);
    await swipe(QUERO);
    await swipe(QUERO);
    clock.advance(500);

    expect(submits()).toEqual([{ type: 'submit', paths: [QUERO] }]);
  });

  test('sends at once in the last 3 seconds of the round', async () => {
    // PLAY-01 AC 12, L-001: with 3,000 ms left the path goes without waiting.
    const { swipe, submits } = await setup({ at: ENDS_AT - 3_000 });

    await swipe(CASA);

    expect(submits()).toEqual([{ type: 'submit', paths: [CASA] }]);
  });

  test('drops pending paths when the results arrive', async () => {
    // Edge Cases: the server closed the round, so the paths still waiting are not sent.
    const { clock, connection, round, swipe, submits } = await setup();

    await swipe(CASA);
    expect(round.pendingPaths.value).toHaveLength(1);
    connection.receive(RESULTS);

    expect(round.pendingPaths.value).toEqual([]);
    clock.advance(1_000);
    expect(submits()).toEqual([]);
  });
});

describe('the server answer', () => {
  test('confirms the accepted words and removes the refused ones', async () => {
    // PLAY-01 AC 13: "mar" was shown as valid; the server refuses it.
    const { clock, connection, room, swipe } = await setup();

    await swipe(CASA);
    await swipe(MAR);
    clock.advance(500);
    connection.receive({
      type: 'submit-result',
      results: [
        { ok: true, word: 'casa' },
        { ok: false, reason: 'not-a-word' },
      ],
    });

    expect(room.room.value.found).toEqual([{ word: 'casa', points: 2, confirmed: true }]);
  });

  test('settles each answer against the batch it answers, oldest first', async () => {
    const { clock, connection, swipe, foundWords } = await setup();

    await swipe(CASA);
    clock.advance(500);
    await swipe(MAR);
    clock.advance(500);
    expect(foundWords()).toEqual(['mar', 'casa']);

    connection.receive({ type: 'submit-result', results: [{ ok: true, word: 'casa' }] });
    connection.receive({ type: 'submit-result', results: [{ ok: false, reason: 'round-closed' }] });

    expect(foundWords()).toEqual(['casa']);
  });

  test('forgets the swipes of the round when a new round starts', async () => {
    const { connection, round, swipe } = await setup();

    await swipe(CASA);
    connection.receive({ type: 'round-start', id: ROUND_ID + 1, index: 1, board: BOARD, startsAt: 200_000, endsAt: 260_000 });

    expect(round.pendingPaths.value).toEqual([]);
    expect(round.feedback.value).toBeNull();
  });
});

describe('a reconnect in the middle of the round', () => {
  test('sends again the words the server did not get before the drop', async () => {
    // RECON-01 AC 3 and PLAY-01 AC 12: CASA went out in a batch that got no answer and MAR still waited when the
    // socket dropped. The welcome lists neither, so both stay in the list and go out once the room is back.
    const { clock, connection, room, swipe, submits, foundWords } = await setup();
    await swipe(CASA);
    clock.advance(500);
    await swipe(MAR);
    connection.handlers().onStatus('reconnecting');
    clock.advance(5_000);
    expect(submits()).toEqual([{ type: 'submit', paths: [CASA] }]);

    connection.handlers().onStatus('open');
    connection.receive(roundWelcome());
    clock.advance(500);

    expect(foundWords()).toEqual(['mar', 'casa']);
    expect(submits()).toEqual([
      { type: 'submit', paths: [CASA] },
      { type: 'submit', paths: [CASA, MAR] },
    ]);
    connection.receive({
      type: 'submit-result',
      results: [
        { ok: true, word: 'casa' },
        { ok: true, word: 'mar' },
      ],
    });
    expect(room.room.value.found.every((f) => f.confirmed)).toBe(true);
  });

  test('keeps the words the welcome already lists without sending them again', async () => {
    // RECON-01 AC 3: CASA reached the server before the drop, so the welcome brings it back and nothing goes out.
    const { clock, connection, swipe, submits, foundWords } = await setup();
    await swipe(CASA);
    clock.advance(500);
    connection.handlers().onStatus('reconnecting');

    connection.handlers().onStatus('open');
    connection.receive(roundWelcome(['casa']));
    clock.advance(1_000);

    expect(foundWords()).toEqual(['casa']);
    expect(submits()).toHaveLength(1);
  });

  test('drops the queue when the phone comes back into another round', async () => {
    const { clock, connection, swipe, submits, foundWords } = await setup();
    await swipe(MAR);
    connection.handlers().onStatus('reconnecting');

    connection.handlers().onStatus('open');
    connection.receive({ ...roundWelcome(), round: { id: ROUND_ID + 1, index: 1, board: BOARD, startsAt: STARTS_AT, endsAt: ENDS_AT } });
    clock.advance(1_000);

    expect(foundWords()).toEqual([]);
    expect(submits()).toEqual([]);
  });
});
