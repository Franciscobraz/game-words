import { Dawg } from './dawg.ts';
import { Spellings } from './spellings.ts';

/** Contents of a pack's `meta.json`. The core reads `id` and `minCommonWords`; other fields pass through. */
export interface PackMeta {
  id: string;
  /** Minimum valid common words a generated board must have, by board size. */
  minCommonWords: Readonly<Partial<Record<number, number>>>;
  [field: string]: unknown;
}

/** The files of `dist/<id>/`: the binary ones as buffers, `meta.json` already parsed. */
export interface PackBuffers {
  dict: ArrayBuffer;
  common: ArrayBuffer;
  profanity: ArrayBuffer;
  spellings: ArrayBuffer;
  meta: PackMeta;
}

/** A loaded language pack: dictionary, common and profanity sets, display spellings and metadata. */
export class LanguagePack {
  readonly dict: Dawg;
  readonly meta: PackMeta;
  private readonly common: Dawg;
  private readonly profanity: Dawg;
  private readonly spellingMap: Spellings;

  private constructor(dict: Dawg, common: Dawg, profanity: Dawg, spellings: Spellings, meta: PackMeta) {
    this.dict = dict;
    this.common = common;
    this.profanity = profanity;
    this.spellingMap = spellings;
    this.meta = meta;
  }

  static fromBuffers(files: PackBuffers): LanguagePack {
    return new LanguagePack(
      Dawg.fromBuffer(files.dict),
      Dawg.fromBuffer(files.common),
      Dawg.fromBuffer(files.profanity),
      Spellings.fromBuffer(files.spellings),
      files.meta,
    );
  }

  isWord(word: string): boolean {
    return this.dict.has(word);
  }

  isCommon(word: string): boolean {
    return this.common.has(word);
  }

  isProfane(word: string): boolean {
    return this.profanity.has(word);
  }

  /** Display spellings of a normalized word, sorted; `[word]` when it has no accented spelling. */
  spellings(word: string): string[] {
    return this.spellingMap.get(word);
  }
}
