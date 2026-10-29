import { type CloseReason, PALETTE, type ServerMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { tokenKey } from '../src/state/room.ts';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom } from './fake-room.ts';
import { joinOnPhone } from './phones.ts';
import { ANA, BETO, lobbyWelcome, SAMPLE_CODE } from './samples.ts';
import { createRoom, joinPlayer, type NodePlayer, type TvRoom } from './tv.ts';

const ORANGE = PALETTE[1]!;

/** Ana hosts from Node; Beto joins on the phone under test. Ana learns Beto's id from `players`. */
async function betoInAnasRoom(page: Page): Promise<{ tv: TvRoom; ana: NodePlayer; betoId: string; close(): void }> {
  const tv = await createRoom();
  const ana = await joinPlayer(tv.code, 'Ana', ORANGE);
  await page.goto(`/${tv.code}`);
  await joinOnPhone(page, 'Beto');
  const players = await ana.waitFor((msg): msg is Extract<ServerMessage, { type: 'players' }> =>
    msg.type === 'players' && msg.players.some((p) => p.nickname === 'Beto'),
  );
  const betoId = players.players.find((p) => p.nickname === 'Beto')!.id;
  return {
    tv,
    ana,
    betoId,
    close() {
      ana.close();
      tv.close();
    },
  };
}

function savedToken(page: Page, code: string): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), tokenKey(code));
}

test('shows the kicked screen and forgets the token', async ({ page }) => {
  // EXIT-01 AC 1: `kicked` drops the token and shows "Você foi removido da sala" with "ENTRAR EM OUTRA SALA".
  const room = await betoInAnasRoom(page);
  try {
    expect(await savedToken(page, room.tv.code)).not.toBeNull();

    room.ana.send({ type: 'kick', playerId: room.betoId });

    await expect(page.getByRole('heading', { name: STRINGS.kicked })).toBeVisible();
    await expect(page.getByRole('button', { name: STRINGS.enterAnotherRoom })).toBeVisible();
    expect(await savedToken(page, room.tv.code)).toBeNull();
  } finally {
    room.close();
  }
});

test('shows who closed the room and forgets the token', async ({ page }) => {
  // EXIT-01 AC 2: `closed-by-host` drops the token and shows "Ana encerrou a sala" and "Obrigado por jogar!".
  const room = await betoInAnasRoom(page);
  try {
    room.ana.send({ type: 'close-room' });

    await expect(page.getByRole('heading', { name: STRINGS.hostClosedRoom('Ana') })).toBeVisible();
    await expect(page.getByText(STRINGS.thanksForPlaying)).toBeVisible();
    await expect(page.getByRole('button', { name: STRINGS.enterAnotherRoom })).toBeVisible();
    expect(await savedToken(page, room.tv.code)).toBeNull();
  } finally {
    room.close();
  }
});

for (const reason of ['idle', 'tv-gone'] satisfies CloseReason[]) {
  test(`says the room was closed on ${reason}`, async ({ page }) => {
    // EXIT-01 AC 3: the same screen as phone-room-closed.png, with "A sala foi encerrada" and no host named.
    await fakeRoom(page, (msg) => ({
      replies: msg.type === 'hello' ? [lobbyWelcome([ANA, BETO], BETO.id), { type: 'closed', reason }] : [],
      close: msg.type === 'hello',
    }));
    await page.goto(`/${SAMPLE_CODE}`);

    await expect(page.getByRole('heading', { name: STRINGS.roomClosed })).toBeVisible();
    await expect(page.getByText(STRINGS.thanksForPlaying)).toBeHidden();
    await expect(page.getByRole('button', { name: STRINGS.enterAnotherRoom })).toBeVisible();
  });
}

test('says the game opened elsewhere without reconnecting', async ({ page }) => {
  // EXIT-01 AC 4: the same token in a second tab takes the place of the first, which stays on "replaced".
  const room = await betoInAnasRoom(page);
  try {
    const second = await page.context().newPage();
    await second.goto(`/${room.tv.code}`);
    await expect(second.getByRole('heading', { name: STRINGS.playersTitle })).toBeVisible();

    await expect(page.getByRole('heading', { name: STRINGS.replaced })).toBeVisible();
    // Had the first tab reconnected, it would have replaced the second in turn.
    await expect(second.getByRole('heading', { name: STRINGS.playersTitle })).toBeVisible();
    await expect(second.getByRole('heading', { name: STRINGS.replaced })).toBeHidden();
  } finally {
    room.close();
  }
});

test('enter another room opens the code screen', async ({ page }) => {
  // EXIT-01 AC 5: from the kicked screen, "ENTRAR EM OUTRA SALA" leads to "Entrar numa sala" at `/`.
  const room = await betoInAnasRoom(page);
  try {
    room.ana.send({ type: 'kick', playerId: room.betoId });
    await expect(page.getByRole('heading', { name: STRINGS.kicked })).toBeVisible();

    await page.getByRole('button', { name: STRINGS.enterAnotherRoom }).click();

    await expect(page.getByRole('heading', { name: STRINGS.enterRoom })).toBeVisible();
    await expect(page.getByLabel(STRINGS.codeLetter(1))).toHaveValue('');
    await expect(page).toHaveURL('/');
  } finally {
    room.close();
  }
});
