import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';

/** The wait before the next creation attempt; its exact limit is in `state/room.test.ts` (TVROOM-01 AC 5). */
const RETRY_MS = 5_000;

/** The room the page keeps in `localStorage`. */
async function savedRoom(page: Page): Promise<{ code: string; tvToken: string }> {
  const text = await page.evaluate(() => localStorage.getItem('bwords.tv.room'));
  expect(text).not.toBeNull();
  return JSON.parse(text!) as { code: string; tvToken: string };
}

test('opens a room on the real server and comes back to it after a reload', async ({ page }) => {
  const sockets: string[] = [];
  page.on('websocket', (socket) => sockets.push(socket.url()));

  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  const first = await savedRoom(page);

  await page.reload();
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  const second = await savedRoom(page);

  expect(second).toEqual(first);
  const roomSockets = sockets.filter((url) => url.includes('/api/rooms/'));
  expect(roomSockets.length).toBeGreaterThanOrEqual(2);
  for (const url of [...roomSockets, page.url()]) expect(url).not.toContain(first.tvToken);
  expect(roomSockets[0]).toContain(`/api/rooms/${first.code}/ws`);
});

test('creates another room when the saved token is refused', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded') !== null) return;
    sessionStorage.setItem('seeded', 'yes');
    localStorage.setItem('bwords.tv.room', JSON.stringify({ code: 'ZZZZ', tvToken: 'stale-token' }));
  });

  await page.goto('/');

  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  expect((await savedRoom(page)).code).not.toBe('ZZZZ');
});

test('says the room cannot be opened and tries again after 5 seconds', async ({ page }) => {
  await page.clock.install();
  await page.route('**/api/rooms', (route) => route.abort());

  await page.goto('/');
  await expect(page.getByText(STRINGS.roomOpenFailed)).toBeVisible();

  await page.unroute('**/api/rooms');
  await page.clock.fastForward(RETRY_MS);

  await expect(page.getByTestId('lobby-screen')).toBeVisible();
});
