/**
 * M0 spike (disposable, D2): a Durable Object that loads the pt-BR DAWG from the Worker's static
 * assets and runs exactly one operation per request, so each request's CPU time measures one thing.
 *
 *   /load            loads the dictionary (cold on the first request) and reports the load wall time
 *   ?do=NAME         routes to the Durable Object named NAME (default "m0")
 *   /solve?seed=N    solves one seeded random 6x6 board
 *   /generate?seed=N generates one playable 6x6 board
 */
import { DurableObject } from 'cloudflare:workers';
import { Dawg, generateBoard, solve } from '@bwords/core';
import { BOARD_SIZE, randomBoard } from './boards.ts';

interface Env {
  ASSETS: Fetcher;
  SPIKE: DurableObjectNamespace<SpikeDO>;
}

const DICT_URL = 'https://assets.local/pt-BR.dict.bin';

export class SpikeDO extends DurableObject<Env> {
  private dawg: Dawg | undefined;
  private bytes = 0;
  private loadMs = 0;

  /** Loads the dictionary once per instance; returns whether this call did the load. */
  private async ensureLoaded(): Promise<boolean> {
    if (this.dawg) return false;
    const started = Date.now();
    const res = await this.env.ASSETS.fetch(DICT_URL);
    if (!res.ok) throw new Error(`Dictionary asset fetch failed: HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    this.dawg = Dawg.fromBuffer(buf);
    this.bytes = buf.byteLength;
    this.loadMs = Date.now() - started;
    return true;
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const seed = Number(url.searchParams.get('seed') ?? 0) >>> 0;
    try {
      const loadedNow = await this.ensureLoaded();
      const dawg = this.dawg!;
      switch (url.pathname) {
        case '/load':
          return Response.json({ route: '/load', loadedNow, loadMs: this.loadMs, bytes: this.bytes, words: dawg.wordCount });
        case '/solve': {
          const board = randomBoard(seed, dawg.letterWeights);
          const words = solve(board, dawg, 3);
          return Response.json({ route: '/solve', seed, loadedNow, board, wordCount: words.size });
        }
        case '/generate': {
          const g = generateBoard(BOARD_SIZE, seed, dawg);
          return Response.json({ route: '/generate', seed, loadedNow, ...g });
        }
        default:
          return Response.json({ error: 'not found' }, { status: 404 });
      }
    } catch (err) {
      return Response.json({ route: url.pathname, error: String((err as Error).message ?? err) }, { status: 500 });
    }
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // `?do=<name>` picks the Durable Object, so each cold load can hit a fresh instance.
    const name = new URL(request.url).searchParams.get('do') ?? 'm0';
    return env.SPIKE.get(env.SPIKE.idFromName(name)).fetch(request);
  },
} satisfies ExportedHandler<Env>;
