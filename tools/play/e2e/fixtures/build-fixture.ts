/**
 * Writes the E2E fixture pack to `pack/` with the core's own encoders. Deterministic:
 * the same `words.ts` always gives the same bytes.
 *
 *   node tools/play/e2e/fixtures/build-fixture.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDawg, buildSpellings } from '../../../../packages/core/src/index.ts';
import { COMMON, LETTERS, MIN_COMMON_WORDS, PROFANITY, SPELLINGS, WORDS } from './words.ts';

const out = join(dirname(fileURLToPath(import.meta.url)), 'pack');
const weights = Array.from({ length: 26 }, (_, i) =>
  (LETTERS as readonly string[]).includes(String.fromCharCode(97 + i)) ? 1 / LETTERS.length : 0,
);

mkdirSync(out, { recursive: true });
const write = (name: string, buf: ArrayBuffer | string) =>
  writeFileSync(join(out, name), typeof buf === 'string' ? buf : new Uint8Array(buf));

write('dict.bin', buildDawg(WORDS, weights));
write('common.bin', buildDawg(COMMON, weights));
write('profanity.bin', buildDawg(PROFANITY, weights));
write('spellings.bin', buildSpellings(Object.entries(SPELLINGS)));
write('meta.json', `${JSON.stringify({ id: 'e2e-fixture', letterWeights: weights, minCommonWords: MIN_COMMON_WORDS }, null, 2)}\n`);
console.log(`fixture pack: ${WORDS.length} words, ${COMMON.length} common, ${PROFANITY.length} profane -> ${out}`);
