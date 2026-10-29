import { PALETTE, type ServerMessage, type Settings } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { joinOnPhone, openPhone } from './phones.ts';
import { createRoom, isType, joinPlayer, type NodePlayer, type TvRoom } from './tv.ts';

const BLUE = PALETTE[4]!;

type SettingsMessage = Extract<ServerMessage, { type: 'settings' }>;

/** The phone under test joins first, so Ana is the host; Beto joins from Node and hears every `settings`. */
async function hostRoom(page: Page): Promise<{ tv: TvRoom; beto: NodePlayer; close(): void }> {
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

/** A `settings` broadcast whose settings include `expected`. */
function settingsWith(expected: Partial<Settings>) {
  return (msg: ServerMessage): msg is SettingsMessage =>
    msg.type === 'settings' && Object.entries(expected).every(([key, value]) => msg.settings[key as keyof Settings] === value);
}

function option(page: Page, group: string, label: string) {
  return page.getByRole('group', { name: group }).getByRole('button', { name: label });
}

test('sends the chosen board size', async ({ page }) => {
  // HOST-01 AC 2: 6×6 goes out as `settings` with `size: 6`, and the panel follows the server.
  const room = await hostRoom(page);
  try {
    await option(page, STRINGS.boardLabel, '6×6').click();

    const sent = await room.beto.waitFor(settingsWith({ size: 6 }));
    expect(sent.settings.size).toBe(6);
    await expect(option(page, STRINGS.boardLabel, '6×6')).toHaveAttribute('aria-pressed', 'true');
    await expect(option(page, STRINGS.boardLabel, '4×4')).toHaveAttribute('aria-pressed', 'false');
  } finally {
    room.close();
  }
});

test('steps the round time and the rounds within their limits', async ({ page }) => {
  // HOST-01 AC 3-5: + moves 30 s from 2:00 up to 3:00, where + is off; rounds start at the server's 1, where − is off, and stop at 5.
  const room = await hostRoom(page);
  const increaseTime = page.getByRole('button', { name: STRINGS.increase(STRINGS.roundTime) });
  const decreaseRounds = page.getByRole('button', { name: STRINGS.decrease(STRINGS.rounds) });
  const increaseRounds = page.getByRole('button', { name: STRINGS.increase(STRINGS.rounds) });
  const rounds = page.getByLabel(STRINGS.rounds, { exact: true });
  try {
    await increaseTime.click();
    await room.beto.waitFor(settingsWith({ seconds: 150 }));
    await expect(page.getByLabel(STRINGS.roundTime, { exact: true })).toHaveText('2:30');

    await increaseTime.click();
    await expect(page.getByLabel(STRINGS.roundTime, { exact: true })).toHaveText('3:00');
    await expect(increaseTime).toBeDisabled();

    await expect(rounds).toHaveText('1');
    await expect(decreaseRounds).toBeDisabled();
    await increaseRounds.click();
    await room.beto.waitFor(settingsWith({ rounds: 2 }));
    await expect(rounds).toHaveText('2');
    await expect(decreaseRounds).toBeEnabled();

    for (const expected of ['3', '4', '5']) {
      await increaseRounds.click();
      await expect(rounds).toHaveText(expected);
    }
    await expect(increaseRounds).toBeDisabled();
  } finally {
    room.close();
  }
});

test('sends the minimum word length', async ({ page }) => {
  // HOST-01 AC 6: 4 in "MÍN. LETRAS" goes out as `minLength: 4`.
  const room = await hostRoom(page);
  try {
    await option(page, STRINGS.minLetters, '4').click();

    const sent = await room.beto.waitFor(settingsWith({ minLength: 4 }));
    expect(sent.settings.minLength).toBe(4);
    await expect(option(page, STRINGS.minLetters, '4')).toHaveAttribute('aria-pressed', 'true');
  } finally {
    room.close();
  }
});

test('toggles the profanity filter and fast mode', async ({ page }) => {
  // HOST-01 AC 7: each switch sends its value inverted (filter on → off, fast mode off → on).
  const room = await hostRoom(page);
  const filter = page.getByRole('switch', { name: STRINGS.filterProfanity });
  const fastMode = page.getByRole('switch', { name: STRINGS.fastMode });
  try {
    await expect(filter).toHaveAttribute('aria-checked', 'true');
    await expect(fastMode).toHaveAttribute('aria-checked', 'false');

    await filter.click();
    await room.beto.waitFor(settingsWith({ filterProfanity: false }));
    await expect(filter).toHaveAttribute('aria-checked', 'false');

    await fastMode.click();
    await room.beto.waitFor(settingsWith({ fastMode: true }));
    await expect(fastMode).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText(STRINGS.fastModeHint)).toBeVisible();
  } finally {
    room.close();
  }
});

test('sends the volume on release and the mute toggle', async ({ page }) => {
  // HOST-01 AC 8: dragging the slider from the server's 100 to its left end and letting go sends volume 0; the mute button sends `muted`.
  const room = await hostRoom(page);
  const slider = page.getByLabel(STRINGS.tvVolume);
  try {
    await expect(slider).toHaveValue('100');
    // Clear of the sticky start button at the bottom of the screen.
    await slider.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    const box = await slider.boundingBox();
    if (box === null) throw new Error('The volume slider is not on screen');
    const middle = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, middle);
    await page.mouse.down();
    await page.mouse.move(box.x - 20, middle, { steps: 5 });
    await page.mouse.up();

    const sent = await room.beto.waitFor(settingsWith({ volume: 0 }));
    expect(sent.settings.volume).toBe(0);
    await expect(slider).toHaveValue('0');

    await page.getByRole('button', { name: STRINGS.muteTv }).click();
    await room.beto.waitFor(settingsWith({ muted: true }));
    await expect(page.getByRole('button', { name: STRINGS.muteTv })).toHaveAttribute('aria-pressed', 'true');
  } finally {
    room.close();
  }
});

test('offers Portugues (BR) as the only dictionary', async ({ page }) => {
  // HOST-01 AC 9.
  const room = await hostRoom(page);
  try {
    const dictionary = page.getByLabel(STRINGS.dictionary);

    await expect(dictionary.locator('option')).toHaveText([STRINGS.dictionaryPtBr]);
    await expect(dictionary).toHaveValue('pt-BR');
  } finally {
    room.close();
  }
});

test('start sends start', async ({ page, browser }) => {
  // HOST-01 AC 14: "INICIAR PARTIDA" sends `start`; the server starts the countdown and every phone leaves the lobby.
  const room = await hostRoom(page);
  const caio = await openPhone(browser, room.tv.code);
  try {
    await joinOnPhone(caio.page, 'Caio');
    await expect(caio.page.getByRole('heading', { name: STRINGS.playersTitle })).toBeVisible();

    await page.getByRole('button', { name: STRINGS.startMatch }).click();

    const roundStart = await room.beto.waitFor(isType('round-start'));
    expect(roundStart.index).toBe(0);
    await expect(page.getByRole('button', { name: STRINGS.startMatch })).toBeHidden();
    await expect(caio.page.getByRole('heading', { name: STRINGS.playersTitle })).toBeHidden();
  } finally {
    await caio.close();
    room.close();
  }
});
