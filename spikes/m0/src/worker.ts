/**
 * M0 spike (disposable, D2): a Durable Object that loads the pt-BR DAWG from the Worker's static
 * assets and runs exactly one operation per request, so each request's CPU time measures one thing.
 *
 *   /load            loads the dictionary (cold on the first request) and reports the load wall time
 *   /solve?seed=N    solves one seeded random 6x6 board
 *   /generate?seed=N generates one playable 6x6 board
 */
import { DurableObject } from 'cloudflare:workers';
import { Dawg, generateBoard, mulberry32, solve } from '@bwords/core';

interface Env {
  ASSETS: Fetcher;
  SPIKE: DurableObjectNamespace<SpikeDO>;
}

const DICT_URL = 'https://assets.local/pt-BR.dict.bin';
const SIZE = 6;

/** Seeded random 6x6 board: letters by dictionary weight, at most 4 copies, Q only as "qu". */
function randomBoard(seed: number, weights: Float64Array): string[][] {
  const rng = mulberry32(seed);
  const copies = new Array<number>(26).fill(0);
  const board: string[][] = [];
  for (let r = 0; r < SIZE; r++) {
    const row: string[] = [];
    for (let c = 0; c < SIZE; c++) {
      let total = 0;
      for (let l = 0; l < 26; l++) if (copies[l]! < 4) total += weights[l]!;
      let x = rng() * total;
      let pick = -1;
      for (let l = 0; l < 26; l++) {
        if (copies[l]! >= 4 || weights[l]! <= 0) continue;
        pick = l;
        x -= weights[l]!;
        if (x < 0) break;
      }
      copies[pick]!++;
      row.push(pick === 16 ? 'qu' : String.fromCharCode(97 + pick));
    }
    board.push(row);
  }
  return board;
}

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
          const g = generateBoard(SIZE, seed, dawg);
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
    return env.SPIKE.get(env.SPIKE.idFromName('m0')).fetch(request);
  },
} satisfies ExportedHandler<Env>;
