import { generateBoard } from '../generator.ts';
import type { LanguagePack } from '../pack.ts';
import { boardSolutions } from '../validate.ts';
import { hashPrefixes } from './hashes.ts';
import type { Settings } from './protocol.ts';
import type { PreparedBoard, RoundOptions, RoundSolutions } from './state.ts';

/**
 * A round ready to start: board, salt and the salted hash prefixes of its valid
 * solutions. Plain data, so the adapter can store it (`round:next`) and feed it to
 * `step` as a `prepared` input. The path of any word is `findPath(board, word)`.
 */
export interface PreparedRound extends PreparedBoard {
  solutions: RoundSolutions;
}

const BASE64URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** Base64url without padding. */
export function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    const chars = Math.min(4, Math.ceil(((bytes.length - i) * 8) / 6));
    for (let k = 0; k < chars; k++) out += BASE64URL[(n >> (18 - 6 * k)) & 63];
  }
  return out;
}

/** The settings a prepared round depends on; a round prepared for other settings is stale. */
export function roundOptions(settings: Settings): RoundOptions {
  return {
    size: settings.size,
    minLength: settings.minLength,
    filterProfanity: settings.filterProfanity,
    pack: settings.pack,
  };
}

/** Whether a prepared board was made for these settings. */
export function preparedFor(board: PreparedBoard, settings: Settings): boolean {
  const want = roundOptions(settings);
  const have = board.options;
  return (
    have.size === want.size &&
    have.minLength === want.minLength &&
    have.filterProfanity === want.filterProfanity &&
    have.pack === want.pack
  );
}

/**
 * Generates a board with the room's size and profanity filter, keeps its valid
 * solutions with the room's minimum and filter (sorted), and hashes them with the
 * salt. Async only because of Web Crypto; the adapter runs it outside `step`.
 * Rejects when the generator finds no board (`generateBoard` throws).
 */
export async function prepareRound(
  pack: LanguagePack,
  settings: Settings,
  seed: number,
  salt: Uint8Array,
): Promise<PreparedRound> {
  const { board } = generateBoard(settings.size, seed, pack, { filterProfanity: settings.filterProfanity });
  const { words } = boardSolutions(board, pack, {
    minLength: settings.minLength,
    filterProfanity: settings.filterProfanity,
  });
  const sorted = [...words].sort();
  return {
    board,
    salt: toBase64Url(salt),
    options: roundOptions(settings),
    solutions: { words: sorted, prefixes: await hashPrefixes(salt, sorted) },
  };
}
