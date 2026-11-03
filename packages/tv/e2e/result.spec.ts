import type { PlayerInfo, PlayerResult, RoundResultsMessage, ServerMessage } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import { readQr } from './read-qr.ts';
import {
  ANA,
  BETO,
  CAIO,
  DUDA,
  lobbyWelcome,
  resultPlayers,
  roundWelcome,
  SAMPLE_BOARD,
  SAMPLE_CODE,
  SAMPLE_END,
  sampleResults,
  samplePlayer,
} from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

/** The two ends of the TV's screens (AD-016). */
const SCREENS = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
] as const;

/** The round of every player who is not a spectator, with their score and words as the round's (RESULT-02 AC 2). */
function playedBy(players: readonly PlayerInfo[]): PlayerResult[] {
  return players
    .filter((player) => !player.spectator)
    .map(({ id, score, words }) => ({ playerId: id, unique: [], roundPoints: score, roundWords: words, score, words }));
}

/** Results with no words to scroll, played by `players`. */
function noWords(players: readonly PlayerInfo[], overrides: Partial<RoundResultsMessage> = {}): RoundResultsMessage {
  return { ...sampleResults(), shared: [], players: playedBy(players), ...overrides };
}

/**
 * Ends the round as the server does and opens the result as the host's "Ver resultado" does: the results and the words
 * stage, then the result between rounds or the podium after the last (WORDCTL-01 AC 8-9).
 */
async function showResult(page: Page, room: FakeRoom, results: RoundResultsMessage) {
  room.push(results);
  room.push({ type: 'phase', phase: 'words' });
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  room.push(results.last ? { type: 'podium', ranking: [] } : { type: 'phase', phase: 'results' });
  await page.clock.runFor(TICK_MS);
  await expect(page.getByTestId('result-screen')).toBeVisible();
}

/** Opens the TV at the end of the round of `players` and goes up to the moment the result opens. */
async function openResult(page: Page, players: PlayerInfo[], results: RoundResultsMessage = noWords(players)) {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome(players, players[0]?.id ?? null));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  await showResult(page, room, results);
  return room;
}

/** A player's round, as the server counts it. */
function roundOf(player: PlayerInfo, roundWords: number, roundPoints: number): PlayerResult {
  return { playerId: player.id, unique: [], roundPoints, roundWords, score: player.score, words: player.words };
}

test('shows words and points on every card and line', async ({ page }) => {
  const duda = { ...DUDA, spectator: false };
  const bia = samplePlayer('p10', 'Bia', '#3B82F6');
  const ana = { ...ANA, score: 40 };
  const beto = { ...BETO, score: 30 };
  const caio = { ...CAIO, connected: true, score: 20 };
  const round = [roundOf(ana, 14, 34), roundOf(beto, 11, 25), roundOf(caio, 8, 16), roundOf(duda, 7, 14), roundOf(bia, 1, 1)];

  await openResult(page, [ana, beto, caio, duda, bia], noWords([], { players: round }));

  await expect(page.getByTestId(`podium-card-${ANA.id}`)).toHaveText(/^Ana.*1º14 plvrs·34pts$/);
  await expect(page.getByTestId(`podium-card-${BETO.id}`)).toHaveText(/^Beto2º11 plvrs·25pts$/);
  await expect(page.getByTestId(`podium-card-${CAIO.id}`)).toHaveText(/^Caio3º8 plvrs·16pts$/);
  await expect(page.getByTestId(`standing-line-${duda.id}`)).toHaveText(/^4º.*Duda7 plvrs·14pts$/);
  await expect(page.getByTestId(`standing-line-${bia.id}`)).toHaveText(/^5º.*Bia1 plvr·1pt$/);
});

test('lists the fourth player on, and says one point in the singular', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 3 }, { ...BETO, score: 3 }, { ...CAIO, score: 2 }, samplePlayer('p4', 'Duda', '#FF4D8D', { score: 1 })]);

  await expect(page.getByTestId('standing-line-p4')).toHaveText(/4º.*Duda.*1.*pt$/);
  await expect(page.getByTestId(`podium-card-${ANA.id}`)).toContainText('1º');
  await expect(page.getByTestId(`podium-card-${BETO.id}`)).toContainText('1º');
});

test('shows only the first card with one player', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 3 }]);

  await expect(page.locator('.podium-card')).toHaveCount(1);
  await expect(page.getByTestId('result-rest')).toHaveCount(0);
});

test('marks a disconnected player', async ({ page }) => {
  const players = resultPlayers();
  await openResult(page, players);

  await expect(page.getByTestId('podium-card-p3')).toContainText('Caio');
  await expect(page.getByTestId('podium-card-p3')).toContainText('(desconectado)');
  await expect(page.getByTestId('podium-card-p1')).not.toContainText('(desconectado)');
});

test('shows who found the longest word', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 3 }], noWords([ANA], { longest: { word: 'seria', points: 3, spellings: ['seria', 'séria'], path: [0, 1], foundBy: [ANA.id] } }));
  const card = page.getByTestId('longest-word');

  await expect(card).toContainText('A maior palavra do tabuleiro');
  await expect(card).toContainText('SERIA');
  await expect(card).toContainText('(seria, séria)');
  await expect(card).toContainText('Ana encontrou!');
});

test('says when nobody found the longest word', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 0 }], noWords([ANA], { longest: { word: 'ternos', points: 4, path: [8, 5], foundBy: [] } }));

  await expect(page.getByTestId('longest-word')).toContainText('TERNOS');
  await expect(page.getByTestId('longest-word')).toContainText('Ninguém encontrou');
  await expect(page.locator('.board-grid__tile--lit').first()).toHaveText('T');
});

test('hides the card when the board has no longest word', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 0 }], noWords([ANA], { longest: null }));

  await expect(page.getByTestId('board')).toBeVisible();
  await expect(page.getByTestId('longest-word')).toHaveCount(0);
  await page.clock.runFor(2_000);
  await expect(page.locator('.board-grid__tile--lit')).toHaveCount(0);
});

test('lights the tiles of the longest word one by one, in its order', async ({ page }) => {
  await page.clock.install({ time: SAMPLE_END });
  await page.clock.pauseAt(SAMPLE_END);
  const room = await fakeRoom(page, roundWelcome([{ ...ANA, score: 3 }], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();
  const tiles = page.getByTestId('board').locator('.board-grid__tile');
  const litLetters = () => page.locator('.board-grid__tile--lit').allTextContents();

  await showResult(page, room, noWords([ANA]));
  await expect(tiles).toHaveCount(16);
  expect(await litLetters()).toEqual(['T']);

  await page.clock.runFor(400);
  await expect(page.locator('.board-grid__tile--lit')).toHaveCount(2);
  expect((await litLetters()).sort()).toEqual(['E', 'T']);

  await page.clock.runFor(1_600);
  await expect(page.locator('.board-grid__tile--lit')).toHaveCount(6);
  expect((await litLetters()).sort()).toEqual(['E', 'N', 'O', 'R', 'S', 'T']);
});

test('shows the round between rounds', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 3 }]);

  await expect(page.getByTestId('result-title')).toHaveText('Resultado·Rodada 1 de 3');
  await expect(page.getByTestId('result-footer')).toHaveText('Aguardando Ana avançar…');
  await expect(page.getByTestId('confetti')).toHaveCount(0);
});

test('shows the winner and the confetti after the last round', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 3 }, { ...BETO, score: 9 }], noWords([ANA, BETO], { index: 2, last: true }));

  await expect(page.getByTestId('result-title')).toHaveText('Beto venceu!');
  await expect(page.getByTestId('result-footer')).toHaveText('Aguardando Ana: jogar de novo ou voltar ao lobby');
  await expect(page.getByTestId(`podium-card-${BETO.id}`).getByTestId('confetti')).toHaveCount(1);
  await expect(page.getByTestId('confetti')).toHaveCount(1);
});

test('shows a tie after the last round', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 5 }, { ...BETO, score: 5 }], noWords([ANA, BETO], { index: 2, last: true }));

  await expect(page.getByTestId('result-title')).toHaveText('Empate!');
});

test('the small qr code reads the room address', async ({ page }) => {
  await openResult(page, [{ ...ANA, score: 3 }]);
  const qr = page.getByTestId('room-qr');
  const expected = `${new URL(page.url()).origin}/${SAMPLE_CODE}`;

  for (const screen of SCREENS) {
    await page.setViewportSize(screen);

    expect(await readQr(page, qr), `${screen.width}x${screen.height}`).toBe(expected);
  }
});

test('follows the host out of the result', async ({ page }) => {
  const nextRound: ServerMessage = {
    type: 'round-start',
    id: 2,
    index: 1,
    board: SAMPLE_BOARD,
    startsAt: SAMPLE_END + 120_000,
    endsAt: SAMPLE_END + 240_000,
    salt: 'sample-salt',
  };
  const cases: { name: string; results: RoundResultsMessage; message: ServerMessage; screen: string }[] = [
    { name: 'next', results: noWords([ANA]), message: nextRound, screen: 'countdown-screen' },
    { name: 'play-again', results: noWords([ANA], { last: true }), message: nextRound, screen: 'countdown-screen' },
    { name: 'back-to-lobby', results: noWords([ANA], { last: true }), message: lobbyWelcome([ANA], ANA.id), screen: 'lobby-screen' },
  ];

  for (const { name, results, message, screen } of cases) {
    const fresh = await page.context().newPage();
    const room = await openResult(fresh, [{ ...ANA, score: 3 }], results);

    room.push(message);

    await expect(fresh.getByTestId(screen), name).toBeVisible();
    await expect(fresh.getByTestId('result-screen'), name).toHaveCount(0);
    await fresh.close();
  }
});

test('fits the result with ten players and long nicknames at both ends of the screens', async ({ page }) => {
  const players = Array.from({ length: 10 }, (_, index) => samplePlayer(`p${index}`, `Maximiliano${index}`, '#FF7A00', { score: 10 - index, connected: index % 2 === 0 }));
  await openResult(page, players);
  await expect(page.getByTestId('standing-line-p9')).toBeVisible();

  for (const screen of SCREENS) {
    await page.setViewportSize(screen);

    const fits = await page.evaluate(() => {
      const root = document.documentElement;
      const rest = document.querySelector('[data-testid="result-rest"]')!;
      const lastLine = document.querySelector('[data-testid="standing-line-p9"]')!.getBoundingClientRect();
      const qr = document.querySelector('[data-testid="room-qr"]')!.getBoundingClientRect();
      return root.scrollHeight <= innerHeight && root.scrollWidth <= innerWidth && lastLine.bottom <= rest.getBoundingClientRect().bottom && qr.top >= 0;
    });
    expect(fits, `${screen.width}x${screen.height}`).toBe(true);
  }
});
