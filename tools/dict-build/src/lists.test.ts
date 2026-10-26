import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { type ListEntry, applyLists, readWordList } from './lists.ts';

async function list(text: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'lists-'));
  const path = join(dir, 'words.txt');
  await writeFile(path, text);
  return path;
}

describe('readWordList', () => {
  test('ignores comments and blank lines', async () => {
    const path = await list('# cabeçalho\n\nrolê\n   \n  # comentário recuado\nfaça\r\n\t\ncasa\n');
    expect(await readWordList(path)).toEqual<ListEntry[]>([
      { word: 'rolê', line: 3 },
      { word: 'faça', line: 6 },
      { word: 'casa', line: 8 },
    ]);
  });
});

describe('applyLists', () => {
  test('fails on an extra word that breaks a filter', () => {
    const extra: ListEntry[] = [
      { word: 'rolê', line: 2 },
      { word: 'ab', line: 5 },
    ];
    expect(() => applyLists({ extra, blocklist: [] })).toThrow(/extra\.txt.*line 5.*"ab".*length/);
    expect(() => applyLists({ extra: [{ word: 'guarda-chuva', line: 1 }], blocklist: [] })).toThrow(
      /extra\.txt.*line 1.*"guarda-chuva".*non-letter/,
    );
    // A valid list passes and keeps the original spelling next to its normalized form.
    expect(applyLists({ extra: [extra[0]!], blocklist: [] }).extra).toEqual([{ word: 'role', spelling: 'rolê', line: 2 }]);
  });

  test('fails on a word in both lists', () => {
    const extra: ListEntry[] = [
      { word: 'casa', line: 1 },
      { word: 'rolê', line: 3 },
    ];
    const blocklist: ListEntry[] = [{ word: 'role', line: 7 }];
    expect(() => applyLists({ extra, blocklist })).toThrow(/"role".*extra\.txt.*line 3.*blocklist\.txt.*line 7/);
  });
});
