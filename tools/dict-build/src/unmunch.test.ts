import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { expandForms } from './unmunch.ts';

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

async function collect(forms: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const f of forms) out.push(f);
  return out;
}

describe('expandForms', () => {
  test('expands fixture forms', async () => {
    const forms = await collect(expandForms(fixture('mini.dic'), fixture('mini.aff')));
    expect(forms.sort()).toEqual(
      [
        'casa', 'casas',
        'cantar', 'cantou', 'descantar', 'descantou',
        'mãe', 'mães',
        'Brasil', 'guarda-chuva',
      ].sort(),
    );
  });

  test('decodes per the aff SET encoding', async () => {
    // latin1.dic is ISO-8859-1 bytes ("m\xe3e"); read as UTF-8 they would become U+FFFD.
    const forms = await collect(expandForms(fixture('latin1.dic'), fixture('latin1.aff')));
    expect(forms.sort()).toEqual(['coração', 'mãe', 'mães', 'pão']);
  });

  test('fails naming unmunch when missing', async () => {
    const forms = expandForms(fixture('mini.dic'), fixture('mini.aff'), { command: 'unmunch-not-installed' });
    await expect(collect(forms)).rejects.toThrow(/unmunch not found.*unmunch-not-installed/);
  });
});
