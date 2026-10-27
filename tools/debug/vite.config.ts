import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));

/** Where `wrangler dev` of `@bwords/server` listens. */
const SERVER = 'http://127.0.0.1:8787';

export default defineConfig({
  root: here,
  plugins: [preact()],
  server: {
    port: 5174,
    strictPort: true,
    // HTTP and WebSocket go through Vite, so the page is same-origin with the server.
    proxy: { '/api': { target: SERVER, ws: true } },
  },
});
