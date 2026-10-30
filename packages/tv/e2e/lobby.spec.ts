import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom } from './fake-room.ts';
import { readQr } from './read-qr.ts';
import { ANA, BETO, CAIO, DUDA, lobbyWelcome, SAMPLE_CODE, SAMPLE_SETTINGS } from './samples.ts';

/** The two ends of the TV's screens (AD-016). */
const SCREENS = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
] as const;

test('the qr code reads the room address', async ({ page }) => {
  await fakeRoom(page, lobbyWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  const qr = page.getByTestId('room-qr');
  const expected = `${new URL(page.url()).origin}/${SAMPLE_CODE}`;

  for (const screen of SCREENS) {
    await page.setViewportSize(screen);

    await expect(qr.locator('.qr-code__mark')).toHaveText('B');
    expect(await readQr(page, qr), `${screen.width}x${screen.height}`).toBe(expected);
  }
});

test('shows the code and the real address', async ({ page }) => {
  await fakeRoom(page, lobbyWelcome([ANA], ANA.id));

  await page.goto('/');

  const host = new URL(page.url()).host;
  await expect(page.getByTestId('room-code')).toHaveText(SAMPLE_CODE);
  await expect(page.getByTestId('room-address')).toHaveText(`ou acesse ${host} e digite o código`);
});

test('shows each player with color, nickname and wins', async ({ page }) => {
  await fakeRoom(page, lobbyWelcome([ANA, BETO, CAIO, DUDA], ANA.id));

  await page.goto('/');

  const ana = page.getByTestId(`player-${ANA.id}`);
  await expect(ana).toContainText('Ana');
  await expect(ana).toContainText('2 vitórias');
  await expect(ana).toContainText('ANFITRIÃO(Ã)');
  await expect(ana.getByRole('img', { name: STRINGS.crown })).toBeVisible();
  await expect(page.getByTestId(`player-${BETO.id}`).getByRole('img', { name: STRINGS.crown })).toHaveCount(0);
  await expect(page.getByTestId(`player-${CAIO.id}`)).toContainText('DESCONECTADO');
  await expect(page.getByTestId(`player-${CAIO.id}`)).toHaveClass(/lobby-slot--dimmed/);
  await expect(page.getByTestId(`player-${DUDA.id}`)).toContainText('ESPECTADOR(A)');
  await expect(page.getByTestId('player-count')).toHaveText('4 / 10');
  await expect(page.getByTestId('free-slot')).toHaveCount(6);
  await expect(page.getByText('Vaga Livre #5')).toBeVisible();
  await expect(page.getByText('Vaga Livre #10')).toBeVisible();
});

test('adds a player who joins', async ({ page }) => {
  const room = await fakeRoom(page, lobbyWelcome([ANA], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('player-count')).toHaveText('1 / 10');

  room.push({ type: 'players', players: [ANA, BETO], hostId: ANA.id });

  await expect(page.getByTestId(`player-${BETO.id}`)).toContainText('Beto');
  await expect(page.getByTestId('player-count')).toHaveText('2 / 10');
  await expect(page.getByTestId('free-slot')).toHaveCount(8);
});

test('mirrors a settings change', async ({ page }) => {
  const room = await fakeRoom(page, lobbyWelcome([ANA], ANA.id));
  await page.goto('/');
  const sizeChip = page.getByTestId('chip-size');
  await expect(sizeChip).toHaveText('Grade 4x4');
  await expect(sizeChip).not.toHaveClass(/settings-chip--pulse/);

  room.push({ type: 'settings', settings: { ...SAMPLE_SETTINGS, size: 5 } });

  await expect(sizeChip).toHaveText('Grade 5x5');
  await expect(sizeChip).toHaveClass(/settings-chip--pulse/);
  await expect(page.getByTestId('chip-rounds')).not.toHaveClass(/settings-chip--pulse/);
  const iterations = await sizeChip.evaluate((chip) => getComputedStyle(chip).animationIterationCount);
  expect(iterations).toBe('1');
});

test('waits for the host in the footer', async ({ page }) => {
  await fakeRoom(page, lobbyWelcome([ANA, BETO], BETO.id));

  await page.goto('/');

  await expect(page.getByTestId('lobby-footer')).toHaveText('Aguardando Beto iniciar a partida…');
});

test('shows the empty lobby', async ({ page }) => {
  await fakeRoom(page, lobbyWelcome([], null));

  await page.goto('/');

  await expect(page.getByText('Ninguém entrou ainda')).toBeVisible();
  await expect(page.getByTestId('player-count')).toHaveText('0 / 10');
  await expect(page.getByTestId('free-slot')).toHaveCount(10);
  await expect(page.getByTestId('lobby-footer')).toHaveText('O primeiro a entrar vira anfitrião(ã)');
});

test('has none of the texts the spec takes out of the capture', async ({ page }) => {
  await fakeRoom(page, lobbyWelcome([ANA, BETO, CAIO, DUDA], ANA.id));

  await page.goto('/');

  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  for (const text of ['CONECTE-SE AGORA', 'Mínimo 2', 'Fast mode', 'bwords.exemplo']) await expect(page.getByText(text)).toHaveCount(0);
  await expect(page.getByText('BWords', { exact: true })).toBeVisible();
});

test('fits the lobby with ten players from 720p to 1080p', async ({ page }) => {
  const nickname = (index: number) => `Maximiliano${index}`;
  const players = Array.from({ length: 10 }, (_, index) => ({ ...ANA, id: `p${index}`, nickname: nickname(index) }));
  await fakeRoom(page, lobbyWelcome(players, 'p0'));
  await page.goto('/');
  await expect(page.getByTestId('player-p9')).toBeVisible();

  for (const screen of SCREENS) {
    await page.setViewportSize(screen);

    const overflow = await page.evaluate(() => ({
      vertical: document.documentElement.scrollHeight - innerHeight,
      horizontal: document.documentElement.scrollWidth - innerWidth,
      panel: Array.from(document.querySelectorAll('.lobby__panel, .join-card')).map((el) => el.scrollHeight - el.clientHeight),
    }));
    expect(overflow, `${screen.width}x${screen.height}`).toEqual({ vertical: 0, horizontal: 0, panel: [0, 0] });
    expect(await page.evaluate(() => document.querySelector('.lobby__footer')!.getBoundingClientRect().bottom <= innerHeight)).toBe(true);
  }
});
