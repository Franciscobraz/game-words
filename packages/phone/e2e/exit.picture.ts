import type { CloseReason } from '@bwords/core';
import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom, picturePath } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE } from './samples.ts';

/** Beto's phone in KBXT's lobby, closed by the server with `reason` right after `welcome`. */
const PICTURES: { capture: string; reason: CloseReason; heading: string }[] = [
  { capture: 'phone-kicked', reason: 'kicked', heading: STRINGS.kicked },
  { capture: 'phone-room-closed', reason: 'closed-by-host', heading: STRINGS.hostClosedRoom('Ana') },
];

for (const { capture, reason, heading } of PICTURES) {
  test(capture, async ({ page }) => {
    await fakeRoom(page, (msg) => ({
      replies: msg.type === 'hello' ? [lobbyWelcome([ANA, BETO, CAIO, DUDA], BETO.id), { type: 'closed', reason }] : [],
      close: msg.type === 'hello',
    }));
    await page.goto(`/${SAMPLE_CODE}`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();

    await page.screenshot({ path: picturePath(capture), fullPage: true });
  });
}
