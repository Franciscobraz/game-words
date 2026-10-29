import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom } from './fake-room.ts';
import { ANA, BETO, lobbyWelcome, roundStartOf, SAMPLE_CODE, SAMPLE_SETTINGS, sampleRound } from './samples.ts';

/** The countdown the server gives before the board (`COUNTDOWN_MS` of the core). */
const COUNTDOWN_MS = 3_000;

test('counts 3, 2 and 1 until startsAt with the round and the room', async ({ page }) => {
  // COUNT-01 AC 1-2: `round-start` shows "RODADA 1 DE 3", "SALA KBXT", "Prepare o dedo!" and 3, 2, 1,
  // one per second on the server clock; no letter of the board shows until `startsAt`.
  const room = await fakeRoom(page, (msg) => ({
    replies: msg.type === 'hello' ? [{ ...lobbyWelcome([ANA, BETO], BETO.id), settings: { ...SAMPLE_SETTINGS, rounds: 3 } }] : [],
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.playersInRoom(2))).toBeVisible();

  const startsAt = Date.now() + COUNTDOWN_MS;
  room.push(roundStartOf(sampleRound(startsAt, startsAt + 120_000)));

  const number = page.getByRole('timer');
  await expect(page.getByText(STRINGS.roundOfUpper(1, 3))).toBeVisible();
  await expect(page.getByText(SAMPLE_CODE)).toBeVisible();
  await expect(page.getByText(STRINGS.getReady)).toBeVisible();
  const seen: string[] = [];
  while (Date.now() < startsAt - 100) {
    const text = (await number.textContent()) ?? '';
    if (seen.at(-1) !== text) seen.push(text);
    // No letter of the sample board (Qu, E, R, O...) is on the countdown screen.
    await expect(page.getByText('Qu', { exact: true })).toHaveCount(0);
    await page.waitForTimeout(50);
  }
  expect(seen).toEqual(['3', '2', '1']);

  await expect(page.getByText(STRINGS.getReady)).toBeHidden();
});
