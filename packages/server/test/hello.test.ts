import { generateBoard, LanguagePack, MIN_WORDS } from '@bwords/core';
import { runInDurableObject } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { FIXTURE_LETTERS } from './fixture-pack.ts';

const FILES = ['dict.bin', 'common.bin', 'profanity.bin', 'spellings.bin'] as const;

describe('test harness', () => {
  it('a durable object loads the fixture pack from ASSETS', async () => {
    const stub = env.ROOM.get(env.ROOM.idFromName('HELO'));
    const result = await runInDurableObject(stub, async (instance) => {
      const assets = (instance as unknown as { env: Cloudflare.Env }).env.ASSETS;
      const get = async (file: string) => {
        const res = await assets.fetch(`https://assets.local/pt-BR/${file}`);
        expect(res.status, file).toBe(200);
        return res.arrayBuffer();
      };
      const [dict, common, profanity, spellings] = await Promise.all(FILES.map(get));
      const meta = JSON.parse(new TextDecoder().decode(await get('meta.json')));
      const pack = LanguagePack.fromBuffers({ dict: dict!, common: common!, profanity: profanity!, spellings: spellings!, meta });
      const boards = [1, 2, 3].map((seed) => generateBoard(4, seed, pack));
      return { id: pack.meta.id, counts: boards.map((b) => b.wordCount), tiles: boards.flatMap((b) => b.board.flat()) };
    });
    expect(result.id).toBe('pt-BR');
    // Only the fixture letters: the pack came from the fixture, not from the built pt-BR pack.
    for (const tile of result.tiles) expect(FIXTURE_LETTERS).toContain(tile);
    for (const count of result.counts) expect(count).toBeGreaterThanOrEqual(MIN_WORDS[4]!);
  });
});
