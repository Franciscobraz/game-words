import { describe, expect, test } from 'vitest';
import { loadCommonWords } from './frequency.ts';
import type { FrequencySource } from './pack.ts';

const SOURCE: FrequencySource = {
  repo: 'hermitdave/FrequencyWords',
  commit: '525f9b560de45753a5ea01069454e72e9aa541c6',
  path: 'content/2018/pt_br/pt_br_full.txt',
  top: 3,
};

/** Serves `body` as the frequency list and records the requested URLs. */
function listFetch(body: string, urls: string[] = []): typeof fetch {
  return (async (input: string | URL | Request) => {
    urls.push(String(input));
    return new Response(body, { status: 200 });
  }) as typeof fetch;
}

const dictionary = (...words: string[]) => new Set(words);

describe('loadCommonWords', () => {
  test('marks the top forms as common', async () => {
    const urls: string[] = [];
    const body = ['casa 900', 'mesa 800', 'bola 700', 'gato 600', 'pato 500'].join('\n');
    const common = await loadCommonWords(SOURCE, dictionary('casa', 'mesa', 'bola', 'gato', 'pato'), listFetch(body, urls));
    expect(common.sort()).toEqual(['bola', 'casa', 'mesa']);
    expect(urls).toEqual([
      'https://raw.githubusercontent.com/hermitdave/FrequencyWords/525f9b560de45753a5ea01069454e72e9aa541c6/content/2018/pt_br/pt_br_full.txt',
    ]);
  });

  test('sums colliding forms before ranking', async () => {
    // Alone, "faca" (10) and "faça" (5) lose to "casa" (12); together (15) "faca" ranks first.
    const body = ['casa 12', 'faca 10', 'gato 7', 'faça 5'].join('\r\n');
    const common = await loadCommonWords({ ...SOURCE, top: 1 }, dictionary('casa', 'faca', 'gato'), listFetch(body));
    expect(common).toEqual(['faca']);
  });

  test('ignores forms outside the dictionary', async () => {
    const body = ['xyzzy 1000', 'casa 900', 'quux 850', 'mesa 800', 'bola 700', 'gato 600'].join('\n');
    const common = await loadCommonWords(SOURCE, dictionary('casa', 'mesa', 'bola', 'gato'), listFetch(body));
    expect(common.sort()).toEqual(['bola', 'casa', 'mesa']);
  });
});
