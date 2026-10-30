import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));

/** Where `wrangler dev` of `@bwords/server` listens. */
const SERVER = 'http://127.0.0.1:8787';

/** 5173 is `play` and 5174 is `debug`; the phone takes 5175. */
const PHONE_PORT = 5175;

/**
 * Files the dev server never serves, not even through `/@fs/`: Vite's own defaults, plus the
 * dictionary, which stays on the server only (PROTO-01 AC 8): the built packs and the edit files.
 */
const DENIED_FILES = ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/*.dict.bin', '**/languages/**', '**/tools/dict-build/**'];

export default defineConfig({
  root: here,
  plugins: [preact()],
  server: {
    port: PHONE_PORT,
    strictPort: true,
    fs: { deny: DENIED_FILES },
    // HTTP and WebSocket go through Vite, so the page is same-origin with the server.
    proxy: { '/api': { target: SERVER, ws: true } },
  },
});
