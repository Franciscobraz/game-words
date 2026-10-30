import { expect, type Page, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { ANA, lobbyWelcome } from './samples.ts';

/** The two ends of the TV's screens (AD-016). */
const SCREENS = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
] as const;

/** Opens the TV in the lobby of a scripted room. */
async function openLobby(page: Page) {
  const room = await fakeRoom(page, lobbyWelcome([ANA], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  return room;
}

/** Nothing scrolls, nothing sticks out, and the message sits around the middle of the window. */
async function expectToFit(page: Page, testId: string) {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth - window.innerWidth,
    height: document.documentElement.scrollHeight - window.innerHeight,
  }));
  expect(overflow).toEqual({ width: 0, height: 0 });
  const box = (await page.getByTestId(testId).locator('h1').boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThan(viewport.height / 5);
}

const savedRoom = (page: Page) => page.evaluate(() => localStorage.getItem('bwords.tv.room'));

test('shows the expired and replaced screens', async ({ page, context }) => {
  // TVEXIT-01 AC 2: the logo at the top, the two texts in the center, and no footer, room code or QR.
  const room = await openLobby(page);

  room.push({ type: 'closed', reason: 'idle' });

  const expired = page.getByTestId('expired-screen');
  await expect(expired.getByRole('heading', { name: 'Sala expirada' })).toBeVisible();
  await expect(expired.getByText('Aperte OK no controle para abrir uma sala nova')).toBeVisible();
  await expect(expired.getByText('BWords')).toBeVisible();
  await expect(expired.locator('footer, [data-testid="room-code"], [data-testid="room-qr"]')).toHaveCount(0);
  for (const screen of SCREENS) {
    await page.setViewportSize(screen);
    await expectToFit(page, 'expired-screen');
  }

  // TVEXIT-01 AC 4: another tab only gets the notice.
  const other = await context.newPage();
  const otherRoom = await openLobby(other);

  otherRoom.push({ type: 'closed', reason: 'replaced' });

  const replaced = other.getByTestId('replaced-screen');
  await expect(replaced.getByRole('heading', { name: 'A TV foi aberta em outra aba' })).toBeVisible();
  await expect(replaced.getByText('BWords')).toBeVisible();
  await expectToFit(other, 'replaced-screen');
});

test('forgets the room and creates none when it expires', async ({ page }) => {
  const room = await openLobby(page);
  expect(await savedRoom(page)).not.toBeNull();
  const created: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/api/rooms')) created.push(request.url());
  });

  room.push({ type: 'closed', reason: 'tv-gone' });

  await expect(page.getByTestId('expired-screen')).toBeVisible();
  await expect.poll(() => savedRoom(page)).toBeNull();
  expect(created).toEqual([]);
});

test('a key opens a new room on the expired screen', async ({ page }) => {
  // TVEXIT-01 AC 3.
  const room = await openLobby(page);
  room.push({ type: 'closed', reason: 'idle' });
  await expect(page.getByTestId('expired-screen')).toBeVisible();

  await page.keyboard.press('Enter');

  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  expect(await savedRoom(page)).not.toBeNull();
});

test('a click opens a new room on the expired screen', async ({ page }) => {
  // TVEXIT-01 AC 3.
  const room = await openLobby(page);
  room.push({ type: 'closed', reason: 'tv-gone' });
  await expect(page.getByTestId('expired-screen')).toBeVisible();

  await page.getByTestId('expired-screen').click();

  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  expect(await savedRoom(page)).not.toBeNull();
});

test('a key does nothing on the screen of another tab', async ({ page }) => {
  // TVEXIT-01 AC 4: "só avisa e para".
  const room = await openLobby(page);
  room.push({ type: 'closed', reason: 'replaced' });
  await expect(page.getByTestId('replaced-screen')).toBeVisible();

  await page.keyboard.press('Enter');

  await expect(page.getByTestId('replaced-screen')).toBeVisible();
  expect(await savedRoom(page)).not.toBeNull();
});

test('opens a new room by itself when the host closes it', async ({ page }) => {
  // TVEXIT-01 AC 1.
  const room = await openLobby(page);
  const created = page.waitForRequest((request) => request.url().endsWith('/api/rooms'));

  room.push({ type: 'closed', reason: 'closed-by-host' });

  await created;
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
});
