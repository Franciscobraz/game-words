import { PALETTE, type PlayerInfo, type ServerMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import {
  ANA,
  ANA_FOUND,
  BETO,
  DUDA,
  PODIUM_PLAYERS,
  resultsWelcome,
  SAMPLE_CODE,
  SAMPLE_PODIUM,
  sampleResults,
  SCORED_PLAYERS,
} from './samples.ts';

interface PodiumOptions {
  /** The players once the match ended; the captures' four by default. */
  players?: PlayerInfo[];
  podium?: ServerMessage;
  /** The words the phone found in the last round. */
  found?: string[];
}

/**
 * Opens KBXT on the phone of `me` in the results of the last round, which the phone
 * sums (AD-007), and then the podium: the new scores and wins, then `podium`.
 */
async function openPodium(page: Page, me: PlayerInfo, options: PodiumOptions = {}): Promise<FakeRoom> {
  const { players = PODIUM_PLAYERS, podium = SAMPLE_PODIUM, found = [] } = options;
  const room = await fakeRoom(page, (msg) => ({
    replies:
      msg.type === 'hello'
        ? [
            resultsWelcome(SCORED_PLAYERS, me.id, found, 2),
            sampleResults(2, true),
            { type: 'players', players, hostId: ANA.id },
            podium,
          ]
        : [],
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByRole('region', { name: STRINGS.tableRanking })).toBeVisible();
  return room;
}

const sentTypes = (room: FakeRoom) => room.sent().map((msg) => msg.type);
const confetti = (page: Page) => page.locator('.confetti');

test('shows the personal card, the performance and the ranking', async ({ page }) => {
  // POD-01 AC 2, 4, 5, 7: Ana is 1st with 46 points and 3 wins; she found 4 words, CORACOES the longest
  // ("(corações)", +12 PTS, 8 letters, one tile per letter); the ranking follows the podium with Duda last.
  await openPodium(page, ANA, { found: ANA_FOUND });

  const card = page.getByRole('region', { name: STRINGS.yourFinalPlace(1) });
  await expect(card.getByRole('heading', { name: STRINGS.yourFinalPlace(1) })).toBeVisible();
  await expect(card.getByText(STRINGS.points(46))).toBeVisible();
  await expect(card.getByText(STRINGS.winsLabel(3))).toBeVisible();

  const performance = page.getByRole('region', { name: STRINGS.yourPerformance });
  await expect(performance.getByText(STRINGS.wordsFound)).toBeVisible();
  await expect(performance.locator('.match-performance__count')).toHaveText('4');
  const longest = page.getByRole('region', { name: STRINGS.longestWord });
  await expect(longest.getByText('(corações)')).toBeVisible();
  await expect(longest.getByText(STRINGS.gainedPointsUpper(12))).toBeVisible();
  await expect(longest.getByText(STRINGS.letterCount(8))).toBeVisible();
  await expect(longest.getByRole('listitem')).toHaveText(['C', 'O', 'R', 'A', 'C', 'O', 'E', 'S']);

  const ranking = page.getByRole('region', { name: STRINGS.tableRanking });
  await expect(ranking.getByText(STRINGS.playerCount(4))).toBeVisible();
  await expect(ranking.getByRole('listitem')).toHaveText([
    new RegExp(`^1AAna.*${STRINGS.youTag}.*${STRINGS.winsInSession(3)}46${STRINGS.pointsUnit}$`),
    new RegExp(`^2BBeto${STRINGS.winsInSession(1)}32${STRINGS.pointsUnit}$`),
    new RegExp(`^3CCaio${STRINGS.disconnectedNote.replace(/[()]/g, '\\$&')}${STRINGS.winsInSession(0)}18${STRINGS.pointsUnit}$`),
    new RegExp(`^4DDuda.*${STRINGS.spectatorLong.replace(/[()]/g, '\\$&')}0${STRINGS.pointsUnit}$`),
  ]);
});

test('shows confetti only for first place', async ({ page, browser }) => {
  // POD-01 AC 3: Ana, 1st, gets the confetti; Beto, 2nd, on his own phone, does not.
  await openPodium(page, ANA);
  await expect(confetti(page)).toHaveCount(1);
  await expect(confetti(page).locator('.confetti__piece').first()).toBeAttached();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const beto = await context.newPage();
    await openPodium(beto, BETO);
    await expect(beto.getByRole('heading', { name: STRINGS.yourFinalPlace(2) })).toBeVisible();
    await expect(confetti(beto)).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('scrolls the whole ranking above the fixed buttons', async ({ page }) => {
  // POD-01 AC 8: with 10 players on a 568 px tall phone, scrolling to the end shows the last player whole,
  // above the host's fixed buttons, which stay on screen.
  await page.setViewportSize({ width: 390, height: 568 });
  const players = Array.from({ length: 10 }, (_, i) => ({
    ...ANA,
    id: i === 0 ? ANA.id : `p${i + 10}`,
    nickname: i === 0 ? ANA.nickname : `Jogador${i + 1}`,
    color: PALETTE[i % PALETTE.length]!,
    score: 100 - i * 5,
  }));
  const podium: ServerMessage = { type: 'podium', ranking: players.map((p) => ({ playerId: p.id, score: p.score })) };
  await openPodium(page, ANA, { players, podium });

  const playAgain = page.getByRole('button', { name: STRINGS.playAgain });
  await expect(playAgain).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

  const last = page.getByRole('region', { name: STRINGS.tableRanking }).getByRole('listitem').last();
  await expect(last).toContainText('Jogador10');
  await expect(last).toBeInViewport({ ratio: 1 });
  await expect(playAgain).toBeInViewport();
  const lastBox = (await last.boundingBox())!;
  const actionsBox = (await page.locator('.podium-host-actions').boundingBox())!;
  expect(lastBox.y + lastBox.height).toBeLessThanOrEqual(actionsBox.y);
});

test('play again sends play-again', async ({ page }) => {
  // POD-01 AC 9.
  const room = await openPodium(page, ANA);

  await page.getByRole('button', { name: STRINGS.playAgain }).click();

  await expect.poll(() => sentTypes(room)).toEqual(['hello', 'play-again']);
});

test('back to lobby from the podium sends back-to-lobby', async ({ page }) => {
  // POD-01 AC 10: on the podium the match is over, so "Voltar ao Lobby" acts at once.
  const room = await openPodium(page, ANA);

  await page.getByRole('button', { name: STRINGS.backToLobbyTitle }).click();

  await expect.poll(() => sentTypes(room)).toEqual(['hello', 'back-to-lobby']);
});

test('closes the room from the podium only after the confirmation', async ({ page }) => {
  // POD-01 AC 11: "ENCERRAR SALA" asks first; "Cancelar" sends nothing, confirming sends `close-room`.
  const room = await openPodium(page, ANA);

  await page.getByRole('button', { name: STRINGS.closeRoomUpper }).click();
  const dialog = page.getByRole('alertdialog', { name: STRINGS.confirmCloseRoom });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: STRINGS.cancel }).click();
  await expect(dialog).toBeHidden();
  await page.waitForTimeout(300);
  expect(sentTypes(room)).toEqual(['hello']);

  await page.getByRole('button', { name: STRINGS.closeRoomUpper }).click();
  await dialog.getByRole('button', { name: STRINGS.closeRoom }).click();

  await expect.poll(() => sentTypes(room)).toEqual(['hello', 'close-room']);
});

test('non-host waits for the host to decide', async ({ page }) => {
  // POD-01 AC 12: Beto sees "Aguardando Ana decidir…" in place of the three buttons.
  await openPodium(page, BETO);

  await expect(page.getByText(STRINGS.waitingForHostToDecide(ANA.nickname))).toBeVisible();
  await expect(page.getByRole('button', { name: STRINGS.playAgain })).toHaveCount(0);
  await expect(page.getByRole('button', { name: STRINGS.backToLobbyTitle })).toHaveCount(0);
  await expect(page.getByRole('button', { name: STRINGS.closeRoomUpper })).toHaveCount(0);
});

test('a spectator of the whole match sees only the ranking', async ({ page }) => {
  // POD-01 AC 13: Duda watched the whole match: only the ranking and "Você joga na próxima partida".
  await openPodium(page, DUDA);

  await expect(page.getByText(STRINGS.playsNextMatch)).toBeVisible();
  await expect(page.getByRole('region', { name: STRINGS.tableRanking })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Você ficou em/ })).toHaveCount(0);
  await expect(page.getByRole('region', { name: STRINGS.yourPerformance })).toHaveCount(0);
  await expect(page.getByText(STRINGS.waitingForHostToDecide(ANA.nickname))).toHaveCount(0);
  await expect(confetti(page)).toHaveCount(0);
});
