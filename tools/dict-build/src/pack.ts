import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SourceSpec } from './fetch.ts';

/** A frequency list pinned to a commit: `path` inside `repo`, one "word count" per line; the `top` forms are common. */
export interface FrequencySource {
  repo: string;
  commit: string;
  path: string;
  top: number;
}

export interface CompoundTile {
  /** How the tile is drawn, e.g. "Qu". */
  tile: string;
  /** The letters it stands for in a word, e.g. "qu". */
  letters: string;
}

/** `languages/<id>/pack.json`. */
export interface PackConfig {
  id: string;
  name: string;
  alphabet: string;
  compoundTiles: CompoundTile[];
  normalization: 'strip-diacritics';
  minWordLength: number;
  sources: { vero: SourceSpec; frequency: FrequencySource };
}

type Kind = 'string' | 'number' | 'array';

const REQUIRED: [string, Kind][] = [
  ['id', 'string'],
  ['name', 'string'],
  ['alphabet', 'string'],
  ['compoundTiles', 'array'],
  ['normalization', 'string'],
  ['minWordLength', 'number'],
  ['sources.vero.repo', 'string'],
  ['sources.vero.commit', 'string'],
  ['sources.vero.dic', 'string'],
  ['sources.vero.aff', 'string'],
  ['sources.frequency.repo', 'string'],
  ['sources.frequency.commit', 'string'],
  ['sources.frequency.path', 'string'],
  ['sources.frequency.top', 'number'],
];

function at(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Reads `<dir>/pack.json` and fails naming the first required field that is missing or of the wrong type. */
export async function loadPackConfig(dir: string): Promise<PackConfig> {
  const file = join(dir, 'pack.json');
  const raw: unknown = JSON.parse(await readFile(file, 'utf8'));
  for (const [path, kind] of REQUIRED) {
    const v = at(raw, path);
    const ok = kind === 'array' ? Array.isArray(v) : typeof v === kind && v !== '';
    if (!ok) throw new Error(`${file}: missing or invalid field "${path}" (expected ${kind})`);
  }
  const pack = raw as PackConfig;
  if (pack.normalization !== 'strip-diacritics') {
    throw new Error(`${file}: field "normalization" must be "strip-diacritics", got "${pack.normalization}"`);
  }
  pack.compoundTiles.forEach((t, i) => {
    for (const k of ['tile', 'letters'] as const) {
      if (typeof t?.[k] !== 'string' || !t[k]) throw new Error(`${file}: missing or invalid field "compoundTiles[${i}].${k}"`);
    }
  });
  return pack;
}
