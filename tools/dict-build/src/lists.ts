import { readFile } from 'node:fs/promises';
import { classifyForm } from '@bwords/core';

/** One word of a pack `.txt` list, as written, with its 1-based line number. */
export interface ListEntry {
  word: string;
  line: number;
}

export interface ExtraWord {
  /** Normalized form stored in the dictionary. */
  word: string;
  /** The spelling written in extra.txt. */
  spelling: string;
  line: number;
}

export interface AppliedLists {
  extra: ExtraWord[];
  /** Normalized forms to remove from the dictionary. */
  blocked: string[];
}

/** Reads a word list: one word per line; lines starting with `#` and blank lines are skipped. */
export async function readWordList(path: string): Promise<ListEntry[]> {
  const lines = (await readFile(path, 'utf8')).replace(/^﻿/, '').split('\n');
  const entries: ListEntry[] = [];
  lines.forEach((raw, i) => {
    const word = raw.trim();
    if (word && !word.startsWith('#')) entries.push({ word, line: i + 1 });
  });
  return entries;
}

function normalize(file: string, e: ListEntry): string {
  const c = classifyForm(e.word);
  if (!c.ok) throw new Error(`${file} line ${e.line}: "${e.word}" fails the ${c.reason} filter`);
  return c.word;
}

/**
 * Normalizes extra.txt and blocklist.txt with the dictionary filters. Fails on an extra word that breaks
 * a filter, and on a normalized form present in both lists.
 */
export function applyLists(lists: { extra: ListEntry[]; blocklist: ListEntry[] }): AppliedLists {
  const extra = lists.extra.map((e) => ({ word: normalize('extra.txt', e), spelling: e.word, line: e.line }));
  const blockedAt = new Map<string, number>();
  for (const e of lists.blocklist) {
    const word = normalize('blocklist.txt', e);
    if (!blockedAt.has(word)) blockedAt.set(word, e.line);
  }
  for (const e of extra) {
    const line = blockedAt.get(e.word);
    if (line !== undefined) {
      throw new Error(`"${e.word}" is in extra.txt (line ${e.line}) and in blocklist.txt (line ${line})`);
    }
  }
  return { extra, blocked: [...blockedAt.keys()] };
}
