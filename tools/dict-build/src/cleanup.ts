/**
 * VERO cleanup: forbidden entries and enclitic-only fragments.
 *
 * Where "enfronhamo" comes from. `enfronhar/ajkLMYÂ` gets its finite forms from flag `a`; flag `k` adds the
 * hyphenated enclitic forms (`SFX k r mo-nos [aei]r` -> "enfronhamo-nos", `SFX k ar á-lo ar` ->
 * "enfronhá-lo"). Flag `a` also carries, without any hyphen, the piece of those forms before the hyphen:
 *
 *   SFX a   r    mo     [aei]r   -> enfronhamo    (enfronhamo-nos)
 *   SFX a   0    mo     [aei]r   -> enfronharmo   (enfronharmo-nos)
 *   SFX a   0    emo    [aei]r   -> enfronharemo
 *   SFX a   ar   emo    [^cgç]ar -> enfronhemo    (enfronhemo-nos)
 *   SFX a   çar  cemo   çar, car quemo car, cer çamo cer, ger jamo ger, guer gamo guer, ir amo [^c]ir, cir çamo cir
 *   SFX a   ar   á      ar       -> enfronhá      (enfronhá-lo, enfronhá-lo-ei)
 *   SFX a   er   ê      er, or ô or (and the same three in flags c, d, e, f, h, i)
 *
 * They are the 1st person plural with the "s" dropped before -nos/-vos/-lo, and the infinitive with the
 * "r" dropped before -lo/-la. `unmunch` prints them as words of their own.
 *
 * A rule is an enclitic fragment rule when, with no hyphen in its append:
 *  - its append ends in "mo", its condition ends in "r" (a verb), the same flag has the twin rule with
 *    append + "s" (same strip and condition) and no feminine twin ending in "ma" (which marks
 *    adjectives and nouns such as "-díssimo"); or
 *  - it turns a generic "ar"/"er"/"or" infinitive (condition equal to the strip) into "á"/"ê"/"ô".
 *    Rules with a specific condition (`SFX e ar á dar`, `SFX h er ê ver`, `SFX e er ê [^l]er`...) are kept:
 *    they make real forms of irregular verbs ("dá", "vê", "crê").
 * The pair is expanded without those rules. A form those rules made that another rule or entry also makes
 * ("enfronhamos", "dá") stays; one only they made ("enfronhamo", "enfronhá") is counted as removed.
 *
 * `FORBIDDENWORD` (flag `ý` in VERO) marks entries Hunspell rejects ("menas", "ague"): those forms are
 * dropped from the expansion, whatever rule makes them.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type ExpandOptions, affEncoding, expandForms } from './unmunch.ts';

export const CLEANUP_EXAMPLES = 20;

export interface Removal {
  count: number;
  /** Up to 20 removed forms, in code point order. */
  examples: string[];
}

export interface CleanupReport {
  forbidden: Removal;
  enclitic: Removal;
}

export interface VeroCleanup {
  /** The cleaned expansion of the pair, one form at a time. */
  forms: AsyncGenerator<string>;
  /** What the cleanup removed. Available once `forms` is exhausted. */
  report(): CleanupReport;
}

const ACCENTED: Record<string, string> = { ar: 'á', er: 'ê', or: 'ô' };

interface Rule {
  line: number;
  flag: string;
  strip: string;
  append: string;
  cond: string;
}

function parseRules(lines: string[]): Rule[] {
  const rules: Rule[] = [];
  lines.forEach((l, line) => {
    const p = l.trim().split(/\s+/);
    if (p[0] === 'SFX' && p.length >= 5) {
      rules.push({ line, flag: p[1]!, strip: p[2]!, append: p[3]!.split('/')[0]!, cond: p[4]! });
    }
  });
  return rules;
}

/** Line numbers of the enclitic fragment rules (see the header). */
export function fragmentRules(affLines: string[]): Set<number> {
  const rules = parseRules(affLines);
  const appends = new Map<string, Set<string>>();
  const key = (r: Rule) => `${r.flag}\0${r.strip}\0${r.cond}`;
  for (const r of rules) {
    let set = appends.get(key(r));
    if (!set) appends.set(key(r), (set = new Set()));
    set.add(r.append);
  }
  const out = new Set<number>();
  for (const r of rules) {
    if (r.append.includes('-')) continue;
    const twins = appends.get(key(r))!;
    const truncated =
      r.append.endsWith('mo') && r.cond.endsWith('r') && twins.has(`${r.append}s`) && !twins.has(`${r.append.slice(0, -1)}a`);
    const infinitive = r.cond === r.strip && ACCENTED[r.strip] === r.append;
    if (truncated || infinitive) out.add(r.line);
  }
  return out;
}

/** Drops the rule lines in `drop` and fixes each `SFX flag Y n` header count; a group left empty loses its header. */
function withoutRules(lines: string[], drop: (line: number) => boolean): string[] {
  const out: string[] = [];
  let header = -1;
  let kept = 0;
  const closeGroup = () => {
    if (header < 0) return;
    if (kept === 0) out[header] = '\0';
    else out[header] = out[header]!.replace(/^(\s*SFX\s+\S+\s+\S+\s+)\d+/, `$1${kept}`);
    header = -1;
  };
  lines.forEach((l, i) => {
    const p = l.trim().split(/\s+/);
    if (p[0] === 'SFX' && p.length === 4 && /^\d+$/.test(p[3]!)) {
      closeGroup();
      header = out.length;
      kept = 0;
      out.push(l);
    } else if (p[0] === 'SFX' && p.length >= 5) {
      if (!drop(i)) {
        out.push(l);
        kept++;
      }
    } else {
      out.push(l);
    }
  });
  closeGroup();
  return out.filter((l) => l !== '\0');
}

function encode(text: string, encoding: string): Buffer {
  if (encoding === 'utf-8') return Buffer.from(text, 'utf8');
  if (encoding === 'iso-8859-1') return Buffer.from(text, 'latin1');
  throw new Error(`cleanup: unsupported .aff SET ${encoding}`);
}

function removal(forms: Iterable<string>): Removal {
  const all = [...forms].sort();
  return { count: all.length, examples: all.slice(0, CLEANUP_EXAMPLES) };
}

/**
 * Expands a Hunspell pair without its FORBIDDENWORD entries and without the forms that only enclitic
 * fragment rules make. `workDir` receives the rewritten .aff files.
 */
export async function cleanupVero(
  dicPath: string,
  affPath: string,
  workDir: string,
  opts: ExpandOptions = {},
): Promise<VeroCleanup> {
  const encoding = await affEncoding(affPath);
  const decoder = new TextDecoder(encoding);
  const affText = decoder.decode(await readFile(affPath)).replace(/^﻿/, '');
  const aff = affText.split('\n');

  const forbiddenFlag = /^[ \t]*FORBIDDENWORD[ \t]+(\S+)/m.exec(affText)?.[1];
  const forbidden = new Set<string>();
  if (forbiddenFlag) {
    const dic = decoder.decode(await readFile(dicPath)).replace(/^﻿/, '').split('\n');
    for (const line of dic.slice(1)) {
      const slash = line.indexOf('/');
      if (slash > 0 && line.slice(slash + 1).split(/\s/)[0]!.includes(forbiddenFlag)) forbidden.add(line.slice(0, slash));
    }
  }

  const fragments = fragmentRules(aff);
  await mkdir(workDir, { recursive: true });
  const cleanAff = join(workDir, 'clean.aff');
  const fragmentAff = join(workDir, 'fragments.aff');
  await writeFile(cleanAff, encode(withoutRules(aff, (i) => fragments.has(i)).join('\n'), encoding));
  await writeFile(fragmentAff, encode(withoutRules(aff, (i) => !fragments.has(i)).join('\n'), encoding));

  // Every form the fragment rules make (plus the plain and prefixed forms they share with the full pair).
  const candidates = new Set<string>();
  if (fragments.size > 0) for await (const f of expandForms(dicPath, fragmentAff, opts)) candidates.add(f);

  const droppedForbidden = new Set<string>();
  let done = false;
  async function* forms(): AsyncGenerator<string> {
    for await (const f of expandForms(dicPath, cleanAff, opts)) {
      if (forbidden.has(f)) {
        droppedForbidden.add(f);
        continue;
      }
      candidates.delete(f);
      yield f;
    }
    done = true;
  }

  return {
    forms: forms(),
    report() {
      if (!done) throw new Error('cleanupVero: report() before the forms were all read');
      return {
        forbidden: removal(droppedForbidden),
        enclitic: removal([...candidates].filter((f) => !forbidden.has(f))),
      };
    },
  };
}
