import { PALETTE } from '@bwords/core';
import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { joinOnPhone } from './phones.ts';
import { openRound } from './round-room.ts';
import { DUDA } from './samples.ts';
import { createRoom, isType, joinPlayer } from './tv.ts';

const ORANGE = PALETTE[1]!;

/** The window of `phone-spectator.png` (SPEC-01 AC 4). */
const CAPTURE_VIEWPORT = { width: 390, height: 884 };
const CAPTURE_ROOM_PLAYERS = 4;

test('fits the four players of the capture without vertical scroll', async ({ page }) => {
  // SPEC-01 AC 4: at the capture's size Duda sees the whole list down to Duda's own row, and the page does not scroll.
  await page.setViewportSize(CAPTURE_VIEWPORT);
  const now = Date.now();
  await openRound(page, { me: DUDA, startsAt: now - 13_000, endsAt: now + 107_000 });
  const rows = page.getByRole('region', { name: STRINGS.playersInRoomTitle }).getByRole('listitem');
  await expect(rows).toHaveCount(CAPTURE_ROOM_PLAYERS);

  const lastRow = (await rows.last().boundingBox())!;
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  expect(lastRow.y + lastRow.height).toBeLessThanOrEqual(CAPTURE_VIEWPORT.height);
  expect(pageHeight).toBeLessThanOrEqual(CAPTURE_VIEWPORT.height);
});

test('shows the timer and the players without word counts', async ({ page }) => {
  // SPEC-01 AC 1-2: Duda joins while Ana's round runs, so Duda watches: the timer with its bar, the faded board
  // that ignores the finger, "Você entra na próxima rodada." and "JOGADORES NA SALA" with no word counts (AD-011).
  const tv = await createRoom();
  const ana = await joinPlayer(tv.code, 'Ana', ORANGE);
  try {
    ana.send({ type: 'start' });
    await ana.waitFor(isType('round-start'));
    await page.goto(`/${tv.code}`);
    await joinOnPhone(page, 'Duda');

    const board = page.getByRole('group', { name: STRINGS.board });
    await expect(board).toBeVisible();
    await expect(board).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByText(STRINGS.joinsNextRound)).toBeVisible();
    await expect(page.getByText(STRINGS.watching)).toBeVisible();
    await expect(page.getByRole('timer')).toHaveText(/^\d\d:\d\d$/);
    await expect(page.getByRole('progressbar')).toBeVisible();

    const players = page.getByRole('region', { name: STRINGS.playersInRoomTitle });
    await expect(players.getByRole('heading', { name: STRINGS.playersInRoomTitle })).toBeVisible();
    await expect(players.getByText(STRINGS.playerCount(2))).toBeVisible();
    await expect(players.getByRole('listitem')).toHaveCount(2);
    await expect(players.getByRole('listitem').nth(0)).toHaveText(`AAna${STRINGS.hostTag}`);
    await expect(players.getByRole('listitem').nth(1)).toHaveText(`DDuda${STRINGS.youTag}${STRINGS.spectatorTag}`);

    // A swipe over the board shows no word and no verdict.
    const box = (await board.boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.125, box.y + box.height * 0.125);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.875, box.y + box.height * 0.125, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByRole('status')).toHaveCount(0);
  } finally {
    ana.close();
    tv.close();
  }
});
