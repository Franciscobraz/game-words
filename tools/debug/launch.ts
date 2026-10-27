import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * `npm run debug`: starts `wrangler dev` of the server and the Vite dev server of
 * the debug page, prefixes their output, and stops both when either exits or on
 * Ctrl+C.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

const TASKS = [
  { name: 'server', color: 36, command: 'npm run dev -w @bwords/server' },
  { name: 'debug', color: 35, command: 'npm run dev -w @bwords/debug' },
];

const children: ChildProcess[] = [];
let stopping = false;

/** Writes each complete line of a stream with a colored prefix. */
function pipe(stream: NodeJS.ReadableStream | null, prefix: string, out: NodeJS.WriteStream): void {
  if (!stream) return;
  let rest = '';
  stream.setEncoding('utf8');
  stream.on('data', (chunk: string) => {
    const lines = (rest + chunk).split(/\r?\n/);
    rest = lines.pop() ?? '';
    for (const line of lines) out.write(`${prefix} ${line}\n`);
  });
  stream.on('end', () => {
    if (rest) out.write(`${prefix} ${rest}\n`);
  });
}

/** Kills a child and everything it started; with `shell: true` the child is only the shell. */
function kill(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

function stop(code: number): void {
  if (stopping) return;
  stopping = true;
  for (const child of children) kill(child);
  process.exit(code);
}

for (const task of TASKS) {
  const prefix = `\x1b[${task.color}m[${task.name}]\x1b[0m`;
  const child = spawn(task.command, {
    cwd: root,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    // Its own process group on POSIX, so `kill` reaches the grandchildren.
    detached: process.platform !== 'win32',
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  pipe(child.stdout, prefix, process.stdout);
  pipe(child.stderr, prefix, process.stderr);
  child.on('exit', (code) => {
    process.stdout.write(`${prefix} exited with ${code ?? 'a signal'}\n`);
    stop(code === 0 ? 0 : 1);
  });
  children.push(child);
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(signal, () => stop(0));
process.on('exit', () => {
  for (const child of children) kill(child);
});
