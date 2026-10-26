import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const LATIN1_MAX = 0xff;

/**
 * `unmunch` reads affix flags byte by byte. With `FLAG UTF-8`, flags that share a first byte (À, Á, Ã
 * are all 0xC3 0x8?) then apply each other's rules. When every character of the pair fits in ISO-8859-1
 * (true for pt_BR), this rewrites the .aff/.dic into `outDir` as `SET ISO8859-1` with the `FLAG` line
 * removed: each flag becomes one byte of its own, and so does each letter inside affix conditions such as
 * `[^iíhrs]`, which byte-wise UTF-8 would also misread. Continuation flags that are only markers (no
 * PFX/SFX of their own, e.g. NOSUGGEST) are dropped, since `unmunch` would print them inside the forms.
 * Returns the input paths when the .aff does not declare `FLAG UTF-8`.
 */
export async function wholeCharFlags(
  dicPath: string,
  affPath: string,
  outDir: string,
): Promise<{ dicPath: string; affPath: string }> {
  const aff = (await readFile(affPath, 'utf8')).replace(/^﻿/, '').split('\n');
  if (!aff.some((l) => /^[ \t]*FLAG[ \t]+UTF-8\b/.test(l))) return { dicPath, affPath };
  const dic = (await readFile(dicPath, 'utf8')).replace(/^﻿/, '');

  const latin1 = (text: string, file: string) => {
    for (const ch of text) {
      if (ch.codePointAt(0)! > LATIN1_MAX) {
        throw new Error(`FLAG UTF-8: ${file} has "${ch}", outside ISO-8859-1; one-byte flags are not possible`);
      }
    }
    return Buffer.from(text, 'latin1');
  };

  const affixFlags = new Set<string>();
  for (const line of aff) {
    const p = line.trim().split(/\s+/);
    if ((p[0] === 'PFX' || p[0] === 'SFX') && p.length === 4) affixFlags.add(p[1]!);
  }

  const affOut = aff.flatMap((line) => {
    if (/^[ \t]*FLAG[ \t]/.test(line)) return [];
    if (/^[ \t]*SET[ \t]/.test(line)) return ['SET ISO8859-1'];
    // Rule line: "PFX|SFX flag strip append[/cont] cond ..."
    const rule = /^([ \t]*(?:PFX|SFX)[ \t]+\S+[ \t]+\S+[ \t]+[^\s/]+)\/(\S*)(.*)$/.exec(line);
    if (!rule) return [line];
    if ([...rule[2]!].some((c) => affixFlags.has(c))) {
      throw new Error(`FLAG UTF-8: unmunch cannot expand continuation flags (${line.trim()})`);
    }
    return [`${rule[1]}${rule[3]}`];
  });

  const out = { dicPath: join(outDir, 'flags.dic'), affPath: join(outDir, 'flags.aff') };
  await writeFile(out.affPath, latin1(affOut.join('\n'), affPath));
  await writeFile(out.dicPath, latin1(dic, dicPath));
  return out;
}
