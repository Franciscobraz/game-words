import type { PlayerInfo } from '@bwords/core';
import { expect, type Locator, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import { boardOf, openRound } from './round-room.ts';
import { ANA, BETO, CAIO, DUDA, resultsWelcome, SAMPLE_CODE } from './samples.ts';

const PLAYERS = [ANA, BETO, CAIO, DUDA];

/** The smallest touch target (UI-01 AC 7). */
const MIN_TARGET_PX = 48;

/** The narrowest and the widest phone the layout serves (AD-016). */
const PHONE_WIDTHS = [320, 480] as const;

/** Opens KBXT on the phone of `me` with the room already on the words, as a phone that connects then gets it. */
async function openWords(page: Page, me: PlayerInfo): Promise<FakeRoom> {
  const room = await fakeRoom(page, (msg) => ({
    replies: msg.type === 'hello' ? [{ ...resultsWelcome(PLAYERS, me.id, []), phase: 'words' }] : [],
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  return room;
}

/** Opens KBXT on the phone of `me` in an open round, which the test then ends on the words. */
async function endRoundOnWords(page: Page, me: PlayerInfo): Promise<FakeRoom> {
  const now = Date.now();
  const room = await openRound(page, { me, startsAt: now - 60_000, endsAt: now + 60_000 });
  await expect(boardOf(page)).toBeVisible();
  room.push({ type: 'phase', phase: 'words' });
  return room;
}

const upButton = (page: Page) => page.getByRole('button', { name: STRINGS.scrollUp });
const downButton = (page: Page) => page.getByRole('button', { name: STRINGS.scrollDown });
const showResultButton = (page: Page) => page.getByRole('button', { name: STRINGS.showResult });

async function expectTarget(button: Locator): Promise<void> {
  const box = (await button.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  expect(box.height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
}

test('tells every phone to look at the tv during the words', async ({ browser }) => {
  // SYNC-01 AC 1: the round of KBXT ends on the words; Beto plays, Duda watches and Ana hosts, and each one's
  // phone leaves the board for "Olhe para a TV" and "As palavras da rodada estão passando lá".
  for (const me of [BETO, DUDA, ANA]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    try {
      const page = await context.newPage();
      await endRoundOnWords(page, me);

      await expect(page.getByRole('heading', { name: STRINGS.lookAtTvTitle })).toBeVisible();
      await expect(page.getByText(STRINGS.wordsOnTv)).toBeVisible();
      await expect(boardOf(page)).toHaveCount(0);
    } finally {
      await context.close();
    }
  }
});

test('shows the host the list controls during the words', async ({ page, browser }) => {
  // WORDCTL-01 AC 4: from 320 to 480 px, Ana, the host, sees ▲, ▼ and "VER RESULTADO", each 48 px or more,
  // and each sends its message; Beto, on his own phone, sees none of them.
  const room = await endRoundOnWords(page, ANA);
  for (const width of PHONE_WIDTHS) {
    await page.setViewportSize({ width, height: 844 });
    for (const button of [upButton(page), downButton(page), showResultButton(page)]) {
      await expect(button).toBeVisible();
      await expectTarget(button);
    }
  }

  await upButton(page).click();
  await downButton(page).click();
  await showResultButton(page).click();
  await expect.poll(() => room.sent().filter((msg) => msg.type !== 'hello')).toEqual([
    { type: 'scroll', direction: 'up' },
    { type: 'scroll', direction: 'down' },
    { type: 'show-result' },
  ]);

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    const beto = await context.newPage();
    await endRoundOnWords(beto, BETO);
    await expect(beto.getByRole('heading', { name: STRINGS.lookAtTvTitle })).toBeVisible();
    await expect(upButton(beto)).toHaveCount(0);
    await expect(downButton(beto)).toHaveCount(0);
    await expect(showResultButton(beto)).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('gives the list controls to the new host', async ({ page }) => {
  // WORDCTL-01 AC 12: Ana passes the host to Beto during the words, and Beto's phone gains ▲, ▼ and "VER RESULTADO".
  const room = await openWords(page, BETO);
  await expect(page.getByRole('heading', { name: STRINGS.lookAtTvTitle })).toBeVisible();
  await expect(showResultButton(page)).toHaveCount(0);

  room.push({ type: 'players', players: PLAYERS, hostId: BETO.id });

  await expect(upButton(page)).toBeVisible();
  await expect(downButton(page)).toBeVisible();
  await expect(showResultButton(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: STRINGS.lookAtTvTitle })).toBeVisible();
});

test('shows look at the tv after reconnecting on the words', async ({ page }) => {
  // SYNC-01 AC 5: Beto's socket drops during the words; the welcome of the reconnect, still on the words,
  // brings back "Olhe para a TV".
  const room = await openWords(page, BETO);
  await expect(page.getByRole('heading', { name: STRINGS.lookAtTvTitle })).toBeVisible();

  room.drop();

  await expect.poll(() => room.sent().filter((msg) => msg.type === 'hello').length, { timeout: 10_000 }).toBe(2);
  await expect(page.getByText(STRINGS.connected)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('heading', { name: STRINGS.lookAtTvTitle })).toBeVisible();
  await expect(page.getByText(STRINGS.wordsOnTv)).toBeVisible();
});
