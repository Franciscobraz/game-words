import { spawn } from 'node:child_process';
import { mkdtemp, open, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { wholeCharFlags } from './flags.ts';

export interface ExpandOptions {
  /** unmunch executable name (default "unmunch"). */
  command?: string;
  /** WSL distribution used on Windows (default: env BWORDS_WSL_DISTRO, else WSL's default). */
  wslDistro?: string;
}

/** Hunspell `SET` value of an .aff file mapped to a TextDecoder label. Hunspell's default is ISO8859-1. */
export async function affEncoding(affPath: string): Promise<string> {
  const file = await open(affPath);
  try {
    const head = Buffer.alloc(64 * 1024);
    const { bytesRead } = await file.read(head, 0, head.length, 0);
    const text = head.subarray(0, bytesRead).toString('latin1').replace(/^\xef\xbb\xbf/, '');
    const set = /^[ \t]*SET[ \t]+(\S+)/m.exec(text)?.[1];
    return toDecoderLabel(set ?? 'ISO8859-1');
  } finally {
    await file.close();
  }
}

function toDecoderLabel(set: string): string {
  const s = set.toLowerCase();
  const iso = /^iso-?8859-?(\d+)$/.exec(s);
  if (iso) return `iso-8859-${iso[1]}`;
  if (s.startsWith('microsoft-')) return s.slice('microsoft-'.length);
  return s;
}

/** C:\a\b -> /mnt/c/a/b */
function toWslPath(p: string): string {
  const abs = resolve(p);
  return abs.replace(/^([A-Za-z]):/, (_, d: string) => `/mnt/${d.toLowerCase()}`).split('\\').join('/');
}

/**
 * Streams every form `unmunch` expands from a Hunspell .dic/.aff pair, one per line, decoded per the
 * .aff `SET`. Runs `unmunch` through WSL on Windows and directly elsewhere. The raw output is never
 * held in memory. A `FLAG UTF-8` pair is first rewritten with one-byte flags (see `wholeCharFlags`).
 */
export async function* expandForms(dicPath: string, affPath: string, opts: ExpandOptions = {}): AsyncGenerator<string> {
  const flagsDir = await mkdtemp(join(tmpdir(), 'bwords-flags-'));
  try {
    const pair = await wholeCharFlags(dicPath, affPath, flagsDir);
    yield* runUnmunch(pair.dicPath, pair.affPath, opts);
  } finally {
    await rm(flagsDir, { recursive: true, force: true });
  }
}

async function* runUnmunch(dicPath: string, affPath: string, opts: ExpandOptions): AsyncGenerator<string> {
  const command = opts.command ?? 'unmunch';
  const decoder = new TextDecoder(await affEncoding(affPath));
  const distro = opts.wslDistro ?? process.env.BWORDS_WSL_DISTRO;
  const [exe, args] =
    process.platform === 'win32'
      ? ['wsl', [...(distro ? ['-d', distro] : []), '--exec', command, toWslPath(dicPath), toWslPath(affPath)]]
      : [command, [dicPath, affPath]];

  const child = spawn(exe, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  // unmunch logs every .aff line on stderr: keep only the tail for error messages.
  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d: string) => (stderr = (stderr + d).slice(-4000)));
  const exited = new Promise<number | null>((res, rej) => {
    child.once('error', rej);
    child.once('close', res);
  });
  exited.catch(() => {}); // handled below

  const notFound = () => new Error(`unmunch not found: could not run "${command}" (${exe} ${args.join(' ')})`);
  let finished = false;
  try {
    let rest = '';
    for await (const chunk of child.stdout as AsyncIterable<Buffer>) {
      const lines = (rest + decoder.decode(chunk, { stream: true })).split('\n');
      rest = lines.pop()!;
      for (const line of lines) {
        const form = line.replace(/\r$/, '');
        if (form) yield form;
      }
    }
    rest += decoder.decode();
    if (rest.replace(/\r$/, '')) yield rest.replace(/\r$/, '');

    let code: number | null;
    try {
      code = await exited;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') throw notFound();
      throw err;
    }
    if (code === 127 || /command not found|execvpe\(.*\) failed/.test(stderr)) throw notFound();
    if (code !== 0) throw new Error(`unmunch exited with code ${code}: ${stderr.trim().split('\n').slice(-3).join(' | ')}`);
    finished = true;
  } finally {
    if (!finished) child.kill();
  }
}
