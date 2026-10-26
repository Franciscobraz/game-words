/**
 * Compact DAWG dictionary format.
 *
 * Layout (little-endian):
 *   0    magic "BWDG"
 *   4    u32 format version
 *   8    u32 word count
 *   12   u32 edge count
 *   16   26 x f64 letter weights (a..z)
 *   224  edgeCount x u32 edges
 *
 * Edge bits: 0-4 letter (0 = a), 5 end of word, 6 last edge of its node,
 * 7-31 index of the child's first edge (0 = no children; the root starts at 0
 * and is never a child). A node is a contiguous run of edges sorted by letter.
 */

export const DAWG_MAGIC = 'BWDG';
export const DAWG_VERSION = 1;
const HEADER_BYTES = 16 + 26 * 8;
const LETTER_MASK = 0x1f;
const EOW_BIT = 1 << 5;
const LAST_BIT = 1 << 6;
const CHILD_SHIFT = 7;
const MAX_EDGES = 2 ** 25;

interface BuildNode {
  final: boolean;
  letters: number[];
  children: BuildNode[];
  id: number;
}

function newNode(): BuildNode {
  return { final: false, letters: [], children: [], id: -1 };
}

/** Builds a minimal DAWG (Daciuk's incremental algorithm) from sorted, unique a-z words. */
export function buildDawg(sortedWords: readonly string[], letterWeights: readonly number[]): ArrayBuffer {
  if (letterWeights.length !== 26) throw new Error(`Expected 26 letter weights, got ${letterWeights.length}`);

  const root = newNode();
  const register = new Map<string, BuildNode>();
  const unchecked: { parent: BuildNode; child: BuildNode }[] = [];
  let nextId = 0;
  let prev = '';

  const minimize = (downTo: number) => {
    while (unchecked.length > downTo) {
      const { parent, child } = unchecked.pop()!;
      let key = child.final ? '1' : '0';
      for (let i = 0; i < child.letters.length; i++) key += `,${child.letters[i]}:${child.children[i]!.id}`;
      const existing = register.get(key);
      if (existing) {
        parent.children[parent.children.length - 1] = existing;
      } else {
        child.id = nextId++;
        register.set(key, child);
      }
    }
  };

  for (const word of sortedWords) {
    if (!/^[a-z]+$/.test(word)) throw new Error(`Invalid word "${word}": only a-z allowed`);
    if (word <= prev) throw new Error(`Words must be sorted and unique: "${word}" after "${prev}"`);
    let common = 0;
    while (common < word.length && common < prev.length && word[common] === prev[common]) common++;
    minimize(common);
    let node = common === 0 ? root : unchecked[common - 1]!.child;
    for (let i = common; i < word.length; i++) {
      const child = newNode();
      node.letters.push(word.charCodeAt(i) - 97);
      node.children.push(child);
      unchecked.push({ parent: node, child });
      node = child;
    }
    node.final = true;
    prev = word;
  }
  minimize(0);

  // Assign edge offsets: root first, then every distinct node with edges, depth-first.
  const offsets = new Map<BuildNode, number>();
  const order: BuildNode[] = [];
  let edgeCount = 0;
  const place = (node: BuildNode) => {
    if (node.letters.length === 0 || offsets.has(node)) return;
    offsets.set(node, edgeCount);
    order.push(node);
    edgeCount += node.letters.length;
    for (const c of node.children) place(c);
  };
  place(root);
  if (edgeCount >= MAX_EDGES) throw new Error(`Too many edges for the format: ${edgeCount} (max ${MAX_EDGES - 1})`);

  const buf = new ArrayBuffer(HEADER_BYTES + edgeCount * 4);
  const view = new DataView(buf);
  for (let i = 0; i < 4; i++) view.setUint8(i, DAWG_MAGIC.charCodeAt(i));
  view.setUint32(4, DAWG_VERSION, true);
  view.setUint32(8, sortedWords.length, true);
  view.setUint32(12, edgeCount, true);
  letterWeights.forEach((w, i) => view.setFloat64(16 + i * 8, w, true));

  const edges = new Uint32Array(buf, HEADER_BYTES, edgeCount);
  for (const node of order) {
    const base = offsets.get(node)!;
    const n = node.letters.length;
    for (let i = 0; i < n; i++) {
      const child = node.children[i]!;
      let e = node.letters[i]!;
      if (child.final) e |= EOW_BIT;
      if (i === n - 1) e |= LAST_BIT;
      e |= (offsets.get(child) ?? 0) << CHILD_SHIFT;
      edges[base + i] = e >>> 0;
    }
  }
  return buf;
}

/** Read-only view over a DAWG buffer. Queries read the buffer directly. */
export class Dawg {
  private readonly edges: Uint32Array;
  readonly wordCount: number;
  readonly letterWeights: Float64Array;

  private constructor(edges: Uint32Array, wordCount: number, letterWeights: Float64Array) {
    this.edges = edges;
    this.wordCount = wordCount;
    this.letterWeights = letterWeights;
  }

  static fromBuffer(buf: ArrayBuffer): Dawg {
    const view = new DataView(buf);
    let magic = '';
    for (let i = 0; i < 4 && i < buf.byteLength; i++) magic += String.fromCharCode(view.getUint8(i));
    if (magic !== DAWG_MAGIC) throw new Error(`Invalid dictionary: bad magic "${magic}" (expected "${DAWG_MAGIC}")`);
    if (buf.byteLength < HEADER_BYTES) throw new Error(`Invalid dictionary: truncated header (${buf.byteLength} bytes)`);
    const version = view.getUint32(4, true);
    if (version !== DAWG_VERSION) {
      throw new Error(`Unsupported dictionary format version ${version} (expected ${DAWG_VERSION})`);
    }
    const wordCount = view.getUint32(8, true);
    const edgeCount = view.getUint32(12, true);
    if (buf.byteLength !== HEADER_BYTES + edgeCount * 4) {
      throw new Error(`Invalid dictionary: expected ${HEADER_BYTES + edgeCount * 4} bytes, got ${buf.byteLength}`);
    }
    const weights = new Float64Array(26);
    for (let i = 0; i < 26; i++) weights[i] = view.getFloat64(16 + i * 8, true);
    return new Dawg(new Uint32Array(buf, HEADER_BYTES, edgeCount), wordCount, weights);
  }

  get edgeCount(): number {
    return this.edges.length;
  }

  /** First edge of the root node, or -1 when the dictionary is empty. */
  get root(): number {
    return this.edges.length > 0 ? 0 : -1;
  }

  /** Edge for `letter` (0 = a) in the node whose first edge is `node`, or -1. */
  edge(node: number, letter: number): number {
    if (node < 0) return -1;
    for (let i = node; ; i++) {
      const e = this.edges[i]!;
      const l = e & LETTER_MASK;
      if (l === letter) return i;
      if (l > letter || e & LAST_BIT) return -1;
    }
  }

  /** Whether the path ending at `edge` spells a stored word. */
  isWord(edge: number): boolean {
    return (this.edges[edge]! & EOW_BIT) !== 0;
  }

  /** First edge of the node `edge` leads to, or -1 when it has no children. */
  child(edge: number): number {
    const c = this.edges[edge]! >>> CHILD_SHIFT;
    return c === 0 ? -1 : c;
  }

  private walk(s: string): number {
    let node = this.root;
    let e = -1;
    for (let i = 0; i < s.length; i++) {
      const letter = s.charCodeAt(i) - 97;
      if (letter < 0 || letter > 25) return -1;
      e = this.edge(node, letter);
      if (e < 0) return -1;
      node = this.child(e);
    }
    return e;
  }

  has(word: string): boolean {
    if (word.length === 0) return false;
    const e = this.walk(word);
    return e >= 0 && this.isWord(e);
  }

  hasPrefix(prefix: string): boolean {
    if (prefix.length === 0) return this.root >= 0;
    return this.walk(prefix) >= 0;
  }
}
