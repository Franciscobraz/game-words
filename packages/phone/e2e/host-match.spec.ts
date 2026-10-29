import { PALETTE, type ServerMessage } from '@bwords/core';
import { type Browser, expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { joinOnPhone, openPhone, type Phone } from './phones.ts';
import { createRoom, isType, joinPlayer, type NodePlayer, type TvRoom } from './tv.ts';

const BLUE = PALETTE[4]!;

/** Ana hosts on the phone under test, Caio plays on a second phone and Beto from Node hears the server. */
async function matchRoom(page: Page, browser: Browser): Promise<{ tv: TvRoom; beto: NodePlayer; caio: Phone; close(): Promise<void> }> {
  const tv = await createRoom();
  await page.goto(`/${tv.code}`);
  await joinOnPhone(page, 'Ana');
  const beto = await joinPlayer(tv.code, 'Beto', BLUE);
  const caio = await openPhone(browser, tv.code);
  await joinOnPhone(caio.page, 'Caio');
  await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();
  return {
    tv,
    beto,
    caio,
    async close() {
      await caio.close();
      beto.close();
      tv.close();
    },
  };
}

const hostMenu = (page: Page) => page.getByRole('button', { name: STRINGS.hostMenu });
const board = (page: Page) => page.getByRole('group', { name: STRINGS.board });

/** How many times the server sent Beto a `welcome` in the lobby: once on joining, once more on `back-to-lobby`. */
function lobbyWelcomes(beto: NodePlayer): number {
  return beto.messages().filter((msg: ServerMessage) => msg.type === 'welcome' && msg.phase === 'lobby').length;
}

test('shows the host menu during the countdown and the round', async ({ page, browser }) => {
  // HOSTPLAY-01 AC 1: in the countdown and in the round, the host has the menu (⋮) with "Voltar ao lobby"; Caio has none.
  const room = await matchRoom(page, browser);
  try {
    await page.getByRole('button', { name: STRINGS.startMatch }).click();

    await expect(page.getByText(STRINGS.getReady)).toBeVisible();
    await expect(hostMenu(page)).toBeVisible();
    await expect(caio(room).getByText(STRINGS.getReady)).toBeVisible();
    await expect(hostMenu(caio(room))).toHaveCount(0);

    await expect(board(page)).toBeVisible();
    await expect(board(caio(room))).toBeVisible();
    await expect(hostMenu(caio(room))).toHaveCount(0);
    await hostMenu(page).click();
    await expect(page.getByRole('menuitem', { name: STRINGS.backToLobby })).toBeVisible();
  } finally {
    await room.close();
  }
});

test('goes back to the lobby only after the confirmation', async ({ page, browser }) => {
  // HOSTPLAY-01 AC 2: "Voltar ao lobby" asks "Cancelar a rodada? O placar será zerado."; "Cancelar" keeps the round,
  // confirming sends `back-to-lobby` and every phone goes back to the lobby.
  const room = await matchRoom(page, browser);
  try {
    await page.getByRole('button', { name: STRINGS.startMatch }).click();
    await room.beto.waitFor(isType('round-start'));
    await expect(board(page)).toBeVisible();
    const welcomesBefore = lobbyWelcomes(room.beto);

    await hostMenu(page).click();
    await page.getByRole('menuitem', { name: STRINGS.backToLobby }).click();
    const dialog = page.getByRole('alertdialog', { name: STRINGS.confirmCancelRound });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: STRINGS.cancel }).click();

    await expect(dialog).toBeHidden();
    await expect(board(page)).toBeVisible();
    await page.waitForTimeout(500);
    expect(lobbyWelcomes(room.beto)).toBe(welcomesBefore);

    await hostMenu(page).click();
    await page.getByRole('menuitem', { name: STRINGS.backToLobby }).click();
    await dialog.getByRole('button', { name: STRINGS.backToLobby }).click();

    await expect.poll(() => lobbyWelcomes(room.beto)).toBe(welcomesBefore + 1);
    await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();
    await expect(caio(room).getByRole('heading', { name: STRINGS.playersTitle })).toBeVisible();
    await expect(board(caio(room))).toHaveCount(0);
  } finally {
    await room.close();
  }
});

function caio(room: { caio: Phone }): Page {
  return room.caio.page;
}
