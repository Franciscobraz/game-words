import { wordPoints } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { wordOfPath } from '../src/model/path.ts';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import { boardOf, swipe } from './round-room.ts';
import { ANA, BETO, CAIO, DUDA, roundWelcome, SAMPLE_BOARD, SAMPLE_CODE, SAMPLE_WORDS, sampleHashFrame, sampleRound } from './samples.ts';

/** A scripted round whose server the test can take down and bring back. */
interface FlakyRoom {
  room: FakeRoom;
  /** From now on a reconnecting phone is refused, as a server out of reach. */
  goAway(): void;
  /** From now on a reconnecting phone gets the room back, with the words accepted so far. */
  comeBack(): void;
}

/**
 * Beto in an open round of the sample board. The scripted server accepts every path
 * and remembers the words, so a `welcome` after a reconnect lists them, as the real
 * server does (RECON-01 AC 3).
 */
async function openFlakyRound(page: Page): Promise<FlakyRoom> {
  const now = Date.now();
  const round = sampleRound(now - 1_000, now + 120_000);
  const frame = await sampleHashFrame();
  const accepted: string[] = [];
  let isReachable = true;
  const room = await fakeRoom(page, (msg) => {
    if (msg.type === 'hello') {
      if (!isReachable) return { replies: [], close: true };
      return { replies: [roundWelcome([ANA, BETO, CAIO, DUDA], BETO.id, round, [...accepted]), frame] };
    }
    if (msg.type === 'submit') {
      const words = msg.paths.map((path) => wordOfPath(SAMPLE_BOARD, path));
      accepted.push(...words);
      return { replies: [{ type: 'submit-result', results: words.map((word) => ({ ok: true, word })) }] };
    }
    return { replies: [] };
  });
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(boardOf(page)).toBeVisible();
  return {
    room,
    goAway: () => {
      isReachable = false;
    },
    comeBack: () => {
      isReachable = true;
    },
  };
}

const foundList = (page: Page) => page.getByRole('region', { name: STRINGS.foundWords }).getByRole('listitem');

test('keeps the screen and locks the board while reconnecting', async ({ page }) => {
  // RECON-01 AC 1-2: the socket drops with no `closed`; "Reconectando…" shows under the top bar, the round stays
  // on screen with its timer, and the board is faded and locked.
  const server = await openFlakyRound(page);
  await expect(boardOf(page)).toHaveAttribute('aria-disabled', 'false');

  server.goAway();
  server.room.drop();

  await expect(page.getByText(STRINGS.reconnecting)).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(boardOf(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(boardOf(page)).toHaveClass(/board-grid--locked/);
});

test('restores found words and flashes Conectado', async ({ page }) => {
  // RECON-01 AC 3: CASA reached the server and LUA was swiped right before the drop. When the room is back, the
  // welcome rebuilds the round with CASA, LUA goes out again, both stay listed and "Conectado" shows for about 1 s.
  const server = await openFlakyRound(page);
  await swipe(page, SAMPLE_WORDS.casa);
  await expect.poll(() => server.room.sent().filter((msg) => msg.type === 'submit').length).toBe(1);
  await swipe(page, SAMPLE_WORDS.lua);
  server.goAway();
  server.room.drop();
  await expect(page.getByText(STRINGS.reconnecting)).toBeVisible();

  server.comeBack();

  await expect(page.getByText(STRINGS.connected)).toBeVisible({ timeout: 10_000 });
  await expect(foundList(page)).toHaveText([
    `LUA${STRINGS.plusPoints(wordPoints('lua'))}`,
    `CASA${STRINGS.plusPoints(wordPoints('casa'))}`,
  ]);
  await expect(boardOf(page)).toHaveAttribute('aria-disabled', 'false');
  await expect(page.getByText(STRINGS.connected)).toBeHidden({ timeout: 2_000 });
  const sentWords = server.room
    .sent()
    .flatMap((msg) => (msg.type === 'submit' ? msg.paths.map((path) => wordOfPath(SAMPLE_BOARD, path)) : []));
  expect(sentWords.filter((word) => word === 'lua')).toHaveLength(1);
});
