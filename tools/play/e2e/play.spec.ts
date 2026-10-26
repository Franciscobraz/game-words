import { expect, type Page, test } from '@playwright/test';
import { COMMON, MIN_COMMON_WORDS, PROFANITY, SPELLINGS, WORDS } from './fixtures/words.ts';

const FIXTURE = '/?pack=/e2e-fixture';
const LOAD_ERROR = 'Não foi possível carregar o dicionário. Rode npm run dict:build -- pt-BR.';

test('serves the page with the pack loaded', async ({ page }) => {
  // PLAY-01 AC 1: the default page (no ?pack) loads the real pt-BR pack built by dict:build.
  await page.goto('http://localhost:5173/');
  await expect(page.getByTestId('status')).toHaveText(/^Dicionário pt-BR carregado: [\d.]+ palavras$/, { timeout: 30_000 });
  await expect(page.getByTestId('board')).not.toHaveAttribute('aria-disabled', 'true');
});

test('shows loading and disables the board', async ({ page }) => {
  // PLAY-01 AC 9: hold the dictionary download until the loading state has been checked.
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/e2e-fixture/dict.bin', async (route) => {
    await held;
    await route.continue();
  });
  await page.goto(FIXTURE);
  await expect(page.getByTestId('status')).toHaveText('Carregando dicionário…');
  await expect(page.getByTestId('board')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('button', { name: 'Novo tabuleiro' })).toBeDisabled();

  release();
  await expect(page.getByTestId('status')).toHaveText('Dicionário e2e-fixture carregado: 753 palavras');
  await expect(page.getByTestId('board')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByRole('button', { name: 'Novo tabuleiro' })).toBeEnabled();
});

test('shows the load error', async ({ page }) => {
  // PLAY-01 AC 10: a missing pack file shows the build hint.
  await page.route('**/e2e-fixture/dict.bin', (route) => route.fulfill({ status: 404, body: 'not found' }));
  await page.goto(FIXTURE);
  await expect(page.getByTestId('status')).toHaveText(LOAD_ERROR);
  await expect(page.getByTestId('status').locator('code')).toHaveText('npm run dict:build -- pt-BR');
  await expect(page.getByTestId('board')).toHaveAttribute('aria-disabled', 'true');
});

/** Letters of the board as shown, row-major and lowercase ("Qu" -> "qu"). */
async function boardLetters(page: Page): Promise<string[]> {
  return (await page.getByTestId('tile').allTextContents()).map((t) => t.trim().toLowerCase());
}

/** First path of adjacent, distinct tiles that spells `word`, or null. */
function findPath(letters: string[], word: string): number[] | null {
  const n = Math.round(Math.sqrt(letters.length));
  const walk = (path: number[], rest: string): number[] | null => {
    if (rest === '') return path;
    const last = path[path.length - 1]!;
    for (let i = 0; i < letters.length; i++) {
      if (path.includes(i) || !rest.startsWith(letters[i]!)) continue;
      if (Math.abs(Math.floor(i / n) - Math.floor(last / n)) > 1 || Math.abs((i % n) - (last % n)) > 1) continue;
      const found = walk([...path, i], rest.slice(letters[i]!.length));
      if (found) return found;
    }
    return null;
  };
  for (let i = 0; i < letters.length; i++) {
    if (!word.startsWith(letters[i]!)) continue;
    const found = walk([i], word.slice(letters[i]!.length));
    if (found) return found;
  }
  return null;
}

/** A 4-tile path whose letters are not a fixture word. */
function nonWordPath(letters: string[]): number[] {
  const n = Math.round(Math.sqrt(letters.length));
  for (let a = 0; a < letters.length; a++) {
    const path = [a, a + 1, a + 1 + n, a + n];
    if (a % n === n - 1 || a + 1 + n >= letters.length) continue;
    if (!WORDS.includes(path.map((i) => letters[i]).join(''))) return path;
  }
  throw new Error('no 4-tile non-word on the board');
}

/** Presses the mouse on the first tile, drags through the others and releases. */
async function drag(page: Page, path: number[], release = true): Promise<void> {
  const tiles = page.getByTestId('tile');
  const centers = [];
  for (const i of path) {
    const box = (await tiles.nth(i).boundingBox())!;
    centers.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  }
  await page.mouse.move(centers[0]!.x, centers[0]!.y);
  await page.mouse.down();
  for (const c of centers.slice(1)) await page.mouse.move(c.x, c.y, { steps: 6 });
  if (release) await page.mouse.up();
}

async function dragWord(page: Page, word: string): Promise<void> {
  const path = findPath(await boardLetters(page), word);
  expect(path, `"${word}" on the board`).not.toBeNull();
  await drag(page, path!);
}

/** Loads the fixture pack and draws the board of `size` and `seed` with the button. */
async function newBoard(page: Page, size: number, seed: number): Promise<void> {
  await page.goto(FIXTURE);
  await expect(page.getByRole('button', { name: 'Novo tabuleiro' })).toBeEnabled();
  await page.getByTestId('size').selectOption(String(size));
  await page.getByTestId('seed').fill(String(seed));
  await page.getByRole('button', { name: 'Novo tabuleiro' }).click();
  await expect(page.getByTestId('tile')).toHaveCount(size * size);
}

test('shows the board for the chosen seed', async ({ page }) => {
  // PLAY-01 AC 2: the 5x5 board of seed 2 is the one generateBoard(5, 2, fixture) draws.
  await newBoard(page, 5, 2);
  const seed2 = ['reems', 'omisc', 'scism', 'coeta', 'tacea'].join('');
  expect((await boardLetters(page)).join('')).toBe(seed2);

  await page.getByTestId('seed').fill('3');
  await page.getByRole('button', { name: 'Novo tabuleiro' }).click();
  await expect(page.getByTestId('tile').first()).toHaveText('R');
  expect((await boardLetters(page)).join('')).toBe(['ramar', 'mmcem', 'caris', 'tereo', 'isiat'].join(''));

  await page.getByTestId('seed').fill('2');
  await page.getByRole('button', { name: 'Novo tabuleiro' }).click();
  await expect(page.getByTestId('tile').nth(1)).toHaveText('E');
  expect((await boardLetters(page)).join('')).toBe(seed2);

  await page.getByTestId('size').selectOption('4');
  await page.getByRole('button', { name: 'Novo tabuleiro' }).click();
  await expect(page.getByTestId('tile')).toHaveCount(16);
});

test('submits the dragged path on release', async ({ page }) => {
  // PLAY-01 AC 3: nothing is submitted while the button is held; releasing submits the path.
  await newBoard(page, 4, 1);
  const path = findPath(await boardLetters(page), 'amor')!;
  await drag(page, path, false);
  await expect(page.getByTestId('tile').and(page.locator('[data-selected="true"]'))).toHaveCount(4);
  await expect(page.getByTestId('feedback')).toHaveText('');
  await expect(page.getByTestId('found-word')).toHaveCount(0);

  await page.mouse.up();
  await expect(page.getByTestId('feedback')).toHaveText('Aceita: amor');
  await expect(page.getByTestId('found-word')).toHaveCount(1);
  await expect(page.locator('[data-selected="true"]')).toHaveCount(0);
});

test('lists an accepted word with spelling and points', async ({ page }) => {
  // PLAY-01 AC 4: "mae" shows as "mãe" (+1), "amor" as "amor" (+2), total 3.
  expect(SPELLINGS.mae).toEqual(['mãe']);
  await newBoard(page, 4, 1);
  await expect(page.getByTestId('total')).toHaveText('Total: 0');

  await dragWord(page, 'mae');
  await expect(page.getByTestId('found-word')).toHaveCount(1);
  await expect(page.getByTestId('found-word').nth(0).getByTestId('found-spelling')).toHaveText('mãe');
  await expect(page.getByTestId('found-word').nth(0).getByTestId('found-points')).toHaveText('+1');
  await expect(page.getByTestId('total')).toHaveText('Total: 1');

  await dragWord(page, 'amor');
  await expect(page.getByTestId('found-word')).toHaveCount(2);
  await expect(page.getByTestId('found-word').nth(1).getByTestId('found-spelling')).toHaveText('amor');
  await expect(page.getByTestId('found-word').nth(1).getByTestId('found-points')).toHaveText('+2');
  await expect(page.getByTestId('total')).toHaveText('Total: 3');
});

test('shows the rejection reason', async ({ page }) => {
  // PLAY-01 AC 5: each reason the core returns is shown, and rejections keep the total.
  await newBoard(page, 4, 1);
  const letters = await boardLetters(page);
  const feedback = page.getByTestId('feedback');

  await drag(page, [0]);
  await expect(feedback).toHaveText('Rejeitada: invalid-path');

  await drag(page, [0, 1]);
  await expect(feedback).toHaveText('Rejeitada: too-short');

  await drag(page, nonWordPath(letters));
  await expect(feedback).toHaveText('Rejeitada: not-a-word');

  await dragWord(page, 'amor');
  await expect(feedback).toHaveText('Aceita: amor');
  await dragWord(page, 'amor');
  await expect(feedback).toHaveText('Rejeitada: already-found');

  await expect(page.getByTestId('found-word')).toHaveCount(1);
  await expect(page.getByTestId('total')).toHaveText('Total: 2');
});

/** Fixture words the board spells, worked out from the tiles shown (the test's own oracle). */
function expectedSolutions(letters: string[], minLength: number, filterProfanity: boolean): string[] {
  return WORDS.filter(
    (w) => w.length >= minLength && !(filterProfanity && PROFANITY.includes(w)) && findPath(letters, w) !== null,
  );
}

test('shows solutions with common words and the longest', async ({ page }) => {
  // PLAY-01 AC 6: every valid solution is listed, the common ones are marked, the longest is named.
  await newBoard(page, 4, 1);
  const expected = expectedSolutions(await boardLetters(page), 3, true);
  await expect(page.getByTestId('solutions')).toHaveCount(0);

  await page.getByRole('button', { name: 'Mostrar soluções' }).click();
  const items = page.getByTestId('solution');
  await expect(items).toHaveCount(expected.length);
  const words = await items.evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.word!));
  expect([...words].sort()).toEqual([...expected].sort());

  const common = await page.locator('[data-testid="solution"][data-common="true"]').evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).dataset.word!),
  );
  expect(common.sort()).toEqual(expected.filter((w) => COMMON.includes(w)).sort());
  await expect(page.locator('[data-testid="solution"][data-common="true"]').first()).toHaveClass(/common/);
  await expect(page.locator('[data-testid="solution"][data-word="mae"]')).toHaveText('mãe');

  // The 4-letter common words tie; nobody found any, so the first alphabetically wins.
  await expect(page.getByTestId('longest')).toHaveText('Maior palavra: amor');
  await expect(page.locator('[data-testid="solution"][data-longest="true"]')).toHaveAttribute('data-word', 'amor');

  // Finding "roma" makes it the longest: ties go to a word someone found.
  await dragWord(page, 'roma');
  await expect(page.getByTestId('longest')).toHaveText('Maior palavra: roma');
});

test('shows the board stats', async ({ page }) => {
  // PLAY-01 AC 7: solution count, common count and the meta.json minimum for the size.
  await newBoard(page, 4, 1);
  let expected = expectedSolutions(await boardLetters(page), 3, true);
  await expect(page.getByTestId('stat-solutions')).toHaveText(`Soluções: ${expected.length}`);
  await expect(page.getByTestId('stat-common')).toHaveText(`Comuns: ${expected.filter((w) => COMMON.includes(w)).length}`);
  await expect(page.getByTestId('stat-min')).toHaveText(`Mínimo de comuns (4x4): ${MIN_COMMON_WORDS[4]}`);

  await page.getByTestId('size').selectOption('5');
  await page.getByRole('button', { name: 'Novo tabuleiro' }).click();
  await expect(page.getByTestId('tile')).toHaveCount(25);
  expected = expectedSolutions(await boardLetters(page), 3, true);
  await expect(page.getByTestId('stat-solutions')).toHaveText(`Soluções: ${expected.length}`);
  await expect(page.getByTestId('stat-common')).toHaveText(`Comuns: ${expected.filter((w) => COMMON.includes(w)).length}`);
  await expect(page.getByTestId('stat-min')).toHaveText(`Mínimo de comuns (5x5): ${MIN_COMMON_WORDS[5]}`);
});

test('recomputes on option change', async ({ page }) => {
  // PLAY-01 AC 8: the profanity filter and the minimum length change both the solutions and validation.
  await newBoard(page, 4, 1);
  const letters = await boardLetters(page);
  const profane = PROFANITY.find((w) => findPath(letters, w) !== null)!;
  expect(profane).toBeDefined();
  const feedback = page.getByTestId('feedback');
  await expect(page.getByTestId('filter')).toBeChecked();
  await expect(page.getByTestId('min-length')).toHaveValue('3');
  await page.getByRole('button', { name: 'Mostrar soluções' }).click();

  await dragWord(page, profane);
  await expect(feedback).toHaveText('Rejeitada: not-a-word');
  await expect(page.locator(`[data-testid="solution"][data-word="${profane}"]`)).toHaveCount(0);

  await page.getByTestId('filter').uncheck();
  const unfiltered = expectedSolutions(letters, 3, false);
  expect(unfiltered.length).toBeGreaterThan(expectedSolutions(letters, 3, true).length);
  await expect(page.getByTestId('stat-solutions')).toHaveText(`Soluções: ${unfiltered.length}`);
  await expect(page.getByTestId('solution')).toHaveCount(unfiltered.length);
  await expect(page.locator(`[data-testid="solution"][data-word="${profane}"]`)).toHaveCount(1);
  await dragWord(page, profane);
  await expect(feedback).toHaveText(`Aceita: ${profane}`);

  await page.getByTestId('min-length').selectOption('4');
  const longOnly = expectedSolutions(letters, 4, false);
  await expect(page.getByTestId('stat-solutions')).toHaveText(`Soluções: ${longOnly.length}`);
  await expect(page.getByTestId('solution')).toHaveCount(longOnly.length);
  await dragWord(page, 'mae');
  await expect(feedback).toHaveText('Rejeitada: too-short');

  await page.getByTestId('min-length').selectOption('3');
  await dragWord(page, 'mae');
  await expect(feedback).toHaveText('Aceita: mae');
});
