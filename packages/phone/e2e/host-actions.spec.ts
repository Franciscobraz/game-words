import { PALETTE, type ServerMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { joinOnPhone, openPhone } from './phones.ts';
import { createRoom, isType, joinPlayer, type NodePlayer, type TvRoom } from './tv.ts';

const BLUE = PALETTE[4]!;

/** Ana hosts on the phone under test; Beto joins from Node and hears what the server does. */
async function hostWithBeto(page: Page): Promise<{ tv: TvRoom; beto: NodePlayer; close(): void }> {
  const tv = await createRoom();
  await page.goto(`/${tv.code}`);
  await joinOnPhone(page, 'Ana');
  const beto = await joinPlayer(tv.code, 'Beto', BLUE);
  await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();
  return {
    tv,
    beto,
    close() {
      beto.close();
      tv.close();
    },
  };
}

function sheet(page: Page) {
  return page.getByRole('dialog', { name: STRINGS.playerActions('Beto') });
}

async function openBetoActions(page: Page): Promise<void> {
  await page.getByRole('button', { name: STRINGS.playerActions('Beto') }).click();
  await expect(sheet(page)).toBeVisible();
}

/** A `players` broadcast with `hostId` as the host. */
function hostIs(hostId: string) {
  return (msg: ServerMessage): msg is Extract<ServerMessage, { type: 'players' }> => msg.type === 'players' && msg.hostId === hostId;
}

test('opens the actions of a player the host taps', async ({ page }) => {
  // HOST-01 AC 10: the sheet names Beto and offers "Tornar anfitrião", "Remover da sala" and "Cancelar".
  const room = await hostWithBeto(page);
  try {
    await openBetoActions(page);

    await expect(sheet(page)).toContainText('Beto');
    await expect(sheet(page).getByRole('button')).toHaveText([STRINGS.makeHost, STRINGS.removeFromRoom, STRINGS.cancel]);
    await expect(page.getByRole('button', { name: STRINGS.playerActions('Ana') })).toHaveCount(0);
  } finally {
    room.close();
  }
});

test('transfers the host and closes the sheet', async ({ page }) => {
  // HOST-01 AC 11: `transfer-host` with Beto's id; the sheet closes.
  const room = await hostWithBeto(page);
  try {
    await openBetoActions(page);

    await sheet(page).getByRole('button', { name: STRINGS.makeHost }).click();

    const players = await room.beto.waitFor(hostIs(room.beto.id));
    expect(players.hostId).toBe(room.beto.id);
    await expect(sheet(page)).toBeHidden();
  } finally {
    room.close();
  }
});

test('kicks only after the confirmation', async ({ page }) => {
  // HOST-01 AC 12: "Remover da sala" asks "Remover Beto? Ele perde os pontos."; only "Remover" sends `kick`.
  const room = await hostWithBeto(page);
  try {
    await openBetoActions(page);
    await sheet(page).getByRole('button', { name: STRINGS.removeFromRoom }).click();

    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toContainText('Remover Beto? Ele perde os pontos.');
    expect(room.beto.messages().some(isType('closed'))).toBe(false);
    await expect(page.getByRole('button', { name: STRINGS.playerActions('Beto') })).toBeVisible();

    await confirm.getByRole('button', { name: STRINGS.confirmKickAction }).click();

    const closed = await room.beto.waitFor(isType('closed'));
    expect(closed.reason).toBe('kicked');
    await expect(confirm).toBeHidden();
    await expect(page.getByRole('button', { name: STRINGS.playerActions('Beto') })).toBeHidden();
  } finally {
    room.close();
  }
});

test('cancel closes the sheet without sending', async ({ page }) => {
  // HOST-01 AC 13: "Cancelar" closes the sheet; the next message the host sends is the first the server acts on.
  const room = await hostWithBeto(page);
  try {
    await openBetoActions(page);

    await sheet(page).getByRole('button', { name: STRINGS.cancel }).click();
    await expect(sheet(page)).toBeHidden();

    // The server answers in order, so once this later change is back, anything "Cancelar" sent would be too.
    await page.getByRole('group', { name: STRINGS.boardLabel }).getByRole('button', { name: '5×5' }).click();
    await room.beto.waitFor((msg): msg is Extract<ServerMessage, { type: 'settings' }> => msg.type === 'settings' && msg.settings.size === 5);
    expect(room.beto.messages().some(isType('closed'))).toBe(false);
    expect(room.beto.messages().some(hostIs(room.beto.id))).toBe(false);
    await expect(page.getByRole('button', { name: STRINGS.playerActions('Beto') })).toBeVisible();
  } finally {
    room.close();
  }
});

test('swaps lobbies when the host changes', async ({ page, browser }) => {
  // HOST-01 AC 16: after `transfer-host`, Ana sees the participant lobby and Beto the host lobby.
  const tv = await createRoom();
  await page.goto(`/${tv.code}`);
  await joinOnPhone(page, 'Ana');
  // Opened after Ana joined, so Beto's phone starts on the next free color.
  const beto = await openPhone(browser, tv.code);
  try {
    await joinOnPhone(beto.page, 'Beto');
    await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();
    await expect(beto.page.getByText(STRINGS.waitingForHostToStart('Ana'))).toBeVisible();

    await openBetoActions(page);
    await sheet(page).getByRole('button', { name: STRINGS.makeHost }).click();

    await expect(page.getByText(STRINGS.waitingForHostToStart('Beto'))).toBeVisible();
    await expect(page.getByText(STRINGS.youAreHost)).toBeHidden();
    await expect(beto.page.getByText(STRINGS.youAreHost)).toBeVisible();
    await expect(beto.page.getByRole('button', { name: STRINGS.startMatch })).toBeVisible();
  } finally {
    await beto.close();
    tv.close();
  }
});
