import { PALETTE } from '@bwords/core';
import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { joinOnPhone } from './phones.ts';
import { createRoom, joinPlayer } from './tv.ts';

const ORANGE = PALETTE[1]!;
const GREEN = PALETTE[3]!;

test('shows the participant lobby with the player card, the rules and the players', async ({ page }) => {
  // LOBBY-01 AC 1, 3: Beto's card, the rule chips, Ana tagged as host and Beto as "VOCÊ".
  const tv = await createRoom();
  const ana = await joinPlayer(tv.code, 'Ana', ORANGE);
  try {
    await page.goto(`/${tv.code}`);
    await joinOnPhone(page, 'Beto');

    await expect(page.getByRole('region', { name: STRINGS.youLabel })).toContainText(`Beto${STRINGS.youTag}`);
    await expect(page.getByText(STRINGS.boardChip(4))).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Ana' })).toContainText(STRINGS.hostTag);
    await expect(page.getByRole('listitem').filter({ hasText: 'Beto' })).toContainText(STRINGS.youTag);
  } finally {
    ana.close();
    tv.close();
  }
});

test('updates the rule chips when the host changes a setting', async ({ page }) => {
  // LOBBY-01 AC 6: the host picks 5x5 and the participant's chip follows the server's `settings`.
  const tv = await createRoom();
  const ana = await joinPlayer(tv.code, 'Ana', ORANGE);
  try {
    await page.goto(`/${tv.code}`);
    await joinOnPhone(page, 'Beto');
    await expect(page.getByText(STRINGS.boardChip(4))).toBeVisible();

    ana.send({ type: 'settings', patch: { size: 5 } });

    await expect(page.getByText(STRINGS.boardChip(5))).toBeVisible();
    await expect(page.getByText(STRINGS.boardChip(4))).toBeHidden();
  } finally {
    ana.close();
    tv.close();
  }
});

test('updates the list, the count and the host name on players', async ({ page }) => {
  // LOBBY-01 AC 7: a newcomer and a new host reach the list, "N na sala" and the waiting message.
  const tv = await createRoom();
  const ana = await joinPlayer(tv.code, 'Ana', ORANGE);
  try {
    await page.goto(`/${tv.code}`);
    await joinOnPhone(page, 'Beto');
    await expect(page.getByText(STRINGS.playersInRoom(2))).toBeVisible();
    await expect(page.getByText(STRINGS.waitingForHostToStart('Ana'))).toBeVisible();

    const caio = await joinPlayer(tv.code, 'Caio', GREEN);
    await expect(page.getByText(STRINGS.playersInRoom(3))).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Caio' })).toBeVisible();

    ana.send({ type: 'transfer-host', playerId: caio.id });
    await expect(page.getByText(STRINGS.waitingForHostToStart('Caio'))).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Caio' })).toContainText(STRINGS.hostTag);
    caio.close();
  } finally {
    ana.close();
    tv.close();
  }
});
