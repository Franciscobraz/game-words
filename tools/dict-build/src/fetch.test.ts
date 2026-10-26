import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { type SourceSpec, fetchSource } from './fetch.ts';
import { loadPackConfig } from './pack.ts';

const SOURCE: SourceSpec = {
  repo: 'LibreOffice/dictionaries',
  commit: '0123456789abcdef0123456789abcdef01234567',
  dic: 'pt_BR/pt_BR.dic',
  aff: 'pt_BR/pt_BR.aff',
};

const BODIES: Record<string, Uint8Array> = {
  'pt_BR.dic': new Uint8Array([0x32, 0x0a, 0x63, 0xe3, 0x6f, 0x0a]),
  'pt_BR.aff': new Uint8Array([0x53, 0x45, 0x54, 0x20, 0x55, 0x54, 0x46, 0x2d, 0x38, 0x0a]),
};

function fakeFetch(urls: string[], failing?: string, mode: 'status' | 'throw' = 'status'): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input);
    urls.push(url);
    const name = url.split('/').pop()!;
    if (name === failing) {
      if (mode === 'throw') throw new TypeError('fetch failed');
      return new Response('Not Found', { status: 404, statusText: 'Not Found' });
    }
    return new Response(BODIES[name]!.slice(), { status: 200 });
  }) as typeof fetch;
}

describe('fetchSource', () => {
  test('downloads from the pinned commit', async () => {
    const pinned = (await loadPackConfig(fileURLToPath(new URL('../../../languages/pt-BR', import.meta.url)))).sources.vero;
    expect(pinned.repo).toBe('LibreOffice/dictionaries');
    expect(pinned.commit).toMatch(/^[0-9a-f]{40}$/);
    expect(pinned.dic).toBe('pt_BR/pt_BR.dic');
    expect(pinned.aff).toBe('pt_BR/pt_BR.aff');

    const outDir = await mkdtemp(join(tmpdir(), 'dict-fetch-'));
    const urls: string[] = [];
    const files = await fetchSource(SOURCE, outDir, fakeFetch(urls));

    expect(urls.sort()).toEqual([
      `https://raw.githubusercontent.com/LibreOffice/dictionaries/${SOURCE.commit}/pt_BR/pt_BR.aff`,
      `https://raw.githubusercontent.com/LibreOffice/dictionaries/${SOURCE.commit}/pt_BR/pt_BR.dic`,
    ]);
    expect(files).toEqual({ dicPath: join(outDir, 'pt_BR.dic'), affPath: join(outDir, 'pt_BR.aff') });
    // Bytes are written untouched (the .dic may be ISO-8859-1).
    expect(new Uint8Array(await readFile(files.dicPath))).toEqual(BODIES['pt_BR.dic']);
    expect(new Uint8Array(await readFile(files.affPath))).toEqual(BODIES['pt_BR.aff']);
  });

  test('fails naming the file that did not download', async () => {
    const outDir = await mkdtemp(join(tmpdir(), 'dict-fetch-'));
    await expect(fetchSource(SOURCE, outDir, fakeFetch([], 'pt_BR.aff'))).rejects.toThrow(
      /pt_BR\/pt_BR\.aff.*404/,
    );
    await expect(fetchSource(SOURCE, outDir, fakeFetch([], 'pt_BR.dic', 'throw'))).rejects.toThrow(
      /pt_BR\/pt_BR\.dic.*fetch failed/,
    );
  });
});
