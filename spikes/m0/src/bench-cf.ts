/**
 * Cloudflare benchmark (M0 spike, disposable; deploy authorized by D1).
 *
 * Publishes `bwords-m0-spike`, listens to `wrangler tail --format json`, sends one cold `/load`,
 * 100 `/solve` and 20 `/generate` requests (one operation each), pairs each request with its tail
 * events to read the CPU time Cloudflare reports, and writes `results/cf.json`. The Worker is removed
 * with `wrangler delete` in a `finally`, whatever happened before, and its absence is checked.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATE_SEEDS, SOLVE_SEEDS } from './boards.ts';

const WORKER = 'bwords-m0-spike';
const SPIKE_DIR = fileURLToPath(new URL('..', import.meta.url));
const RESULTS = join(SPIKE_DIR, 'results');
const require = createRequire(import.meta.url);
const WRANGLER = join(dirname(require.resolve('wrangler/package.json')), 'bin', 'wrangler.js');

const ms = (n: number) => Math.round(n * 100) / 100;
const PACE_MS = 1100;
const MAX_RETRIES = 3;

interface CmdResult {
  code: number | null;
  out: string;
}

function wrangler(args: string[]): Promise<CmdResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [WRANGLER, ...args], { cwd: SPIKE_DIR, windowsHide: true });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    child.once('error', reject);
    child.once('close', (code) => resolve({ code, out }));
  });
}

/** Splits a stream of (possibly pretty-printed) JSON objects into parsed objects. */
function jsonObjects(onObject: (o: unknown) => void): (chunk: string) => void {
  let buf = '';
  let depth = 0;
  let inString = false;
  let escaped = false;
  let start = -1;
  return (chunk) => {
    const offset = buf.length;
    buf += chunk;
    for (let i = offset; i < buf.length; i++) {
      const ch = buf[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (ch === '\\') escaped = true;
        else if (ch === '"') inString = false;
      } else if (ch === '"') {
        if (depth > 0) inString = true;
      } else if (ch === '{') {
        if (depth++ === 0) start = i;
      } else if (ch === '}' && depth > 0 && --depth === 0) {
        try {
          onObject(JSON.parse(buf.slice(start, i + 1)));
        } catch {
          // not an event (e.g. a banner line with braces)
        }
        buf = buf.slice(i + 1);
        i = -1;
      }
    }
    if (depth === 0) buf = '';
  };
}

type TailEvent = Record<string, unknown> & {
  event?: { request?: { url?: string } } | null;
  cpuTime?: number;
  wallTime?: number;
  executionModel?: string;
  entrypoint?: string;
  outcome?: string;
};

interface RequestRecord {
  r: number;
  /** Value of the `r` query parameter, used to pair the request with its tail events. */
  tag: string;
  attempt: number;
  route: string;
  seed: number | null;
  status: number;
  wallMs: number;
  body: Record<string, unknown>;
}

async function main() {
  const startedAt = new Date().toISOString();
  const result: Record<string, unknown> = { worker: WORKER, startedAt };
  const tailEvents: TailEvent[] = [];
  let tail: ChildProcess | undefined;
  let deployed = false;

  try {
    console.log(`deploying ${WORKER}...`);
    const deploy = await wrangler(['deploy']);
    const url = /https:\/\/[\w.-]+\.workers\.dev/.exec(deploy.out)?.[0];
    if (deploy.code !== 0 || !url) throw new Error(`wrangler deploy failed (code ${deploy.code}):\n${deploy.out}`);
    deployed = true;
    result.url = url;
    console.log(`deployed at ${url}`);

    // Tail first, so the cold /load is captured.
    tail = spawn(process.execPath, [WRANGLER, 'tail', WORKER, '--format', 'json'], { cwd: SPIKE_DIR, windowsHide: true });
    const feed = jsonObjects((o) => tailEvents.push(o as TailEvent));
    let tailLog = '';
    tail.stdout!.setEncoding('utf8');
    tail.stderr!.setEncoding('utf8');
    tail.stdout!.on('data', (d: string) => {
      tailLog = (tailLog + d).slice(-2000);
      feed(d);
    });
    tail.stderr!.on('data', (d: string) => (tailLog = (tailLog + d).slice(-2000)));
    const readyBy = Date.now() + 30_000;
    while (!/connected|created tail/i.test(tailLog) && Date.now() < readyBy) await sleep(250);
    await sleep(3000);
    result.tailBanner = tailLog.trim().slice(0, 300);

    const plan: { route: string; seed: number | null }[] = [
      { route: '/load', seed: null },
      ...SOLVE_SEEDS.map((seed) => ({ route: '/solve', seed })),
      ...GENERATE_SEEDS.map((seed) => ({ route: '/generate', seed })),
    ];
    const tagOf = (e: TailEvent) => new URL(e.event?.request?.url ?? 'http://x/').searchParams.get('r');
    const eventsFor = (tag: string) => tailEvents.filter((e) => tagOf(e) === tag);

    // `wrangler tail` samples when events arrive faster than ~1/s, so requests are paced and a
    // request whose events never arrived is sent again (same seed, same operation) with a new tag.
    // The cold /load cannot be repeated: it goes first, before the tail has any backlog.
    let lastStart = 0;
    const send = async (r: number, attempt: number): Promise<RequestRecord> => {
      const step = plan[r]!;
      const tag = attempt === 0 ? String(r) : `${r}.${attempt}`;
      await sleep(Math.max(0, lastStart + PACE_MS - Date.now()));
      lastStart = Date.now();
      const target = `${url}${step.route}?r=${tag}${step.seed === null ? '' : `&seed=${step.seed}`}`;
      const t = performance.now();
      const res = await fetch(target);
      const text = await res.text();
      const wallMs = ms(performance.now() - t);
      let body: Record<string, unknown>;
      try {
        body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        body = { raw: text.slice(0, 500) };
      }
      return { r, tag, attempt, route: step.route, seed: step.seed, status: res.status, wallMs, body };
    };
    const hasDoEvent = (q: RequestRecord) => eventsFor(q.tag).some((e) => typeof e.cpuTime === 'number' && e.executionModel === 'durableObject');

    const requests: RequestRecord[] = [];
    for (let r = 0; r < plan.length; r++) {
      requests.push(await send(r, 0));
      if (r === 0) console.log(`/load -> ${requests[0]!.status} ${JSON.stringify(requests[0]!.body)}`);
      if (r % 20 === 0) console.log(`sent ${r + 1}/${plan.length}, tail events ${tailEvents.length}`);
    }
    const load = requests[0]!;
    if (load.status !== 200) result.loadError = `HTTP ${load.status}: ${JSON.stringify(load.body).slice(0, 500)}`;

    const settle = async (pending: () => boolean, maxMs: number) => {
      const by = Date.now() + maxMs;
      while (pending() && Date.now() < by) await sleep(1000);
    };
    await settle(() => requests.some((q) => !hasDoEvent(q)), 30_000);
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const missing = requests.filter((q) => q.r > 0 && !hasDoEvent(q));
      if (missing.length === 0) break;
      console.log(`retry ${attempt}: ${missing.length} requests without a tail event`);
      for (const q of missing) requests[q.r] = await send(q.r, attempt);
      await settle(() => requests.some((q) => !hasDoEvent(q)), 30_000);
    }
    await sleep(3000); // late events

    const cpuFields = [...new Set(tailEvents.flatMap((e) => Object.keys(e)))].sort();
    result.tailEventFields = cpuFields;
    const records = requests.map((q) => {
      const evs = eventsFor(q.tag);
      const withCpu = evs.filter((e) => typeof e.cpuTime === 'number');
      // The Durable Object invocation does the work; the Worker invocation only forwards.
      const doEvent =
        withCpu.find((e) => e.executionModel === 'durableObject' || e.entrypoint === 'SpikeDO') ??
        withCpu.reduce<TailEvent | undefined>((a, e) => (a && a.cpuTime! >= e.cpuTime! ? a : e), undefined);
      const workerEvent = withCpu.find((e) => e !== doEvent);
      return {
        r: q.r,
        attempt: q.attempt,
        route: q.route,
        seed: q.seed,
        status: q.status,
        wallMs: q.wallMs,
        cpuMs: doEvent?.cpuTime ?? null,
        serverWallMs: doEvent?.wallTime ?? null,
        workerCpuMs: workerEvent?.cpuTime ?? null,
        tailEvents: evs.length,
        outcome: doEvent?.outcome ?? evs[0]?.outcome ?? null,
        loadedNow: q.body.loadedNow ?? null,
        loadMs: q.body.loadMs ?? null,
        words: q.body.wordCount ?? q.body.words ?? null,
        attempts: q.body.attempts ?? null,
        error: q.body.error ?? null,
      };
    });
    result.cpuSource = records.every((x) => typeof x.cpuMs === 'number')
      ? 'wrangler tail --format json (cpuTime of the Durable Object invocation)'
      : 'incomplete: some tail events had no cpuTime';
    result.records = records;
  } catch (err) {
    result.error = (err as Error).message;
    console.error(`benchmark failed: ${result.error}`);
  } finally {
    tail?.kill();
    // Raw events minus the request headers and `cf` geo/TLS data (client IP, location).
    const sanitized = tailEvents.map((e) => ({
      url: e.event?.request?.url ?? null,
      executionModel: e.executionModel ?? null,
      entrypoint: e.entrypoint ?? null,
      outcome: e.outcome ?? null,
      cpuTime: e.cpuTime ?? null,
      wallTime: e.wallTime ?? null,
      eventTimestamp: e.eventTimestamp ?? null,
      exceptions: e.exceptions ?? [],
    }));
    await writeFile(join(RESULTS, 'cf-tail.json'), `${JSON.stringify(sanitized, null, 2)}\n`).catch(() => {});
    console.log(`deleting ${WORKER}...`);
    const del = await wrangler(['delete', '--name', WORKER, '--force']);
    const check = await wrangler(['deployments', 'list', '--name', WORKER]);
    const gone = check.code !== 0 && /does not exist/i.test(check.out);
    result.removal = {
      deployed,
      deleteExitCode: del.code,
      deleteOutput: tidy(del.out),
      checkedAt: new Date().toISOString(),
      check: `wrangler deployments list --name ${WORKER}`,
      checkOutput: tidy(check.out),
      workerRemoved: gone,
    };
    await writeFile(join(RESULTS, 'cf.json'), `${JSON.stringify(result, null, 2)}\n`);
    console.log(`worker removed: ${gone}; results -> ${join(RESULTS, 'cf.json')}`);
    if (result.error || !gone) process.exitCode = 1;
  }
}

/** Drops ANSI colors, the account id, wrangler's log-file line and blank lines. */
function tidy(s: string): string {
  return s
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\/accounts\/[0-9a-f]+\//g, '/accounts/<account-id>/')
    .split('\n')
    .filter((l) => l.trim() && !/Logs were written/.test(l))
    .join('\n')
    .slice(0, 1000);
}

function sleep(n: number) {
  return new Promise((r) => setTimeout(r, n));
}

await mkdir(RESULTS, { recursive: true });
await main();
