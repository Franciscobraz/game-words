import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { loadPackConfig } from './pack.ts';

const ROOT = new URL('../../../', import.meta.url);
const PT_BR = fileURLToPath(new URL('languages/pt-BR', ROOT));

describe('loadPackConfig', () => {
  test('reads every pack field', async () => {
    const pack = await loadPackConfig(PT_BR);
    expect(pack).toEqual({
      id: 'pt-BR',
      name: 'Português (Brasil)',
      alphabet: 'abcdefghijklmnopqrstuvwxyz',
      compoundTiles: [{ tile: 'Qu', letters: 'qu' }],
      normalization: 'strip-diacritics',
      minWordLength: 3,
      sources: {
        vero: {
          repo: 'LibreOffice/dictionaries',
          commit: '67032ee957631908098a72edf48dc81cac27e369',
          dic: 'pt_BR/pt_BR.dic',
          aff: 'pt_BR/pt_BR.aff',
        },
        frequency: {
          repo: 'hermitdave/FrequencyWords',
          commit: '525f9b560de45753a5ea01069454e72e9aa541c6',
          path: 'content/2018/pt_br/pt_br_full.txt',
          top: 50000,
        },
      },
    });
  });

  test('fails naming a missing field', async () => {
    const raw = JSON.parse(await readFile(join(PT_BR, 'pack.json'), 'utf8'));
    delete raw.sources.vero.commit;
    const dir = await mkdtemp(join(tmpdir(), 'pack-'));
    await writeFile(join(dir, 'pack.json'), JSON.stringify(raw));
    await expect(loadPackConfig(dir)).rejects.toThrow(/sources\.vero\.commit/);

    // Every other field is named too, not only the one above.
    const noAlphabet = JSON.parse(await readFile(join(PT_BR, 'pack.json'), 'utf8'));
    delete noAlphabet.alphabet;
    await writeFile(join(dir, 'pack.json'), JSON.stringify(noAlphabet));
    await expect(loadPackConfig(dir)).rejects.toThrow(/"alphabet"/);
  });

  test('NOTICE attributes the data sources', async () => {
    const notice = await readFile(new URL('NOTICE', ROOT), 'utf8');
    for (const s of [
      'FrequencyWords',
      'Hermit Dave',
      'OpenSubtitles 2018',
      'CC-BY-SA 4.0',
      'https://github.com/hermitdave/FrequencyWords',
      'VERO',
      'LGPLv3',
      'MPL',
      'https://github.com/LibreOffice/dictionaries',
    ]) {
      expect(notice).toContain(s);
    }
  });

  test('ships pt-BR with an empty profanity list', async () => {
    const text = await readFile(join(PT_BR, 'profanity.txt'), 'utf8');
    const words = text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    expect(words).toEqual([]);
  });
});
