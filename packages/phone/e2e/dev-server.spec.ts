import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/** The repository root, as the dev server's `/@fs/` paths name it (forward slashes). */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..').replaceAll('\\', '/');

/** A `/@fs/` URL of the dev server for a file of the repository. */
function fsUrl(path: string): string {
  return `/@fs/${ROOT.replace(/^\//, '')}/${path}`;
}

test('never serves the dictionary through the dev server', async ({ request }) => {
  // PROTO-01 AC 8: the dictionary stays on the server; the phone's Vite refuses its files even by `/@fs/`.
  const reachable = await request.get(fsUrl('packages/core/src/index.ts'));
  expect(reachable.status()).toBe(200);

  const dictionaryFiles = ['tools/dict-build/dist/pt-BR.dict.bin', 'languages/pt-BR/pack.json', 'languages/pt-BR/extra.txt'];
  for (const path of dictionaryFiles) {
    expect(existsSync(join(ROOT, path)), `${path} exists, so only the dev server can refuse it`).toBe(true);
    const response = await request.get(fsUrl(path));
    expect(response.status(), path).toBe(403);
  }
});
