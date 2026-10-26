import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { expandForms } from './unmunch.ts';

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

async function collect(forms: AsyncIterable<string>): Promise<string[]> {
  const out: string[] = [];
  for await (const f of forms) out.push(f);
  return out;
}

describe('FLAG UTF-8', () => {
  test('keeps utf-8 flags that share a first byte apart', async () => {
    // À, Á, Ã and Ä all start with byte 0xC3; read byte by byte each would apply the others' rules,
    // and the condition [^í] (0xC3 0xAD) would also reject "ético" (0xC3 0xA9).
    const forms = await collect(expandForms(fixture('utf8flags.dic'), fixture('utf8flags.aff')));
    expect(forms.sort()).toEqual(
      ['bar', 'barb', 'bars', 'foo', 'fooa', 'mão', 'mãoa', 'mãoc', 'ético', 'antiético'].sort(),
    );
  });
});
