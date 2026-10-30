import { type Browser, expect, type Page } from '@playwright/test';

/**
 * Real phones for the match that crosses both clients. The TV's package does not import the phone's (style guide §2),
 * so this holds the few gestures and the words a player sees, as the phone's own E2E has them.
 */

/** What the phone says, in its string table. */
export const PHONE_TEXT = {
  nickname: 'Seu Apelido',
  join: 'ENTRAR',
  youAreHost: 'VOCÊ É O(A) ANFITRIÃO(Ã)',
  board: 'Tabuleiro',
  rounds: 'Rodadas',
  roundTime: 'Tempo da Rodada',
  startMatch: 'INICIAR PARTIDA',
  increaseRounds: 'Aumentar Rodadas',
  decreaseRoundTime: 'Diminuir Tempo da Rodada',
  yourPerformance: 'SEU RENDIMENTO',
  playAgain: 'JOGAR DE NOVO',
  getReady: 'Prepare o dedo!',
  waitingToAdvance: (host: string) => `Aguardando ${host} avançar…`,
  nextRound: (round: number, total: number) => `PRÓXIMA RODADA (${round} DE ${total})`,
  validWord: (points: number) => `VÁLIDA (+${points} PTS)`,
  roundTally: (words: number, points: number) => `${words} pal · ${points} pts`,
  firstPlace: 'Você ficou em 1º Lugar!',
} as const;

/** A phone of the match: one browser context, so one localStorage, per player. */
export interface Phone {
  page: Page;
  close(): Promise<void>;
}

/** A 390×844 touch phone that opens the room's address, as the QR says, and joins with the first free color. */
export async function joinOnPhone(browser: Browser, roomUrl: string, nickname: string): Promise<Phone> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  await page.goto(roomUrl);
  await page.getByLabel(PHONE_TEXT.nickname).fill(nickname);
  await page.getByRole('button', { name: PHONE_TEXT.join }).click();
  await expect(page.getByLabel(PHONE_TEXT.nickname)).toBeHidden();
  return { page, close: () => context.close() };
}

/** The board on the phone. */
function boardOf(page: Page) {
  return page.getByRole('group', { name: PHONE_TEXT.board });
}

/** Waits for the phone's board of `size` tiles a side, and swipes `tiles`. */
export async function swipeOnPhone(page: Page, tiles: readonly number[], size: number): Promise<void> {
  const board = boardOf(page);
  await expect(board).toBeVisible({ timeout: 10_000 });
  const box = await board.boundingBox();
  if (box === null) throw new Error('The board is not on screen');
  const side = box.width / size;
  const centerOf = (tile: number) => ({ x: box.x + ((tile % size) + 0.5) * side, y: box.y + (Math.floor(tile / size) + 0.5) * side });

  const [first, ...others] = tiles.map(centerOf);
  if (first === undefined) throw new Error('A swipe needs tiles');
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const center of others) await page.mouse.move(center.x, center.y, { steps: 4 });
  await page.mouse.up();
}
