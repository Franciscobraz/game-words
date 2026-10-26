import { mkdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

/** Pinned dictionary source: a GitHub repo at a fixed commit and the paths of the .dic/.aff inside it. */
export interface SourceSpec {
  repo: string;
  commit: string;
  dic: string;
  aff: string;
}

export interface SourceFiles {
  dicPath: string;
  affPath: string;
}

export function rawUrl(source: Pick<SourceSpec, 'repo' | 'commit'>, path: string): string {
  return `https://raw.githubusercontent.com/${source.repo}/${source.commit}/${path}`;
}

async function download(source: SourceSpec, path: string, outDir: string, fetchImpl: typeof fetch): Promise<string> {
  const url = rawUrl(source, path);
  let res: Response;
  try {
    res = await fetchImpl(url);
  } catch (err) {
    throw new Error(`Download of ${path} failed (${url}): ${(err as Error).message}`);
  }
  if (!res.ok) throw new Error(`Download of ${path} failed (${url}): HTTP ${res.status} ${res.statusText}`);
  const dest = join(outDir, basename(path));
  await writeFile(dest, new Uint8Array(await res.arrayBuffer()));
  return dest;
}

/** Downloads the .dic and .aff at the pinned commit into `outDir`, bytes untouched. */
export async function fetchSource(source: SourceSpec, outDir: string, fetchImpl: typeof fetch = fetch): Promise<SourceFiles> {
  await mkdir(outDir, { recursive: true });
  const [dicPath, affPath] = await Promise.all([
    download(source, source.dic, outDir, fetchImpl),
    download(source, source.aff, outDir, fetchImpl),
  ]);
  return { dicPath, affPath };
}
