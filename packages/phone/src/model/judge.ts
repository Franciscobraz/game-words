import { hashPrefix, wordPoints } from '@bwords/core';
import { toHex } from './room-view.ts';

/** What the phone shows when the finger lifts (PLAY-01 AC 6-10). */
export type Feedback =
  | { kind: 'valid'; word: string; points: number }
  | { kind: 'already-found'; word: string }
  | { kind: 'invalid'; word: string }
  | { kind: 'too-short'; word: string };

/** What the judge needs to know about the round. */
export interface JudgeContext {
  /** The room's minimum word length, in letters ("Qu" counts as 2). */
  minLength: number;
  /** Words this phone already found this round. */
  found: readonly string[];
  /** The round's salt; null until it arrives. */
  salt: Uint8Array | null;
  /** The round's hash prefixes, as hex strings. */
  hashes: ReadonlySet<string>;
}

/**
 * Judges a word on the phone, without the server (PLAY-01 AC 6-10, M2-Q5). In
 * order: shorter than the minimum is too short, a word already in the list is
 * already found, a salted hash prefix in the round's set is valid with the core's
 * points, and anything else is invalid. The phone never sees the words, only
 * their hashes (L-008, DESIGN §6.2).
 */
export async function judgeWord(word: string, ctx: JudgeContext): Promise<Feedback> {
  if (word.length < ctx.minLength) return { kind: 'too-short', word };
  if (ctx.found.includes(word)) return { kind: 'already-found', word };
  if (ctx.salt === null) return { kind: 'invalid', word };
  const prefix = toHex(await hashPrefix(ctx.salt, word));
  if (!ctx.hashes.has(prefix)) return { kind: 'invalid', word };
  return { kind: 'valid', word, points: wordPoints(word) };
}
