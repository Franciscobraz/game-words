import type { RoundResultsMessage, ServerMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { FINALE_SONG, JINGLE_SONG, LOBBY_SONG, MATCH_SONG, notesInWindow, type Song } from '../src/model/songs.ts';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { cuttableRoom } from './cuttable-room.ts';
import { fakeRoom } from './fake-room.ts';
import { recordSounds, type StartedNote } from './record-sounds.ts';
import { ANA, BETO, lobbyWelcome, SAMPLE_BOARD, SAMPLE_END, SAMPLE_START, sampleResults } from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

/** How many notes of a song each screen is checked on: the melody and the bass of the first beat. */
const FIRST_NOTES = 2;

/** Audio files a page could ask for; the music has none (MUSIC-01 AC 11). */
const AUDIO_FILE = /\.(mp3|ogg|oga|wav|m4a|aac|flac|opus|weba|mid|midi)(\?|$)/i;

const music = (page: Page) => page.evaluate(() => (window as unknown as { music: StartedNote[] }).music);

/** The frequencies of the first notes of `song`, in the order they play. */
function openingOf(song: Song): number[] {
  return notesInWindow(song, 0, song.lengthS)
    .slice(0, FIRST_NOTES)
    .map((note) => note.frequencyHz);
}

/** Opens the TV with the clock stopped at `at`, a second after the clock was installed, since it cannot pause in its past. */
async function stopClockAt(page: Page, at: number) {
  await page.clock.install({ time: at - 1_000 });
  await page.clock.pauseAt(at);
}

/** The frequencies of the notes recorded after the first `from`, once the next tick of the clock played them. */
async function notesAfter(page: Page, from: number): Promise<number[]> {
  await page.clock.runFor(TICK_MS);
  await expect.poll(async () => (await music(page)).length - from).toBeGreaterThanOrEqual(FIRST_NOTES);
  return (await music(page)).slice(from, from + FIRST_NOTES).map((note) => note.frequencyHz);
}

/** Round `index` of KBXT, on the sample board, from `startsAt` for two minutes. */
function roundStart(id: number, index: number, startsAt: number): ServerMessage {
  return { type: 'round-start', id, index, board: SAMPLE_BOARD, startsAt, endsAt: startsAt + 120_000, salt: 'sample-salt' };
}

/** The music each screen starts with, as the browser played it. */
interface HeardMusic {
  opening: number[];
  countdown: number[];
  result: number[];
  podium: number[];
}

/**
 * Plays a match of two rounds on a scripted room, from "abrindo a sala" to the podium, and notes the first notes each
 * screen starts with. The room is created only when the test lets it, so the opening stays on the screen first.
 */
async function playTwoRounds(page: Page): Promise<HeardMusic> {
  await recordSounds(page, 'running');
  await stopClockAt(page, SAMPLE_START - 10_000);
  const room = await fakeRoom(page, lobbyWelcome([ANA, BETO], ANA.id));
  let openRoom = () => {};
  const roomOpened = new Promise<void>((resolve) => (openRoom = resolve));
  await page.route('**/api/rooms', async (route) => {
    await roomOpened;
    await route.fallback();
  });

  await page.goto('/');
  await expect(page.getByTestId('opening-screen')).toBeVisible();
  const opening = await notesAfter(page, 0);

  openRoom();
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await page.clock.runFor(TICK_MS);

  let mark = (await music(page)).length;
  room.push(roundStart(1, 0, SAMPLE_START));
  await expect(page.getByTestId('countdown-screen')).toBeVisible();
  const countdown = await notesAfter(page, mark);

  await page.clock.fastForward(SAMPLE_END - (SAMPLE_START - 10_000));
  await showWords(page, room.push, sampleResults());
  mark = (await music(page)).length;
  room.push({ type: 'phase', phase: 'results' });
  await expect(page.getByTestId('result-screen')).toBeVisible();
  const result = await notesAfter(page, mark);

  const secondStart = SAMPLE_END + 60_000;
  await page.clock.fastForward(60_000 - 3_000);
  room.push(roundStart(2, 1, secondStart));
  await expect(page.getByTestId('countdown-screen')).toBeVisible();
  await page.clock.fastForward(3_000 + 120_000);
  await showWords(page, room.push, { ...sampleResults(), index: 1, last: true });
  mark = (await music(page)).length;
  room.push({ type: 'podium', ranking: [] });
  await expect(page.getByTestId('result-screen')).toBeVisible();
  const podium = await notesAfter(page, mark);

  return { opening, countdown, result, podium };
}

/** Ends the round on the words, as the server does. */
async function showWords(page: Page, push: (msg: ServerMessage) => void, results: RoundResultsMessage) {
  push(results);
  push({ type: 'phase', phase: 'words' });
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
}

test('plays the music of each screen in the browser', async ({ page }) => {
  // MUSIC-01 AC 1, 2, 6, 7: the lobby music on "abrindo a sala", the match music on the first countdown, the jingle on
  // the result between rounds and the finale on the podium, each from its first notes.
  const heard = await playTwoRounds(page);

  expect(heard.opening).toEqual(openingOf(LOBBY_SONG));
  expect(heard.countdown).toEqual(openingOf(MATCH_SONG));
  expect(heard.result).toEqual(openingOf(JINGLE_SONG));
  expect(heard.podium).toEqual(openingOf(FINALE_SONG));
});

test('loads no audio file', async ({ page }) => {
  // MUSIC-01 AC 11: every screen of a match plays its music, and the page never asks for an audio file.
  const requested: string[] = [];
  const audioResponses: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  page.on('response', (response) => {
    if ((response.headers()['content-type'] ?? '').startsWith('audio/')) audioResponses.push(response.url());
  });

  const heard = await playTwoRounds(page);

  for (const notes of Object.values(heard)) expect(notes).toHaveLength(FIRST_NOTES);
  expect(requested.length).toBeGreaterThan(0);
  expect(requested.filter((url) => AUDIO_FILE.test(url))).toEqual([]);
  expect(audioResponses).toEqual([]);
});

test('keeps the music of the screen while reconnecting', async ({ page, context }) => {
  // MUSIC-01 AC 9: the socket of the lobby drops; under "Reconectando…" the lobby music goes on from where it was,
  // with no restart: every note so far, from "abrindo a sala" on, follows the song from its start.
  await recordSounds(page, 'running');
  await stopClockAt(page, SAMPLE_START);
  const room = await cuttableRoom(context, lobbyWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await page.clock.runFor(2_000);
  const beforeCut = (await music(page)).length;
  expect(beforeCut).toBeGreaterThan(0);

  room.goAway();
  room.cut();
  await expect(page.getByTestId('connection-banner')).toHaveText(STRINGS.reconnecting);
  await page.clock.runFor(3_000);
  await expect(page.getByTestId('connection-banner')).toHaveText(STRINGS.reconnecting);
  await expect(page.getByTestId('lobby-screen')).toBeVisible();

  const notes = (await music(page)).map((note) => note.frequencyHz);
  expect(notes.length).toBeGreaterThan(beforeCut);
  const song = notesInWindow(LOBBY_SONG, 0, LOBBY_SONG.lengthS).map((note) => note.frequencyHz);
  expect(notes).toEqual(song.slice(0, notes.length));
});
