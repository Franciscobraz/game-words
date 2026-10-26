/**
 * Display spellings map: normalized a-z word -> its accented spellings.
 *
 * Text model: one line per word, sorted by key, `key\tedits`. Each spelling is written as
 * the edits that turn the key into it: 0-based code point position followed by the
 * character (`faça` from `faca` is `2ç`). Spellings are separated by `|`; the plain
 * form is an empty edit list, so `faca` -> `["faca", "faça"]` is `faca\t|2ç`.
 * Spellings are stored sorted by code point (String comparison), which puts the plain
 * form before any accented variant and does not depend on the runtime locale.
 * Only keys with at least one spelling different from the key are stored.
 *
 * Binary layout (little-endian):
 *   0   magic "BWSP"
 *   4   u32 format version
 *   8   u32 entry count
 *   12  u32 block count
 *   16  blockCount x u32 block offsets, relative to the data start
 *   ..  data: blocks of up to 64 lines, front-coded. Each line is a u8 count of key
 *       bytes shared with the previous key (0 for a block's first line, which therefore
 *       holds the block's full first key), then UTF-8 `keySuffix\tedits\n`.
 * Lookups binary-search the blocks by their first key and scan one block, reading the
 * buffer directly.
 */

export const SPELLINGS_MAGIC = 'BWSP';
export const SPELLINGS_VERSION = 1;
const BLOCK_LINES = 64;
const HEADER_BYTES = 16;
const TAB = 9;
const NEWLINE = 10;

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

function utf8Encode(s: string, out: number[]): void {
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
}

function utf8Decode(bytes: Uint8Array, start: number, end: number): string {
  let s = '';
  let i = start;
  while (i < end) {
    const b = bytes[i]!;
    let c: number;
    if (b < 0x80) {
      c = b;
      i += 1;
    } else if (b < 0xe0) {
      c = ((b & 31) << 6) | (bytes[i + 1]! & 63);
      i += 2;
    } else if (b < 0xf0) {
      c = ((b & 15) << 12) | ((bytes[i + 1]! & 63) << 6) | (bytes[i + 2]! & 63);
      i += 3;
    } else {
      c = ((b & 7) << 18) | ((bytes[i + 1]! & 63) << 12) | ((bytes[i + 2]! & 63) << 6) | (bytes[i + 3]! & 63);
      i += 4;
    }
    s += String.fromCodePoint(c);
  }
  return s;
}

function encodeEdits(key: string, spelling: string): string {
  const chars = [...spelling.normalize('NFC')];
  if (chars.length !== key.length || stripDiacritics(chars.join('')) !== key) {
    throw new Error(`Spelling "${spelling}" does not normalize to "${key}"`);
  }
  let edits = '';
  chars.forEach((ch, i) => {
    if (ch !== key[i]) edits += `${i}${ch}`;
  });
  return edits;
}

function decodeEdits(key: string, edits: string): string {
  const chars = [...key];
  const re = /(\d+)(\D)/gu;
  for (let m = re.exec(edits); m; m = re.exec(edits)) chars[Number(m[1])] = m[2]!;
  return chars.join('');
}

/** Builds the spellings buffer from normalized key -> spellings (duplicates and order do not matter). */
export function buildSpellings(entries: Iterable<readonly [string, Iterable<string>]>): ArrayBuffer {
  const lines: [string, string][] = [];
  for (const [key, spellings] of entries) {
    if (!/^[a-z]+$/.test(key)) throw new Error(`Invalid spellings key "${key}": only a-z allowed`);
    const distinct = [...new Set([...spellings].map((s) => s.normalize('NFC')))].sort();
    if (distinct.every((s) => s === key)) continue;
    lines.push([key, distinct.map((s) => encodeEdits(key, s)).join('|')]);
  }
  lines.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]![0] === lines[i - 1]![0]) throw new Error(`Duplicate spellings key "${lines[i]![0]}"`);
  }

  const data: number[] = [];
  const offsets: number[] = [];
  let prev = '';
  lines.forEach(([key, edits], i) => {
    let shared = 0;
    if (i % BLOCK_LINES === 0) {
      offsets.push(data.length);
    } else {
      while (shared < key.length && shared < prev.length && shared < 255 && key[shared] === prev[shared]) shared++;
    }
    data.push(shared);
    utf8Encode(`${key.slice(shared)}\t${edits}\n`, data);
    prev = key;
  });

  const dataStart = HEADER_BYTES + offsets.length * 4;
  const buf = new ArrayBuffer(dataStart + data.length);
  const view = new DataView(buf);
  for (let i = 0; i < 4; i++) view.setUint8(i, SPELLINGS_MAGIC.charCodeAt(i));
  view.setUint32(4, SPELLINGS_VERSION, true);
  view.setUint32(8, lines.length, true);
  view.setUint32(12, offsets.length, true);
  offsets.forEach((o, i) => view.setUint32(HEADER_BYTES + i * 4, o, true));
  new Uint8Array(buf, dataStart).set(data);
  return buf;
}

/** Read-only view over a spellings buffer. */
export class Spellings {
  private readonly bytes: Uint8Array;
  private readonly offsets: Uint32Array;
  readonly entryCount: number;

  private constructor(bytes: Uint8Array, offsets: Uint32Array, entryCount: number) {
    this.bytes = bytes;
    this.offsets = offsets;
    this.entryCount = entryCount;
  }

  static fromBuffer(buf: ArrayBuffer): Spellings {
    const view = new DataView(buf);
    let magic = '';
    for (let i = 0; i < 4 && i < buf.byteLength; i++) magic += String.fromCharCode(view.getUint8(i));
    if (magic !== SPELLINGS_MAGIC) throw new Error(`Invalid spellings: bad magic "${magic}" (expected "${SPELLINGS_MAGIC}")`);
    if (buf.byteLength < HEADER_BYTES) throw new Error(`Invalid spellings: truncated header (${buf.byteLength} bytes)`);
    const version = view.getUint32(4, true);
    if (version !== SPELLINGS_VERSION) {
      throw new Error(`Unsupported spellings format version ${version} (expected ${SPELLINGS_VERSION})`);
    }
    const entryCount = view.getUint32(8, true);
    const blockCount = view.getUint32(12, true);
    const dataStart = HEADER_BYTES + blockCount * 4;
    if (buf.byteLength < dataStart) throw new Error(`Invalid spellings: truncated block index (${buf.byteLength} bytes)`);
    const offsets = new Uint32Array(blockCount);
    for (let i = 0; i < blockCount; i++) offsets[i] = view.getUint32(HEADER_BYTES + i * 4, true);
    return new Spellings(new Uint8Array(buf, dataStart), offsets, entryCount);
  }

  /** Reads the key of the line at `pos` (after the shared-count byte), given the previous key. */
  private readKey(pos: number, prev: string): { key: string; tab: number } {
    const shared = this.bytes[pos]!;
    let key = prev.slice(0, shared);
    let i = pos + 1;
    while (this.bytes[i] !== TAB) key += String.fromCharCode(this.bytes[i++]!);
    return { key, tab: i };
  }

  /** The stored spellings of `word`, or `[word]` when it has no entry. */
  get(word: string): string[] {
    let lo = 0;
    let hi = this.offsets.length - 1;
    let block = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.readKey(this.offsets[mid]!, '').key <= word) {
        block = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    if (block < 0) return [word];

    const end = block + 1 < this.offsets.length ? this.offsets[block + 1]! : this.bytes.length;
    let pos = this.offsets[block]!;
    let prev = '';
    while (pos < end) {
      const { key, tab } = this.readKey(pos, prev);
      let eol = tab + 1;
      while (this.bytes[eol] !== NEWLINE) eol++;
      if (key === word) {
        return utf8Decode(this.bytes, tab + 1, eol)
          .split('|')
          .map((edits) => decodeEdits(key, edits));
      }
      if (key > word) break;
      prev = key;
      pos = eol + 1;
    }
    return [word];
  }
}
