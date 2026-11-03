import { expect, type Page, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { ANA, BETO, lobbyWelcome } from './samples.ts';

/** Waits until the hidden video plays frames of its stream. */
async function videoPlays(page: Page): Promise<void> {
  const video = page.getByTestId('awake-video');
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => !el.paused && el.readyState >= 2)).toBe(true);
}

test('plays a muted looping video out of sight', async ({ page }) => {
  // TVAWAKE-01 AC 3.
  await fakeRoom(page, lobbyWelcome([ANA, BETO], ANA.id));

  await page.goto('/');

  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await videoPlays(page);
  const video = page.getByTestId('awake-video');
  const state = await video.evaluate((el: HTMLVideoElement) => {
    const box = el.getBoundingClientRect();
    const onTop = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    return { muted: el.muted, loop: el.loop, width: box.width, height: box.height, isOnTop: onTop === el };
  });
  expect(state).toEqual({ muted: true, loop: true, width: 2, height: 2, isOnTop: false });
  const startedAt = await video.evaluate((el: HTMLVideoElement) => el.currentTime);
  await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(startedAt);
});

test('shows no error when the browser refuses the wake lock and the video', async ({ page }) => {
  // TVAWAKE-01 AC 4: a browser without the Screen Wake Lock that refuses to play any video.
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  await page.addInitScript(() => {
    delete (Navigator.prototype as { wakeLock?: unknown }).wakeLock;
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException('Autoplay is blocked', 'NotAllowedError'));
  });
  const room = await fakeRoom(page, lobbyWelcome([ANA], ANA.id));

  await page.goto('/');

  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  expect(await page.evaluate(() => 'wakeLock' in navigator)).toBe(false);
  room.push({ type: 'players', players: [ANA, BETO], hostId: ANA.id });
  await expect(page.getByTestId(`player-${BETO.id}`)).toContainText('Beto');
  await expect(page.getByTestId('player-count')).toHaveText('2 / 10');
  await expect(page.getByText(/erro|error/i)).toHaveCount(0);
  await expect(page.getByTestId('connection-banner')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('keeps every pixel of the screen the same with the video', async ({ page }) => {
  // TVAWAKE-01 AC 5: the screen with the playing video against the same screen with the video taken out.
  await fakeRoom(page, lobbyWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await videoPlays(page);

  const withVideo = await page.screenshot({ animations: 'disabled' });
  await page.getByTestId('awake-video').evaluate((el) => el.remove());
  const withoutVideo = await page.screenshot({ animations: 'disabled' });

  expect(withVideo.equals(withoutVideo)).toBe(true);
});
