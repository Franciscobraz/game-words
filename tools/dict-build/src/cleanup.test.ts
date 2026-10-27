import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { cleanupVero } from './cleanup.ts';

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

/** Cleans fixtures/enclitic.dic/.aff (enfronhar/ak, dar/ae, menas/ý, casa). */
async function clean() {
  const workDir = await mkdtemp(join(tmpdir(), 'cleanup-'));
  const cleanup = await cleanupVero(fixture('enclitic.dic'), fixture('enclitic.aff'), workDir);
  const forms: string[] = [];
  for await (const f of cleanup.forms) forms.push(f);
  return { forms, report: cleanup.report() };
}

// The first real `unmunch` run in a file takes ~4.5 s, close to Vitest's 5 s default timeout.
describe('cleanupVero', { timeout: 30_000 }, () => {
  test('drops forbidden words', async () => {
    const { forms, report } = await clean();
    expect(forms).not.toContain('menas');
    expect(forms).toContain('casa');
    expect(report.forbidden).toEqual({ count: 1, examples: ['menas'] });
  });

  test('drops enclitic-only forms', async () => {
    const { forms, report } = await clean();
    for (const f of ['enfronhamo', 'enfronharmo', 'enfronhá', 'damo', 'darmo', 'comemo', 'comermo', 'comê', 'compô'])
      expect(forms).not.toContain(f);
    // Legitimate forms stay: finite verbs, the hyphenated enclitic forms, superlatives, and "dá",
    // which the fragment rule makes too but the irregular-verb rule makes as a real form.
    for (const f of [
      'enfronhar',
      'enfronhamos',
      'enfronharmos',
      'enfronho',
      'enfronhamo-nos',
      'enfronhá-lo',
      'enfronhadíssimo',
      'enfronhadíssimos',
      'enfronhadíssima',
      'dar',
      'damos',
      'dá',
      'comer',
      'comemos',
      'compor',
    ]) {
      expect(forms).toContain(f);
    }
    expect(report.enclitic).toEqual({
      count: 9,
      examples: ['comemo', 'comermo', 'compô', 'comê', 'damo', 'darmo', 'enfronhamo', 'enfronharmo', 'enfronhá'],
    });
  });
});
