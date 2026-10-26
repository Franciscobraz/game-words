import { createReadStream, existsSync, statSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));

/** URL prefix -> directory served as a language pack. */
const PACKS: Record<string, string> = {
  '/pack/': join(here, '../dict-build/dist/pt-BR'),
  '/e2e-fixture/': join(here, 'e2e/fixtures/pack'),
};

/** Serves the built pt-BR pack and the E2E fixture pack as static files. */
function servePacks(): Plugin {
  return {
    name: 'bwords-packs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? '').split('?')[0]!;
        const prefix = Object.keys(PACKS).find((p) => url.startsWith(p));
        if (!prefix) return next();
        const file = normalize(join(PACKS[prefix]!, url.slice(prefix.length)));
        if (!file.startsWith(PACKS[prefix]!) || !existsSync(file) || !statSync(file).isFile()) {
          res.statusCode = 404;
          res.end('not found');
          return;
        }
        res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root: here,
  plugins: [preact(), servePacks()],
  server: { port: 5173, strictPort: true },
});
