import { COUNTDOWN_MS, type PlayerInfo, type RoundResultsMessage, type Settings, type WelcomeMessage } from '@bwords/core';
import { expect, type Page } from '@playwright/test';
import { GIVE_UP_AFTER_MS, NO_CONNECTION_AFTER_MS } from '../src/model/reconnect.ts';
import { foundWordCount, HOLD_AFTER_LAST_MS, scrollDurationMs, TIME_UP_MS } from '../src/model/reveal.ts';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { type CuttableRoom, cuttableRoom } from './cuttable-room.ts';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import { recordSounds } from './record-sounds.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, resultPlayers, roundWelcome, SAMPLE_END, SAMPLE_SETTINGS, SAMPLE_START, sampleResults, samplePlayer } from './samples.ts';

/**
 * Every screen and state of the TV, opened on a scripted room at a stopped clock, for the checks that cross the screens
 * (`layout.spec.ts`) and for the pictures of the screens no capture draws (`uncaptured.picture.ts`).
 */

/** A state of the TV that a test can open on a fresh page. */
export interface ScreenState {
  name: string;
  open(page: Page): Promise<void>;
}

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** All the tiles of the longest word lit, with room to spare (TVRES-01 AC 5). */
const LIGHT_ALL_TILES_MS = 3_000;

/** A round far longer than any wait of the connection banner, so the round is still on when the TV gives up. */
const LONG_ROUND_MS = 2 * GIVE_UP_AFTER_MS;

/** The widest word count a player reaches in a round, as far as the tests go. */
const MANY_WORDS = 99;

/** How many spellings a single word gets in the widest row. */
const MANY_SPELLINGS = ['seria', 'séria', 'sêria', 'sería', 'séría', 'sèria', 'serià', 'sériá'];

/** The room behind a screen: scripted, and able to drop the connection when the state asks for it. */
type OpenRoom = (page: Page, welcome: WelcomeMessage) => Promise<FakeRoom>;

const scriptedRoom: OpenRoom = (page, welcome) => fakeRoom(page, welcome);

/** Stops the page's clock at `at`, for the TV to open. */
async function stopClockAt(page: Page, at: number): Promise<void> {
  // Installed a second earlier: the clock runs until the pause, and it cannot be paused in its past.
  await page.clock.install({ time: at - 1_000 });
  await page.clock.pauseAt(at);
}

/** Waits for the screen and its font: a text only has its final width once the font is in. */
async function showScreen(page: Page, testId: string): Promise<void> {
  await expect(page.getByTestId(testId)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

// Players

/** `count` players with the longest and widest nicknames allowed, the last one disconnected when there are others (Edge Cases). */
export function twelveLetterPlayers(count: number): PlayerInfo[] {
  return Array.from({ length: count }, (_, index) => {
    const nickname = `${'W'.repeat(11)}${String.fromCharCode(65 + index)}`;
    const color = TEN_COLORS[index] ?? '#FF7A00';
    return samplePlayer(`p${index + 1}`, nickname, color, { wins: 12, score: 999 - index, connected: index === 0 || index < count - 1 });
  });
}

const TEN_COLORS = ['#FF7A00', '#00C2FF', '#10D078', '#FF4D8D', '#F97316', '#A855F7', '#F43F5E', '#06B6D4', '#84CC16', '#3B82F6'];

/** The first `count` players of the result capture. */
function capturePlayers(count: number): PlayerInfo[] {
  return resultPlayers().slice(0, count);
}

// Results

interface ResultsOptions {
  /** Who found the longest word; only the first player by default. */
  longestFinders?: readonly PlayerInfo[];
  last?: boolean;
}

/** Results where every player found the shared words and one word of their own: the most circles on a row. */
export function resultsOf(players: readonly PlayerInfo[], { longestFinders, last = false }: ResultsOptions = {}): RoundResultsMessage {
  const everyone = players.map(({ id }) => id);
  const finders = longestFinders ?? players.slice(0, 1);
  return {
    type: 'round-results',
    index: last ? SAMPLE_SETTINGS.rounds - 1 : 0,
    shared: [
      { word: 'asa', points: 1, foundBy: everyone },
      { word: 'casa', points: 2, foundBy: everyone },
    ],
    players: players.map(({ id }, index) => ({ playerId: id, unique: [{ word: `tia${index}`, points: 2 }], roundPoints: 0, score: 0 })),
    longest: { word: 'ternos', points: 4, path: [8, 5, 6, 10, 7, 11], foundBy: finders.map(({ id }) => id) },
    possibleWords: 1_482,
    last,
  };
}

/** Results with no word found (TVWORDS-01 AC 9). */
function noWords(results: RoundResultsMessage): RoundResultsMessage {
  return { ...results, shared: [], players: [] };
}

/** A first shared word with a long list of spellings, found by all the players (Edge Cases). */
export function manySpellings(players: readonly PlayerInfo[]): RoundResultsMessage {
  const results = resultsOf(players);
  const [first, ...others] = results.shared;
  if (first === undefined) throw new Error('The results have no shared word');
  return { ...results, shared: [{ ...first, spellings: MANY_SPELLINGS }, ...others] };
}

// Opening each screen

function openLobby(players: PlayerInfo[], hostId: string | null, { blockedSound = false } = {}) {
  return async (page: Page, openRoom: OpenRoom = scriptedRoom): Promise<void> => {
    if (blockedSound) await recordSounds(page, 'suspended');
    await stopClockAt(page, SAMPLE_START);
    await openRoom(page, lobbyWelcome(players, hostId));
    await page.goto('/');
    await showScreen(page, 'lobby-screen');
    if (blockedSound) await expect(page.getByTestId('audio-notice')).toBeVisible();
  };
}

function openCountdown(players: PlayerInfo[]) {
  return async (page: Page, openRoom: OpenRoom = scriptedRoom): Promise<void> => {
    await stopClockAt(page, SAMPLE_START - COUNTDOWN_MS);
    await openRoom(page, roundWelcome(players, players[0]?.id ?? null));
    await page.goto('/');
    await showScreen(page, 'countdown-screen');
  };
}

/** The welcome of a round of the board size `size`, with `LONG_ROUND_MS` to go. */
function longRound(players: PlayerInfo[], size: Settings['size']): WelcomeMessage {
  const welcome = roundWelcome(players, players[0]?.id ?? null, boardOfSize(size));
  const round = welcome.round;
  if (round === null) throw new Error('The welcome has no round');
  return { ...welcome, settings: { ...SAMPLE_SETTINGS, size }, round: { ...round, endsAt: SAMPLE_START + LONG_ROUND_MS } };
}

/** A board of `size` tiles a side, with the widest tile. */
function boardOfSize(size: Settings['size']): string[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 'qu'));
}

function openRound(players: PlayerInfo[], size: Settings['size'] = 4) {
  return async (page: Page, openRoom: OpenRoom = scriptedRoom): Promise<void> => {
    await stopClockAt(page, SAMPLE_START + 16_000);
    const room = await openRoom(page, longRound(players, size));
    await page.goto('/');
    await showScreen(page, 'round-screen');
    room.push({ type: 'counts', counts: players.map(({ id }) => ({ playerId: id, count: MANY_WORDS })) });
    if (players[0] !== undefined) await expect(page.getByTestId(`round-player-${players[0].id}`)).toContainText(String(MANY_WORDS));
  };
}

/** Opens the TV when the round ends, ready to take `results`. */
async function openRoundEnd(page: Page, players: PlayerInfo[], openRoom: OpenRoom): Promise<FakeRoom> {
  await stopClockAt(page, SAMPLE_END);
  const room = await openRoom(page, roundWelcome(players, players[0]?.id ?? null));
  await page.goto('/');
  await showScreen(page, 'round-screen');
  return room;
}

function openTimeUp(players: PlayerInfo[]) {
  return async (page: Page, openRoom: OpenRoom = scriptedRoom): Promise<void> => {
    const room = await openRoundEnd(page, players, openRoom);
    room.push(resultsOf(players));
    await expect(page.getByTestId('time-up')).toBeVisible();
    await page.clock.runFor(TICK_MS);
  };
}

function openWords(players: PlayerInfo[], results: RoundResultsMessage = resultsOf(players)) {
  return async (page: Page, openRoom: OpenRoom = scriptedRoom): Promise<void> => {
    const room = await openRoundEnd(page, players, openRoom);
    room.push(results);
    await page.clock.runFor(TIME_UP_MS + TICK_MS);
    await showScreen(page, 'words-screen');
  };
}

function openResult(players: PlayerInfo[], results: RoundResultsMessage = resultsOf(players)) {
  return async (page: Page, openRoom: OpenRoom = scriptedRoom): Promise<void> => {
    const room = await openRoundEnd(page, players, openRoom);
    room.push(results);
    if (results.last) room.push({ type: 'podium', ranking: [] });
    await page.clock.runFor(TIME_UP_MS + scrollDurationMs(foundWordCount(results)) + HOLD_AFTER_LAST_MS + LIGHT_ALL_TILES_MS);
    await showScreen(page, 'result-screen');
  };
}

function openClosed(reason: 'idle' | 'replaced', testId: string) {
  return async (page: Page): Promise<void> => {
    const room = await fakeRoom(page, lobbyWelcome([ANA], ANA.id));
    await page.goto('/');
    await showScreen(page, 'lobby-screen');
    room.push({ type: 'closed', reason });
    await showScreen(page, testId);
  };
}

async function openFailed(page: Page): Promise<void> {
  await page.route('**/api/rooms', (route) => route.abort());
  await page.goto('/');
  await showScreen(page, 'open-failed-screen');
}

/** How long the room has been out of reach, in the banner's words (TVEXIT-01 AC 5-6, 9). */
type BannerState = 'reconnecting' | 'no-connection' | 'gave-up';

/** The time without the room that leads to each banner. */
const BANNER_AFTER_MS: Record<BannerState, number> = {
  reconnecting: 0,
  'no-connection': NO_CONNECTION_AFTER_MS,
  'gave-up': GIVE_UP_AFTER_MS,
};

type OpenScreen = (page: Page, openRoom?: OpenRoom) => Promise<void>;

/** A screen with the connection down for as long as `state` takes; the time goes by, so a reveal can move on meanwhile. */
function withBanner(openScreen: OpenScreen, state: BannerState) {
  return async (page: Page): Promise<void> => {
    const rooms: CuttableRoom[] = [];
    await openScreen(page, async (opened, welcome) => {
      const room = await cuttableRoom(opened.context(), welcome);
      rooms.push(room);
      return room;
    });
    const [room] = rooms;
    if (room === undefined) throw new Error('The screen opened no room');
    room.goAway();
    room.cut();
    const banner = page.getByTestId('connection-banner');
    await expect(banner).toHaveText(STRINGS.reconnecting);
    if (BANNER_AFTER_MS[state] > 0) await page.clock.fastForward(BANNER_AFTER_MS[state]);
    if (state === 'no-connection') await expect(banner).toHaveText(STRINGS.noConnection);
    if (state === 'gave-up') await expect(banner).toContainText(STRINGS.pressOkToRetry);
  };
}

// The states

/** The screens that show players, for a given list of them. */
export function playerStates(players: PlayerInfo[]): ScreenState[] {
  const count = players.length;
  return [
    { name: `lobby with ${count}`, open: openLobby(players, players[0]?.id ?? null) },
    { name: `lobby with ${count} and the sound notice`, open: openLobby(players, players[0]?.id ?? null, { blockedSound: true }) },
    { name: `round with ${count}`, open: openRound(players) },
    { name: `result with ${count}`, open: openResult(players) },
    { name: `last result with ${count}`, open: openResult(players, resultsOf(players, { last: true })) },
    { name: `result with ${count}, all of them finding the longest word`, open: openResult(players, resultsOf(players, { longestFinders: players })) },
  ];
}

/** The screens of a room with players that do not name them, for a given list of them. */
export function wordStates(players: PlayerInfo[]): ScreenState[] {
  const count = players.length;
  return [
    { name: `words with ${count}`, open: openWords(players) },
    { name: `words with ${count} and many spellings`, open: openWords(players, manySpellings(players)) },
    { name: `time up with ${count}`, open: openTimeUp(players) },
  ];
}

/** The connection banner in each of its states, over the screens that keep it the longest. */
function bannerStates(): ScreenState[] {
  const players = [ANA, BETO, { ...CAIO, connected: true }];
  const results = sampleResults();
  const screens: { name: string; open: OpenScreen }[] = [
    { name: 'lobby', open: openLobby(players, ANA.id) },
    { name: 'round', open: openRound(players) },
    { name: 'result', open: openResult(players, { ...results, players: [], shared: [] }) },
  ];
  const states: ScreenState[] = [];
  for (const state of ['reconnecting', 'no-connection', 'gave-up'] as const) {
    for (const screen of screens) states.push({ name: `${state} over the ${screen.name}`, open: withBanner(screen.open, state) });
  }
  states.push({ name: 'reconnecting over the countdown', open: withBanner(openCountdown(players), 'reconnecting') });
  states.push({ name: 'reconnecting over the words', open: withBanner(openWords(players, results), 'reconnecting') });
  return states;
}

/** Results of a first place shared by two players, at the end of the match (TVRES-01 AC 10). */
function tiedStandings(): PlayerInfo[] {
  return [
    { ...ANA, score: 20 },
    { ...BETO, score: 20 },
    { ...CAIO, connected: true, score: 5 },
  ];
}

const CAPTURE_LOBBY = [ANA, BETO, CAIO, DUDA];

/** Every state of the TV (TVUI-01 AC 1). */
export const SCREEN_STATES: readonly ScreenState[] = [
  { name: 'opening failed', open: openFailed },
  { name: 'empty lobby', open: openLobby([], null) },
  { name: 'empty lobby with the sound notice', open: openLobby([], null, { blockedSound: true }) },
  { name: 'lobby of the capture', open: openLobby(CAPTURE_LOBBY, ANA.id) },
  { name: 'lobby of the capture with the sound notice', open: openLobby(CAPTURE_LOBBY, ANA.id, { blockedSound: true }) },
  { name: 'countdown', open: openCountdown([ANA, BETO]) },
  { name: 'round on a 5x5 board', open: openRound([ANA, BETO], 5) },
  { name: 'round on a 6x6 board', open: openRound([ANA, BETO], 6) },
  ...[1, 3, 4, 5, 6].flatMap((count) => playerStates(capturePlayers(count))),
  ...playerStates(capturePlayers(10)),
  ...playerStates(twelveLetterPlayers(10)),
  ...wordStates(capturePlayers(1)),
  ...wordStates(capturePlayers(10)),
  ...wordStates(twelveLetterPlayers(10)),
  { name: 'words with no word found', open: openWords([ANA, BETO], noWords(sampleResults())) },
  { name: 'words of the capture', open: openWords([ANA, BETO, { ...CAIO, connected: true }], sampleResults()) },
  { name: 'result of the capture', open: openResult(resultPlayers(), sampleResults()) },
  { name: 'result of a tie', open: openResult(tiedStandings(), resultsOf(tiedStandings(), { last: true })) },
  { name: 'result of a board with no longest word', open: openResult([ANA, BETO], { ...resultsOf([ANA, BETO]), longest: null }) },
  { name: 'expired room', open: openClosed('idle', 'expired-screen') },
  { name: 'another tab', open: openClosed('replaced', 'replaced-screen') },
  ...bannerStates(),
];

/** A state of the table, by name. */
export function stateNamed(name: string): ScreenState {
  const state = SCREEN_STATES.find((candidate) => candidate.name === name);
  if (state === undefined) throw new Error(`No screen state "${name}"`);
  return state;
}
