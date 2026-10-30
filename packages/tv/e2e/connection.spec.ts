import type { RoundResultsMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { countdownNumber, formatClock } from '../src/model/clock.ts';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { type CuttableRoom, cuttableLink, cuttableRoom } from './cuttable-room.ts';
import { ANA, BETO, CAIO, lobbyWelcome, roundWelcome, SAMPLE_END, SAMPLE_START, sampleResults } from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

/** The banner's change and the reconnect limit (TVEXIT-01 AC 6, 9). */
const NO_CONNECTION_AFTER_MS = 30_000;
const GIVE_UP_AFTER_MS = 600_000;

/** The server's clock runs this far from the TV's, so a right time can only come from the sync. */
const CLOCK_OFFSET_MS = 3_600_000;

const banner = (page: Page) => page.getByTestId('connection-banner');

/** Stops the page's clock at `at`, for the TV to open. */
async function stopClockAt(page: Page, at: number) {
  // Installed a second earlier: the clock runs until the pause, and it cannot be paused in its past.
  await page.clock.install({ time: at - 1_000 });
  await page.clock.pauseAt(at);
}

/** Moves the clock until the page has reconnected; each socket event needs a moment of real time to arrive. */
async function runUntilReconnected(page: Page) {
  await expect(async () => {
    await page.clock.runFor(1_000);
    await expect(banner(page)).toHaveCount(0, { timeout: 100 });
  }).toPass();
}

/** Cuts the socket with the server out of reach, and waits for the page to notice. */
async function cutAndStayAway(page: Page, room: CuttableRoom) {
  room.goAway();
  room.cut();
  await expect(banner(page)).toHaveText(STRINGS.reconnecting);
}

test('keeps the screen with the reconnecting banner', async ({ page, context }) => {
  // TVEXIT-01 AC 5: the round stays on the screen, and its timer keeps going by the server's clock.
  await stopClockAt(page, SAMPLE_START + 10_000);
  const room = await cuttableRoom(context, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-clock')).toHaveText('1:50');
  await expect(banner(page)).toHaveCount(0);

  await cutAndStayAway(page, room);

  await expect(page.getByTestId('round-screen')).toBeVisible();
  await expect(page.getByTestId('board')).toBeVisible();
  await page.clock.runFor(1_000 + TICK_MS);
  await expect(page.getByTestId('round-clock')).toHaveText('1:49');
  await expect.poll(() => room.socketCount()).toBeGreaterThan(1);
});

test('shows no connection after thirty seconds', async ({ page, context }) => {
  // TVEXIT-01 AC 6: at 29.999 s it still says "Reconectando…"; at 30 s it says "Sem conexão" and goes on trying.
  await stopClockAt(page, SAMPLE_START + 10_000);
  const room = await cuttableRoom(context, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  await cutAndStayAway(page, room);

  await page.clock.fastForward(NO_CONNECTION_AFTER_MS - 1);
  await expect(banner(page)).toHaveText(STRINGS.reconnecting);
  await page.clock.runFor(1);
  await expect(banner(page)).toHaveText('Sem conexão');
  await expect(page.getByTestId('round-screen')).toBeVisible();

  const attempts = room.socketCount();
  await expect(async () => {
    await page.clock.fastForward(60_000);
    expect(room.socketCount()).toBeGreaterThan(attempts);
  }).toPass();
  await expect(banner(page)).toHaveText('Sem conexão');
});

test('removes the banner when the connection returns', async ({ page, context }) => {
  // TVEXIT-01 AC 7: the room is as it stands now, with who joined during the drop.
  await stopClockAt(page, SAMPLE_START);
  const room = await cuttableRoom(context, lobbyWelcome([ANA], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await expect(page.getByTestId('player-count')).toHaveText('1 / 10');
  await cutAndStayAway(page, room);

  room.comeBack(lobbyWelcome([ANA, BETO], ANA.id));
  await runUntilReconnected(page);

  await expect(page.getByTestId('player-count')).toHaveText('2 / 10');
  await expect(page.getByTestId(`player-${BETO.id}`)).toContainText('Beto');
});

test('goes to the phase of the room when the connection returns', async ({ page, context }) => {
  // TVEXIT-01 AC 7: the round started during the drop.
  await stopClockAt(page, SAMPLE_START + 5_000);
  const room = await cuttableRoom(context, lobbyWelcome([ANA], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await cutAndStayAway(page, room);

  room.comeBack(roundWelcome([ANA], ANA.id));
  await runUntilReconnected(page);

  await expect(page.getByTestId('round-screen')).toBeVisible();
});

test('reconnects to the same room of the real server after a cut socket', async ({ page, context }) => {
  // TVEXIT-01 AC 5, 7, against the server: the token still holds and no room is created.
  const link = await cuttableLink(context);
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  const code = await page.getByTestId('room-code').textContent();
  const saved = await page.evaluate(() => localStorage.getItem('bwords.tv.room'));

  link.goAway();
  link.cut();
  await expect(banner(page)).toHaveText(STRINGS.reconnecting);
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  link.comeBack();

  await expect(banner(page)).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await expect(page.getByTestId('room-code')).toHaveText(code!);
  expect(await page.evaluate(() => localStorage.getItem('bwords.tv.room'))).toBe(saved);
});

test('does not restart the scroll after a cut socket', async ({ page, context }) => {
  // TVEXIT-01 AC 7, with TVWORDS-01 AC 11 only for a reload: the same results keep the plan and the scroll.
  const shared = Array.from({ length: 100 }, (_, index) => ({ word: `w${String(index).padStart(3, '0')}`, points: 1, foundBy: [ANA.id, BETO.id] }));
  const results: RoundResultsMessage = { ...sampleResults(), shared, players: [] };
  await stopClockAt(page, SAMPLE_END);
  const welcome = roundWelcome([ANA, BETO], ANA.id);
  const room = await cuttableRoom(context, welcome);
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  room.push(results);
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  const list = page.getByTestId('word-list');
  await list.evaluate((element) => {
    for (const animation of element.getAnimations()) animation.currentTime = 20_000;
  });
  await cutAndStayAway(page, room);
  await expect(page.getByTestId('words-screen')).toBeVisible();

  room.comeBack({ ...welcome, phase: 'results' }, [results]);
  await runUntilReconnected(page);

  await expect(page.getByTestId('words-screen')).toBeVisible();
  const elapsed = await list.evaluate((element) => element.getAnimations()[0]?.currentTime ?? null);
  expect(Number(elapsed)).toBeGreaterThanOrEqual(20_000);
});

test('shows the right time after reconnecting', async ({ page, context }) => {
  // Edge Cases: the times come from the server's clock, so the countdown and the timer go on without starting over.
  const serverNow = async () => (await page.evaluate(() => Date.now())) + CLOCK_OFFSET_MS;
  const welcome = roundWelcome([ANA, BETO, CAIO], ANA.id);
  await stopClockAt(page, SAMPLE_START - 2_500 - CLOCK_OFFSET_MS);
  const room = await cuttableRoom(context, welcome, CLOCK_OFFSET_MS);
  await page.goto('/');
  await expect(page.getByTestId('countdown-number')).toHaveText('3');

  // During the countdown: the number moved on while the socket was down.
  await cutAndStayAway(page, room);
  await page.clock.runFor(600);
  room.comeBack(welcome);
  await runUntilReconnected(page);
  await page.clock.runFor(TICK_MS);
  const number = countdownNumber(await serverNow(), SAMPLE_START);
  if (number === null) await expect(page.getByTestId('round-screen')).toBeVisible();
  else await expect(page.getByTestId('countdown-number')).toHaveText(String(number));

  // During the round: 20 s and more go by without a socket.
  await page.clock.fastForward(40_000);
  await cutAndStayAway(page, room);
  await page.clock.fastForward(20_000);
  room.comeBack(welcome);
  await runUntilReconnected(page);
  await page.clock.runFor(TICK_MS);

  await expect(page.getByTestId('round-screen')).toBeVisible();
  const remainingMs = SAMPLE_END - (await serverNow());
  expect(remainingMs).toBeLessThan(60_000);
  await expect(page.getByTestId('round-clock')).toHaveText(formatClock(remainingMs));
});

test('tries again after giving up', async ({ page, context }) => {
  // TVEXIT-01 AC 9-10: at 10 min it stops and asks for "OK", and a key starts the attempts from the beginning.
  await stopClockAt(page, SAMPLE_START + 10_000);
  const welcome = roundWelcome([ANA, BETO], ANA.id);
  const room = await cuttableRoom(context, welcome);
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  await cutAndStayAway(page, room);

  await page.clock.fastForward(GIVE_UP_AFTER_MS);
  await expect(banner(page)).toContainText('Sem conexão');
  await expect(banner(page)).toContainText('Aperte OK no controle para tentar de novo');

  // It really stopped: an hour later no attempt was made.
  const attempts = room.socketCount();
  await page.clock.fastForward(GIVE_UP_AFTER_MS * 6);
  await expect(banner(page)).toContainText('Aperte OK no controle para tentar de novo');
  expect(room.socketCount()).toBe(attempts);

  // A key with the server still away: one attempt at once and back to "Reconectando…".
  await page.keyboard.press('Enter');
  await expect(banner(page)).toHaveText(STRINGS.reconnecting);
  await expect.poll(() => room.socketCount()).toBe(attempts + 1);

  // The waits are from the beginning again: the next attempt comes within a second.
  room.comeBack(welcome);
  await runUntilReconnected(page);
  expect(room.socketCount()).toBeLessThanOrEqual(attempts + 3);
  await expect(page.getByTestId('round-screen')).toBeVisible();
});

test('a click also tries again after giving up', async ({ page, context }) => {
  // TVEXIT-01 AC 10.
  await stopClockAt(page, SAMPLE_START);
  const welcome = lobbyWelcome([ANA], ANA.id);
  const room = await cuttableRoom(context, welcome);
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await cutAndStayAway(page, room);
  await page.clock.fastForward(GIVE_UP_AFTER_MS);
  await expect(banner(page)).toContainText('Aperte OK no controle para tentar de novo');

  room.comeBack(welcome);
  await page.getByTestId('lobby-screen').click();

  await expect(banner(page)).toHaveCount(0);
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
});
