import { expect, test } from '@playwright/test';

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
