import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, PICTURE_WIDTH, uncapturedPath } from './fake-room.ts';
import { boardOf } from './round-room.ts';
import { ANA, BETO, CAIO, DUDA, roundWelcome, SAMPLE_CODE, sampleHashFrame, sampleRound } from './samples.ts';
import { SCREEN_STATES } from './screen-states.ts';

/**
 * Pictures at 390 px of the screens and states no capture draws (T42, UI-01), in
 * `captures/uncaptured/`, for the user to judge; the approved ones become captures
 * of the next milestones.
 */

/** The page's clock: frozen where a state would otherwise move on. */
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0);

/** Screens whose buttons stick to the foot of the page: the window is as tall as the page, as in the captures. */
async function shootWholePage(page: Page, name: string): Promise<void> {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: PICTURE_WIDTH, height });
  await page.screenshot({ path: uncapturedPath(name), animations: 'disabled' });
}

const FROM_STATES: { state: string; picture: string; wholePage: boolean }[] = [
  { state: 'preferences sheet', picture: 'phone-preferences', wholePage: false },
  { state: 'time up', picture: 'phone-time-up', wholePage: false },
  { state: 'round result of a participant', picture: 'phone-round-result-participant', wholePage: true },
  { state: 'round result of a spectator', picture: 'phone-round-result-spectator', wholePage: true },
  { state: 'podium of a participant', picture: 'phone-podium-participant', wholePage: true },
  { state: 'podium of a spectator', picture: 'phone-podium-spectator', wholePage: true },
  { state: 'room closed for inactivity', picture: 'phone-room-closed-idle', wholePage: false },
  { state: 'opened in another tab', picture: 'phone-replaced', wholePage: false },
];

for (const { state, picture, wholePage } of FROM_STATES) {
  test(picture, async ({ page }) => {
    const screen = SCREEN_STATES.find((s) => s.name === state);
    if (screen === undefined) throw new Error(`No screen state "${state}"`);
    await screen.open(page);
    if (wholePage) await shootWholePage(page, picture);
    else await page.screenshot({ path: uncapturedPath(picture), animations: 'disabled' });
  });
}

/** Beto in a round of the sample board; after the first connection the scripted server is out of reach. */
async function openRoundThatDrops(page: Page) {
  await page.clock.install({ time: NOW });
  const frame = await sampleHashFrame();
  let connections = 0;
  const room = await fakeRoom(page, (msg) => {
    if (msg.type !== 'hello') return { replies: [] };
    connections += 1;
    if (connections > 1) return { replies: [], close: true };
    return { replies: [roundWelcome([ANA, BETO, CAIO, DUDA], BETO.id, sampleRound(NOW - 13_000, NOW + 107_000), ['lua', 'quero']), frame] };
  });
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(boardOf(page)).toBeVisible();
  return room;
}

test('phone-reconnecting', async ({ page }) => {
  const room = await openRoundThatDrops(page);
  room.drop();
  await expect(page.getByText(STRINGS.reconnecting)).toBeVisible();
  await page.screenshot({ path: uncapturedPath('phone-reconnecting'), animations: 'disabled' });
});

test('phone-offline', async ({ page }) => {
  const room = await openRoundThatDrops(page);
  room.drop();
  await expect(page.getByText(STRINGS.reconnecting)).toBeVisible();
  await page.clock.runFor(31_000);
  await expect(page.getByRole('button', { name: STRINGS.tryAgain })).toBeVisible();
  await page.screenshot({ path: uncapturedPath('phone-offline'), animations: 'disabled' });
});

test('phone-confirm-kick', async ({ page }) => {
  const screen = SCREEN_STATES.find((s) => s.name === 'host actions sheet');
  await screen?.open(page);
  await page.getByRole('button', { name: STRINGS.removeFromRoom }).click();
  await expect(page.getByText(STRINGS.confirmKick('Beto'))).toBeVisible();
  await page.screenshot({ path: uncapturedPath('phone-confirm-kick'), animations: 'disabled' });
});

test('phone-confirm-close-room', async ({ page }) => {
  const screen = SCREEN_STATES.find((s) => s.name === 'host lobby');
  await screen?.open(page);
  await page.getByRole('button', { name: STRINGS.hostMenu }).click();
  await page.getByRole('menuitem', { name: STRINGS.closeRoom }).click();
  await expect(page.getByText(STRINGS.confirmCloseRoom)).toBeVisible();
  await page.screenshot({ path: uncapturedPath('phone-confirm-close-room'), animations: 'disabled' });
});

test('phone-confirm-cancel-round', async ({ page }) => {
  const screen = SCREEN_STATES.find((s) => s.name === 'board of the host');
  await screen?.open(page);
  await page.getByRole('button', { name: STRINGS.hostMenu }).click();
  await page.getByRole('menuitem', { name: STRINGS.backToLobby }).click();
  await expect(page.getByText(STRINGS.confirmCancelRound)).toBeVisible();
  await page.screenshot({ path: uncapturedPath('phone-confirm-cancel-round'), animations: 'disabled' });
});
