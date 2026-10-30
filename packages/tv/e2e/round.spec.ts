import { COUNTDOWN_MS } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { ANA, BETO, CAIO, roundWelcome, SAMPLE_START } from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** Opens the TV with the clock stopped at `at`, in the round that starts at `SAMPLE_START`. */
async function openRound(page: Page, at: number, welcome = roundWelcome([ANA, BETO, CAIO], ANA.id)) {
  await page.clock.install({ time: at });
  await page.clock.pauseAt(at);
  const room = await fakeRoom(page, welcome);
  await page.goto('/');
  return room;
}

test('hides the board during the countdown', async ({ page }) => {
  await openRound(page, SAMPLE_START - COUNTDOWN_MS);
  const screen = page.getByTestId('countdown-screen');

  await expect(page.getByText('RODADA 1 DE 3')).toBeVisible();
  await expect(page.getByTestId('countdown-number')).toHaveText('3');
  await expect(screen).toHaveText('RODADA 1 DE 33');
  await expect(page.getByTestId('board')).toHaveCount(0);

  await page.clock.runFor(1_000 + TICK_MS);
  await expect(page.getByTestId('countdown-number')).toHaveText('2');
  await page.clock.runFor(1_000);
  await expect(page.getByTestId('countdown-number')).toHaveText('1');
  await expect(page.getByTestId('board')).toHaveCount(0);
});

test('keeps the countdown at the right number after coming back', async ({ page }) => {
  await openRound(page, SAMPLE_START - 1_500);

  await expect(page.getByTestId('countdown-number')).toHaveText('2');
});
