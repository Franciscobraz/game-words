import { PALETTE } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { tokenKey } from '../src/state/room.ts';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { joinOnPhone } from './phones.ts';
import { createRoom, joinPlayer, type NodePlayer, type TvRoom } from './tv.ts';

const ORANGE = PALETTE[1]!;
const GREEN = PALETTE[3]!;

/** A room whose host is Ana (orange), joined from Node, so the phone under test is a participant. */
async function roomWithAna(): Promise<{ tv: TvRoom; ana: NodePlayer; close(): void }> {
  const tv = await createRoom();
  const ana = await joinPlayer(tv.code, 'Ana', ORANGE);
  return {
    tv,
    ana,
    close() {
      ana.close();
      tv.close();
    },
  };
}

function nicknameField(page: Page) {
  return page.getByLabel(STRINGS.nicknameLabel);
}

async function enter(page: Page): Promise<void> {
  await page.getByRole('button', { name: STRINGS.join }).click();
}

test('counts nickname characters as N/12', async ({ page }) => {
  // JOIN-01 AC 1, L-001: "Beto" is 4/12; 12 characters are 12/12 and a 13th does not fit.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);

    await nicknameField(page).fill('Beto');
    await expect(page.getByText('4/12', { exact: true })).toBeVisible();

    await nicknameField(page).fill('');
    await nicknameField(page).pressSequentially('A'.repeat(12));
    await expect(page.getByText('12/12', { exact: true })).toBeVisible();

    await nicknameField(page).pressSequentially('B');
    await expect(page.getByText('12/12', { exact: true })).toBeVisible();
    await expect(nicknameField(page)).toHaveValue('A'.repeat(12));
  } finally {
    room.close();
  }
});

test('updates the TV preview with the chosen color and nickname', async ({ page }) => {
  // JOIN-01 AC 4: the preview shows the circle in the color, the initial and the nickname.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    const preview = page.getByRole('region', { name: STRINGS.tvPreview });

    await page.getByRole('button', { name: STRINGS.colorOption(6) }).click();
    await nicknameField(page).fill('Beto');

    await expect(preview.locator('.player-avatar')).toHaveText('B');
    await expect(preview.locator('.player-avatar')).toHaveCSS('background-color', 'rgb(30, 136, 229)');
    await expect(preview).toContainText('Beto');
    await expect(page.getByRole('button', { name: STRINGS.colorOption(6) })).toHaveAttribute('aria-pressed', 'true');
  } finally {
    room.close();
  }
});

test('locks the colors of the other players with their names', async ({ page }) => {
  // JOIN-01 AC 3: Ana's orange is locked, with "Ana" below it.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    const orange = page.getByRole('button', { name: STRINGS.colorOption(2) });

    await expect(orange).toBeDisabled();
    await expect(page.locator('.color-picker__item').nth(1)).toContainText('Ana');
  } finally {
    room.close();
  }
});

test('shows the nickname length error', async ({ page }) => {
  // JOIN-01 AC 6: a 1-character nickname gets `bad-nickname`.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    await nicknameField(page).fill('B');

    await enter(page);

    await expect(page.getByRole('alert')).toHaveText(STRINGS.nicknameLength);
  } finally {
    room.close();
  }
});

test('shows nickname already in use', async ({ page }) => {
  // JOIN-01 AC 7: "ána" clashes with Ana, ignoring case and accents.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    await nicknameField(page).fill('ána');

    await enter(page);

    await expect(page.getByRole('alert')).toHaveText(STRINGS.nicknameTaken);
  } finally {
    room.close();
  }
});

test('names the player with the too-similar color', async ({ page }) => {
  // JOIN-01 AC 8: a custom color close to Ana's orange names Ana, and the picker stays open.
  const room = await roomWithAna();
  const caio = await joinPlayer(room.tv.code, 'Caio', GREEN);
  try {
    await page.goto(`/${room.tv.code}`);
    await nicknameField(page).fill('Beto');
    await page.getByLabel(STRINGS.customColor).fill('#fa8e05');

    await enter(page);

    await expect(page.getByRole('alert')).toHaveText(STRINGS.colorTooSimilar('Ana'));
    await expect(page.getByLabel(STRINGS.customColor)).toHaveValue('#fa8e05');
    await expect(page.locator('.color-picker__swatch--custom')).toHaveClass(/color-picker__swatch--selected/);
  } finally {
    caio.close();
    room.close();
  }
});

test('says the color is hard to see on the TV', async ({ page }) => {
  // JOIN-01 AC 9: a custom color too dark for the TV, and the picker stays open.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    await nicknameField(page).fill('Beto');
    await page.getByLabel(STRINGS.customColor).fill('#151515');

    await enter(page);

    await expect(page.getByRole('alert')).toHaveText(STRINGS.colorIllegible);
    await expect(page.locator('.color-picker__swatch--custom')).toHaveClass(/color-picker__swatch--selected/);
  } finally {
    room.close();
  }
});

test('says the room is full at ten players', async ({ page }) => {
  // JOIN-01 AC 10: the 11th phone gets `room-full`.
  const tv = await createRoom();
  const players: NodePlayer[] = [];
  try {
    for (const [index, color] of PALETTE.entries()) players.push(await joinPlayer(tv.code, `Jogador${index + 1}`, color));
    await page.goto(`/${tv.code}`);
    await nicknameField(page).fill('Beto');

    await enter(page);

    await expect(page.getByRole('alert')).toHaveText(STRINGS.roomFull);
  } finally {
    for (const player of players) player.close();
    tv.close();
  }
});

test('saves the token and shows the lobby after joined', async ({ page }) => {
  // JOIN-01 AC 11: `joined` saves the room's token and the lobby replaces the join screen.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    await nicknameField(page).fill('  Beto  ');

    await enter(page);

    await expect(page.getByRole('heading', { name: STRINGS.playersTitle })).toBeVisible();
    await expect(nicknameField(page)).toBeHidden();
    const token = await page.evaluate((key) => localStorage.getItem(key), tokenKey(room.tv.code));
    expect(token).toMatch(/^[\w-]{16,}$/);
  } finally {
    room.close();
  }
});

test('returns straight to the current phase with a saved token', async ({ page }) => {
  // ENTRY-01 AC 6: with a saved token, reloading `/<code>` in the lobby goes to the lobby, never through the join screen.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    await joinOnPhone(page, 'Beto');
    await page.addInitScript((label) => {
      new MutationObserver(() => {
        if (document.body?.innerText.includes(label)) sessionStorage.setItem('sawJoin', 'yes');
      }).observe(document, { subtree: true, childList: true, characterData: true });
    }, STRINGS.nicknameLabel);

    await page.reload();

    await expect(page.getByRole('heading', { name: STRINGS.playersTitle })).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem('sawJoin'))).toBeNull();
  } finally {
    room.close();
  }
});

test('names the host in the action color in the waiting line', async ({ page }) => {
  // ENTRY-01 AC 1, phone-join.png: "Aguardando Ana iniciar a partida…" with Ana in orange.
  const room = await roomWithAna();
  try {
    await page.goto(`/${room.tv.code}`);
    const waiting = page.locator('.join__waiting');

    await expect(waiting).toHaveText(`${STRINGS.waitingBeforeHost} Ana ${STRINGS.waitingAfterHost}`);
    await expect(waiting).toHaveText('Aguardando Ana iniciar a partida…');
    await expect(waiting.getByText('Ana', { exact: true })).toHaveCSS('color', 'rgb(255, 122, 0)');
  } finally {
    room.close();
  }
});
