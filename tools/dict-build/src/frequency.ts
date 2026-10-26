import { classifyForm } from '@bwords/core';
import { rawUrl } from './fetch.ts';
import type { FrequencySource } from './pack.ts';

/**
 * Downloads the pinned frequency list ("word count" per line), normalizes each form, sums the counts of
 * forms that normalize to the same word ("faca" + "faça"), drops words outside `dictionary`, and returns
 * the `source.top` most frequent of the rest, in code point order. Equal counts rank alphabetically.
 */
export async function loadCommonWords(
  source: FrequencySource,
  dictionary: { has(word: string): boolean },
  fetchImpl: typeof fetch = fetch,
): Promise<string[]> {
  const url = rawUrl(source, source.path);
  let res: Response;
  try {
    res = await fetchImpl(url);
  } catch (err) {
    throw new Error(`Download of ${source.path} failed (${url}): ${(err as Error).message}`);
  }
  if (!res.ok) throw new Error(`Download of ${source.path} failed (${url}): HTTP ${res.status} ${res.statusText}`);

  const counts = new Map<string, number>();
  for (const line of (await res.text()).split('\n')) {
    const [form, count] = line.trim().split(/\s+/);
    if (!form || !count) continue;
    const c = classifyForm(form);
    if (!c.ok || !dictionary.has(c.word)) continue;
    counts.set(c.word, (counts.get(c.word) ?? 0) + Number(count));
  }

  return [...counts]
    .sort(([a, x], [b, y]) => y - x || (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, source.top)
    .map(([w]) => w)
    .sort();
}
