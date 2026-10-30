import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Board,
  boardSolutions,
  findPath,
  LanguagePack,
  type PackMeta,
  pickLongestWord,
  type RoundStartMessage,
  type ServerMessage,
  wordPoints,
} from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { displayWord } from '../src/model/word-rows.ts';
import { HOLD_AFTER_LAST_MS, scrollDurationMs, TIME_UP_MS } from '../src/model/reveal.ts';
import { joinOnPhone, type Phone, PHONE_TEXT, swipeOnPhone } from './phones.ts';
import { readQr } from './read-qr.ts';

/**
 * The whole game through one address (Success Criteria, SERVE-01, TVRES-01 AC 12): the Worker of `wrangler dev` serves
 * the built TV at `/tv` and the built phone at `/<CÓDIGO>` (`npm run assets:build`, in the Playwright config). Two rounds
 * of real time, 30 s each, the least the server allows. The first round has a list long enough to scroll.
 */

/** Where the Worker listens; the test goes to it directly, not through a Vite. */
const WORKER_URL = 'http://localhost:8787';

/** The pt-BR pack, read here only by the test (PROTO-01 AC 8). `npm run dict:build` once before the E2E. */
const PACK_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../tools/dict-build/dist/pt-BR');

const ROUNDS = 2;
const BOARD_SIZE = 4;

/** The words Ana adds to the first round, so the list is longer than its panel. */
const EXTRA_WORDS_TO_SCROLL = 15;

/** Countdown, 30 s, the reveal, and the wait for the next message: far above the round, far below a hang. */
const ROUND_END_TIMEOUT_MS = 45_000;

/** How far a timing seen in the page may stray: the clock tick, the socket and a busy machine. */
const LATE_MS = 1_500;
const EARLY_MS = 300;

function loadPack(): LanguagePack {
  const file = (name: string) => {
    const bytes = readFileSync(join(PACK_DIR, name));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  };
  return LanguagePack.fromBuffers({
    dict: file('dict.bin'),
    common: file('common.bin'),
    profanity: file('profanity.bin'),
    spellings: file('spellings.bin'),
    meta: JSON.parse(readFileSync(join(PACK_DIR, 'meta.json'), 'utf8')) as PackMeta,
  });
}

// What the TV receives and shows, watched from outside

/** Every message the TV's socket receives. */
function recordFrames(page: Page): ServerMessage[] {
  const frames: ServerMessage[] = [];
  page.on('websocket', (socket) => {
    socket.on('framereceived', ({ payload }) => frames.push(JSON.parse(String(payload)) as ServerMessage));
  });
  return frames;
}

/** When a screen came up, by the page's own clock. */
interface ScreenChange {
  screen: string;
  at: number;
}

const WATCHED_SCREENS = ['lobby-screen', 'countdown-screen', 'round-screen', 'time-up', 'words-screen', 'result-screen'] as const;

/** Notes each screen when it comes up: nothing here depends on how often Playwright looks. */
async function watchScreens(page: Page): Promise<void> {
  await page.addInitScript((watched) => {
    const log: ScreenChange[] = [];
    (window as unknown as { screenLog: ScreenChange[] }).screenLog = log;
    const showing = new Set<string>();
    const note = () => {
      for (const screen of watched) {
        const isUp = document.querySelector(`[data-testid="${screen}"]`) !== null;
        if (isUp && !showing.has(screen)) log.push({ screen, at: Date.now() });
        if (isUp) showing.add(screen);
        else showing.delete(screen);
      }
    };
    new MutationObserver(note).observe(document, { childList: true, subtree: true });
  }, WATCHED_SCREENS);
}

const screenLog = (page: Page) => page.evaluate(() => (window as unknown as { screenLog: ScreenChange[] }).screenLog);

/** The last time `screen` came up. */
function lastTimeOf(log: readonly ScreenChange[], screen: string): number {
  const change = log.filter((entry) => entry.screen === screen).at(-1);
  if (change === undefined) throw new Error(`The TV never showed ${screen}`);
  return change.at;
}

// The round's plays

/** A word with the tiles that spell it. */
interface Play {
  word: string;
  path: number[];
}

/** The words of a round: who plays what, chosen from the same pack the server has. */
interface RoundPlan {
  board: Board;
  possibleWords: number;
  /** Ana's alone, the longest word of the board, which the TV lights. */
  longest: Play;
  /** Ana and Beto both find it. */
  shared: Play;
  /** Caio's alone. */
  caios: Play;
  /** More of Ana's own, shorter than the longest. */
  extras: Play[];
}

function playOf(board: Board, word: string): Play {
  const path = findPath(board, word);
  if (path === null) throw new Error(`No path for ${word}`);
  return { word, path };
}

function planRound(board: Board, pack: LanguagePack, extraCount: number): RoundPlan {
  const { words } = boardSolutions(board, pack, { minLength: 3, filterProfanity: true });
  const longest = pickLongestWord(words, pack, new Map<string, Set<string>>(), true);
  if (longest === null) throw new Error('The board has no longest word');
  const others = [...words].filter((word) => word.length < longest.word.length).sort((a, b) => a.length - b.length || a.localeCompare(b));
  const [shared, caios, ...rest] = others;
  if (shared === undefined || caios === undefined || rest.length < extraCount) throw new Error(`The board has only ${words.size} words`);
  return {
    board,
    possibleWords: words.size,
    longest: playOf(board, longest.word),
    shared: playOf(board, shared),
    caios: playOf(board, caios),
    extras: rest.slice(0, extraCount).map((word) => playOf(board, word)),
  };
}

/** The points each player gets from the plan: a word only one player found counts double. */
function pointsOf({ longest, shared, caios, extras }: RoundPlan) {
  const anaAlone = [longest, ...extras].reduce((sum, play) => sum + 2 * wordPoints(play.word), 0);
  return { ana: anaAlone + wordPoints(shared.word), beto: wordPoints(shared.word), caio: 2 * wordPoints(caios.word) };
}

/** Swipes `play` on the phone, and waits for "VÁLIDA (+N PTS)". */
async function playWord(phone: Phone, play: Play): Promise<void> {
  await swipeOnPhone(phone.page, play.path, BOARD_SIZE);
  await expect(phone.page.getByRole('status')).toHaveText(PHONE_TEXT.validWord(wordPoints(play.word)));
}

/** The board of the `index`-th round, as the TV got it. */
async function roundStartOf(frames: readonly ServerMessage[], index: number): Promise<RoundStartMessage> {
  const starts = () => frames.filter((msg): msg is RoundStartMessage => msg.type === 'round-start');
  await expect.poll(() => starts().length, { timeout: 30_000 }).toBeGreaterThan(index);
  return starts()[index]!;
}

// The test

test('plays a whole match through the worker', async ({ page, browser }) => {
  test.setTimeout(240_000);
  const pack = loadPack();
  const frames = recordFrames(page);
  await watchScreens(page);

  // The TV opens the room by itself, and its QR takes a phone to the room.
  await page.goto(`${WORKER_URL}/tv`);
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await expect(page.getByTestId('player-count')).toHaveText('0 / 10');
  const code = await page.getByTestId('room-code').innerText();
  const roomUrl = `${WORKER_URL}/${code}`;
  await expect.poll(() => readQr(page, page.getByTestId('room-qr'))).toBe(roomUrl);
  expect((await page.request.get(`${WORKER_URL}/pt-BR/dict.bin`)).status()).toBe(404);

  // Three real phones join at the address of the QR.
  const ana = await joinOnPhone(browser, roomUrl, 'Ana');
  const beto = await joinOnPhone(browser, roomUrl, 'Beto');
  const caio = await joinOnPhone(browser, roomUrl, 'Caio');
  const phones = [ana, beto, caio];
  await expect(ana.page.getByText(PHONE_TEXT.youAreHost)).toBeVisible();
  await expect(page.getByTestId('player-count')).toHaveText('3 / 10');
  await expect(page.getByTestId('lobby-footer')).toHaveText('Aguardando Ana iniciar a partida…');

  // The host sets two rounds of 30 s, and the TV mirrors it.
  await ana.page.getByRole('button', { name: PHONE_TEXT.increaseRounds }).click();
  await expect(ana.page.getByLabel(PHONE_TEXT.rounds, { exact: true })).toHaveText(String(ROUNDS));
  for (const time of ['1:30', '1:00', '0:30']) {
    await ana.page.getByRole('button', { name: PHONE_TEXT.decreaseRoundTime }).click();
    await expect(ana.page.getByLabel(PHONE_TEXT.roundTime, { exact: true })).toHaveText(time);
  }
  await expect(page.getByTestId('chip-rounds')).toContainText(`${ROUNDS} rodadas`);
  await expect(page.getByTestId('chip-seconds')).toContainText('0:30');
  await ana.page.getByRole('button', { name: PHONE_TEXT.startMatch }).click();

  // First round: the phones play, the TV counts, and the reveal goes by itself up to the result.
  const firstStart = await roundStartOf(frames, 0);
  const firstPlan = planRound(firstStart.board, pack, EXTRA_WORDS_TO_SCROLL);
  await playRound(page, phones, firstStart, firstPlan, frames);
  await expectTimeUp(page, firstStart);
  await expectWordList(page, firstPlan, ROUNDS);
  await expectListToReachItsEnd(page);
  await expectResultAfterTheWait(page, firstPlan);

  const firstPoints = pointsOf(firstPlan);
  await expect(page.getByTestId('result-title')).toHaveText(`Resultado·Rodada 1 de ${ROUNDS}`);
  await expect(page.getByTestId('result-footer')).toHaveText('Aguardando Ana avançar…');
  await expectStandings(page, frames, firstPoints);
  await expectLongestWord(page, firstPlan);
  await expect.poll(() => readQr(page, page.getByTestId('room-qr'))).toBe(roomUrl);
  for (const phone of [beto, caio]) await expect(phone.page.getByText(PHONE_TEXT.waitingToAdvance('Ana'))).toBeVisible();

  // The host moves on from the phone, and the TV follows.
  await ana.page.getByRole('button', { name: PHONE_TEXT.nextRound(2, ROUNDS) }).click();
  await expect(page.getByTestId('countdown-screen')).toContainText(`RODADA 2 DE ${ROUNDS}`);

  // Last round: the phones go straight to the podium, and the TV still takes its time.
  const lastStart = await roundStartOf(frames, 1);
  const lastPlan = planRound(lastStart.board, pack, 0);
  await playRound(page, phones, lastStart, lastPlan, frames);
  await expectTimeUp(page, lastStart);
  await expect(ana.page.getByRole('button', { name: PHONE_TEXT.playAgain })).toBeVisible({ timeout: ROUND_END_TIMEOUT_MS });
  await expect(ana.page.getByRole('heading', { name: PHONE_TEXT.firstPlace })).toBeVisible();
  await expect(ana.page.getByRole('region', { name: PHONE_TEXT.yourPerformance }).locator('.match-performance__count')).toHaveText(String(2 + EXTRA_WORDS_TO_SCROLL + 2));
  await expect(beto.page.getByRole('region', { name: PHONE_TEXT.yourPerformance }).locator('.match-performance__count')).toHaveText('2');
  await expectWordList(page, lastPlan, ROUNDS);
  await expectResultAfterTheWait(page, lastPlan);

  const lastPoints = pointsOf(lastPlan);
  const totals = { ana: firstPoints.ana + lastPoints.ana, beto: firstPoints.beto + lastPoints.beto, caio: firstPoints.caio + lastPoints.caio };
  await expect(page.getByTestId('result-title')).toHaveText('Ana venceu!');
  await expect(page.getByTestId('confetti')).toBeVisible();
  await expect(page.getByTestId('result-footer')).toHaveText('Aguardando Ana: jogar de novo ou voltar ao lobby');
  await expectStandings(page, frames, totals);
  await expectLongestWord(page, lastPlan);

  // "JOGAR DE NOVO" starts a new match on the three phones and on the TV.
  await ana.page.getByRole('button', { name: PHONE_TEXT.playAgain }).click();
  for (const { page: phonePage } of phones) await expect(phonePage.getByText(PHONE_TEXT.getReady)).toBeVisible();
  await expect(page.getByTestId('countdown-screen')).toContainText(`RODADA 1 DE ${ROUNDS}`);
  expect(playersIn(frames).find(({ nickname }) => nickname === 'Ana')?.wins).toBe(1);

  // No screen was skipped, and none came twice.
  const shown = (await screenLog(page)).map(({ screen }) => screen);
  const oneRound = ['countdown-screen', 'round-screen', 'time-up', 'words-screen', 'result-screen'];
  expect(shown).toEqual(['lobby-screen', ...oneRound, ...oneRound, 'countdown-screen']);

  for (const phone of phones) await phone.close();
});

/** The countdown, then the plays of the three phones, with the TV counting and never saying a word (TVPLAY-01 AC 1-2, 5-6). */
async function playRound(page: Page, phones: readonly Phone[], start: RoundStartMessage, plan: RoundPlan, frames: readonly ServerMessage[]): Promise<void> {
  const [ana, beto, caio] = phones;
  if (ana === undefined || beto === undefined || caio === undefined) throw new Error('Three phones expected');
  await expect(page.getByTestId('round-screen')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('board')).toBeVisible();

  const players = playersIn(frames);
  await playWord(ana, plan.longest);
  await playWord(ana, plan.shared);
  await playWord(beto, plan.shared);
  await playWord(caio, plan.caios);
  for (const extra of plan.extras) await playWord(ana, extra);

  const countOf = (nickname: string) => page.getByTestId(`round-player-${idOf(players, nickname)}`);
  await expect(countOf('Ana')).toContainText(`${2 + plan.extras.length}`);
  await expect(countOf('Ana')).toContainText('palavras');
  await expect(countOf('Beto')).toContainText('1');
  await expect(countOf('Beto')).toContainText('palavra');
  await expect(countOf('Caio')).toContainText('1');

  // Nothing the TV got or shows so far has a word of this round in it.
  const words = [plan.longest, plan.shared, plan.caios, ...plan.extras].map(({ word }) => word);
  const received = stringValuesIn(frames.slice(frames.indexOf(start)));
  const cardWords = (await page.locator('.round-player').allInnerTexts()).join(' ').split(/[^\p{L}]+/u);
  for (const word of words) {
    expect(received).not.toContain(word);
    expect(cardWords).not.toContain(displayWord(word));
  }
  expect(Date.now()).toBeLessThan(start.endsAt);
}

/** "Tempo!" over the board when the time ends, with "0:00" (TVPLAY-01 AC 10). */
async function expectTimeUp(page: Page, start: RoundStartMessage): Promise<void> {
  await expect(page.getByTestId('time-up')).toBeVisible({ timeout: ROUND_END_TIMEOUT_MS });
  await expect(page.getByTestId('round-clock')).toHaveText('0:00');
  const log = await screenLog(page);
  expect(lastTimeOf(log, 'time-up')).toBeGreaterThanOrEqual(start.endsAt - EARLY_MS);
  expect(lastTimeOf(log, 'time-up')).toBeLessThanOrEqual(start.endsAt + LATE_MS);
}

/** "Tempo!" lasted its 2 s, and the list reads as the spec orders it (TVWORDS-01 AC 1-5). */
async function expectWordList(page: Page, plan: RoundPlan, rounds: number): Promise<void> {
  await expect(page.getByTestId('words-screen')).toBeVisible({ timeout: 10_000 });
  const log = await screenLog(page);
  const timeUpLasted = lastTimeOf(log, 'words-screen') - lastTimeOf(log, 'time-up');
  expect(timeUpLasted).toBeGreaterThanOrEqual(TIME_UP_MS - EARLY_MS);
  expect(timeUpLasted).toBeLessThanOrEqual(TIME_UP_MS + LATE_MS);

  const unique = [plan.longest, plan.caios, ...plan.extras].map(({ word }) => word).sort((a, b) => a.length - b.length || a.localeCompare(b));
  const expected = [plan.shared.word, ...unique];
  const totals = page.getByTestId('word-totals');
  await expect(totals).toContainText(String(plan.possibleWords));
  await expect(totals).toContainText(String(expected.length));
  await expect(page.getByTestId('words-screen')).toContainText('Palavras em comum');
  await expect(page.getByTestId('words-screen')).toContainText('Palavras Únicas');
  await expect(page.getByTestId('words-screen')).toContainText(`Rodada ${log.filter(({ screen }) => screen === 'words-screen').length} de ${rounds}`);

  const rows = page.getByTestId('word-row');
  expect(await rows.locator('.word-row__word').allTextContents()).toEqual(expected.map(displayWord));
  const doublesUnlessShared = (word: string) => (word === plan.shared.word ? wordPoints(word) : 2 * wordPoints(word));
  expect(await rows.locator('.word-row__points').allTextContents()).toEqual(expected.map((word) => `+${doublesUnlessShared(word)}`));
  await expect(rows.first().locator('.word-row__finder')).toHaveText(['A', 'B']);
}

/** The list moves until its last word is in view, and the screen stays there (TVWORDS-01 AC 6, 8). */
async function expectListToReachItsEnd(page: Page): Promise<void> {
  const panel = page.getByTestId('word-scroll');
  const lastRow = page.getByTestId('word-row').last();
  const panelBox = await panel.boundingBox();
  if (panelBox === null) throw new Error('The list has no panel');
  expect((await lastRow.boundingBox())!.y).toBeGreaterThan(panelBox.y + panelBox.height);

  await expect
    .poll(async () => {
      const box = await lastRow.boundingBox();
      return box === null ? Number.POSITIVE_INFINITY : box.y + box.height;
    }, { timeout: scrollDurationMs(EXTRA_WORDS_TO_SCROLL + 3) + LATE_MS })
    .toBeLessThanOrEqual(panelBox.y + panelBox.height + 1);
  await expect(page.getByTestId('words-screen')).toBeVisible();
}

/** With no action from anyone, the result opens when the scroll and the wait are over (TVWORDS-01 AC 6, 8; TVRES-01 AC 1). */
async function expectResultAfterTheWait(page: Page, plan: RoundPlan): Promise<void> {
  const wordCount = 3 + plan.extras.length;
  const expectedMs = scrollDurationMs(wordCount) + HOLD_AFTER_LAST_MS;
  await expect(page.getByTestId('result-screen')).toBeVisible({ timeout: expectedMs + 2 * LATE_MS });
  const log = await screenLog(page);
  const tookMs = lastTimeOf(log, 'result-screen') - lastTimeOf(log, 'words-screen');
  expect(tookMs).toBeGreaterThanOrEqual(expectedMs - EARLY_MS);
  expect(tookMs).toBeLessThanOrEqual(expectedMs + LATE_MS);
}

/** The cards with place and accumulated points (TVRES-01 AC 2-3). */
async function expectStandings(page: Page, frames: readonly ServerMessage[], points: { ana: number; beto: number; caio: number }): Promise<void> {
  const players = playersIn(frames);
  const ranked = [
    { nickname: 'Ana', score: points.ana },
    { nickname: 'Beto', score: points.beto },
    { nickname: 'Caio', score: points.caio },
  ].sort((a, b) => b.score - a.score);
  for (const { nickname, score } of ranked) {
    const place = ranked.findIndex((row) => row.score === score) + 1;
    const card = page.getByTestId(`podium-card-${idOf(players, nickname)}`);
    await expect(card).toContainText(nickname);
    await expect(card).toContainText(`${place}º`);
    await expect(card.locator('.podium-card__points')).toHaveText(String(score));
  }
  await expect(page.getByTestId('result-rest')).toHaveCount(0);
}

/** The longest word in the card, who found it, and its tiles lit one by one (TVRES-01 AC 5-6). */
async function expectLongestWord(page: Page, plan: RoundPlan): Promise<void> {
  const card = page.getByTestId('longest-word');
  await expect(card).toContainText('A maior palavra do tabuleiro');
  await expect(card).toContainText(displayWord(plan.longest.word));
  await expect(card).toContainText('Ana encontrou!');
  await expect(page.locator('.board-grid__tile--lit')).toHaveCount(plan.longest.path.length);
}

/** Every string value in `value`, at any depth: a word of the round would be one of them, whole. */
function stringValuesIn(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object' || value === null) return [];
  return Object.values(value).flatMap(stringValuesIn);
}

/** The players as the TV last heard about them. */
function playersIn(frames: readonly ServerMessage[]) {
  for (const frame of [...frames].reverse()) {
    if (frame.type === 'players' || frame.type === 'welcome') return frame.players;
  }
  throw new Error('The TV heard of no players');
}

function idOf(players: ReturnType<typeof playersIn>, nickname: string): string {
  const player = players.find((candidate) => candidate.nickname === nickname);
  if (player === undefined) throw new Error(`No player ${nickname}`);
  return player.id;
}
