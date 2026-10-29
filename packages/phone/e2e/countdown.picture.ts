import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, roundWelcome, SAMPLE_CODE, sampleRound } from './samples.ts';

/** The page's frozen clock; the timers still run. */
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0);

test('phone-countdown', async ({ page }) => {
  // The capture's state: Beto's phone in round 1 of 3, half a second before the board, so the number is 1.
  await page.clock.setFixedTime(NOW);
  const round = sampleRound(NOW + 500, NOW + 120_500);
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [roundWelcome([ANA, BETO, CAIO, DUDA], BETO.id, round)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByRole('timer')).toHaveText('1');
  await expect(page.getByText(STRINGS.getReady)).toBeVisible();

  await page.screenshot({ path: picturePath('phone-countdown'), animations: 'disabled' });
});
