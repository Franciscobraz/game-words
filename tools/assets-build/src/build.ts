import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Assembles the one assets folder of the Worker, `packages/server/public/` (git-ignored; design, decision 2):
 *
 * - `npm run assets:build` builds the clients and writes the language pack and the clients there, building the pack
 *   first if it does not exist yet;
 * - `--pack-only`, which the server's `dev` runs, only refreshes the pack and leaves any built client in place, so
 *   `wrangler dev` starts with the dictionary and without a client build.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const PACK_ID = 'pt-BR';
const PACK_DIR = join(root, 'tools/dict-build/dist', PACK_ID);
const PUBLIC_DIR = join(root, 'packages/server/public');
const CLIENTS = ['phone', 'tv'] as const;

/** Runs a command, stopping the whole build when it fails. */
function run(command: string, cwd: string): void {
  const result = spawnSync(command, { cwd, shell: true, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`"${command}" failed in ${cwd}`);
}

/** Replaces the pack in the assets folder; the Worker reads it only through the ASSETS binding (PROTO-01 AC 8). */
function copyPack(): void {
  if (!existsSync(join(PACK_DIR, 'meta.json'))) throw new Error(`No language pack in ${PACK_DIR}: run npm run dict:build once`);
  rmSync(join(PUBLIC_DIR, PACK_ID), { recursive: true, force: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });
  cpSync(PACK_DIR, join(PUBLIC_DIR, PACK_ID), { recursive: true });
}

function copyClient(client: string): void {
  cpSync(join(root, 'packages', client, 'dist'), join(PUBLIC_DIR, client), { recursive: true });
}

function buildAll(): void {
  if (!existsSync(join(PACK_DIR, 'meta.json'))) run('npm run dict:build', root);
  // The clients build first: a failed build leaves the folder that was there untouched.
  for (const client of CLIENTS) run('npx vite build', join(root, 'packages', client));
  rmSync(PUBLIC_DIR, { recursive: true, force: true });
  copyPack();
  for (const client of CLIENTS) copyClient(client);
}

if (process.argv.includes('--pack-only')) copyPack();
else buildAll();
