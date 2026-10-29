import type { PlayerInfo } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import { ANA, ANA_FOUND, BETO, DUDA, resultsWelcome, SAMPLE_CODE, sampleResults, SCORED_PLAYERS } from './samples.ts';

/** Opens KBXT on the phone of `me` in the results of round 1 of 3, as the captures draw them. */
async function openResults(page: Page, me: PlayerInfo, found: string[] = []): Promise<FakeRoom> {
  const room = await fakeRoom(page, (msg) => ({
    replies: msg.type === 'hello' ? [resultsWelcome(SCORED_PLAYERS, me.id, found), sampleResults()] : [],
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.lookAtTv)).toBeVisible();
  return room;
}

const sentTypes = (room: FakeRoom) => room.sent().map((msg) => msg.type);

test('shows the round card, the words and the quick scoreboard', async ({ page }) => {
  // RES-01 AC 2-6: Ana's round 1 of 3: +18 pts, 32 in all, 1º; CORACOES only hers, CASA, QUERO and LUA in common;
  // the quick scoreboard from Ana's 32 down, with Duda last as "Esp.".
  await openResults(page, ANA, ANA_FOUND);

  await expect(page.getByText(`${STRINGS.resultRound(1, 3)}${STRINGS.resultTag}`)).toBeVisible();
  const card = page.getByRole('region', { name: STRINGS.roundPerformance });
  await expect(card.getByText(STRINGS.gainedPoints(18))).toBeVisible();
  await expect(card.getByText(STRINGS.points(32))).toBeVisible();
  await expect(card.getByRole('img', { name: STRINGS.placeBadge(1) })).toHaveText(STRINGS.ordinal(1));
  await expect(card.getByText(STRINGS.yourPlace(1))).toBeVisible();

  const words = page.getByRole('region', { name: STRINGS.myFoundWords(4) }).getByRole('listitem');
  await expect(words).toHaveText([
    `CORACOES(corações)${STRINGS.uniqueBonus(12)}${STRINGS.gainedPoints(12)}${STRINGS.basePoints(6)}`,
    `QUERO${STRINGS.shared}${STRINGS.gainedPoints(3)}`,
    `CASA${STRINGS.shared}${STRINGS.gainedPoints(2)}`,
    `LUA${STRINGS.shared}${STRINGS.gainedPoints(1)}`,
  ]);

  const scoreboard = page.getByRole('region', { name: STRINGS.quickScoreboard }).getByRole('listitem');
  await expect(scoreboard).toHaveText(['1ºAAna32', '2ºBBeto25', '3ºCCaio16', `DDuda${STRINGS.spectatorShort}`]);
});

test('next round button names the round and the last one shows the podium', async ({ page }) => {
  // RES-01 AC 7: after round 1 of 3 the host's button reads "PRÓXIMA RODADA (2 DE 3)"; after the last, "VER PÓDIO";
  // both send `next`.
  const room = await openResults(page, ANA, ANA_FOUND);

  await page.getByRole('button', { name: STRINGS.nextRound(2, 3) }).click();
  await expect.poll(() => sentTypes(room)).toEqual(['hello', 'next']);

  room.push(sampleResults(2, true));
  await expect(page.getByText(`${STRINGS.resultRound(3, 3)}${STRINGS.resultTag}`)).toBeVisible();
  await expect(page.getByRole('button', { name: /PRÓXIMA RODADA/ })).toHaveCount(0);
  await page.getByRole('button', { name: STRINGS.seePodium }).click();
  await expect.poll(() => sentTypes(room)).toEqual(['hello', 'next', 'next']);
});

test('goes back to the lobby from the results only after the confirmation', async ({ page }) => {
  // RES-01 AC 8: "Voltar ao Lobby" asks "Cancelar a partida? O placar será zerado."; "Cancelar" sends nothing,
  // confirming sends `back-to-lobby`.
  const room = await openResults(page, ANA, ANA_FOUND);

  await page.getByRole('button', { name: STRINGS.backToLobbyTitle }).click();
  const dialog = page.getByRole('alertdialog', { name: STRINGS.confirmCancelMatch });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: STRINGS.cancel }).click();
  await expect(dialog).toBeHidden();
  await page.waitForTimeout(300);
  expect(sentTypes(room)).toEqual(['hello']);

  await page.getByRole('button', { name: STRINGS.backToLobbyTitle }).click();
  await dialog.getByRole('button', { name: STRINGS.backToLobbyTitle }).click();

  await expect(dialog).toBeHidden();
  await expect.poll(() => sentTypes(room)).toEqual(['hello', 'back-to-lobby']);
});

test('non-host waits for the host to advance', async ({ page }) => {
  // RES-01 AC 9: Beto sees "Aguardando Ana avançar…" in place of the host's buttons.
  await openResults(page, BETO);

  await expect(page.getByText(STRINGS.waitingForHostToAdvance(ANA.nickname))).toBeVisible();
  await expect(page.getByRole('button', { name: STRINGS.nextRound(2, 3) })).toHaveCount(0);
  await expect(page.getByRole('button', { name: STRINGS.backToLobbyTitle })).toHaveCount(0);
  await expect(page.getByRole('button', { name: STRINGS.hostMenu })).toHaveCount(0);
});

test('spectator sees the next round message', async ({ page }) => {
  // RES-01 AC 10: Duda watched the round, so "Você joga na próxima rodada!" takes the place of the points and the words;
  // the quick scoreboard stays.
  await openResults(page, DUDA);

  await expect(page.getByText(STRINGS.playsNextRound)).toBeVisible();
  await expect(page.getByRole('region', { name: STRINGS.roundPerformance })).toHaveCount(0);
  await expect(page.getByText(/MINHAS PALAVRAS ENCONTRADAS/)).toHaveCount(0);
  await expect(page.getByRole('region', { name: STRINGS.quickScoreboard })).toBeVisible();
});
