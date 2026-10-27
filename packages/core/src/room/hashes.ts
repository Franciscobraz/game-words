// Web Crypto and TextEncoder exist in workerd, Node and browsers; the core compiles
// without DOM or Node types, so only the parts used here are declared.
declare const crypto: {
  subtle: { digest(algorithm: 'SHA-256', data: Uint8Array): Promise<ArrayBuffer> };
};
declare const TextEncoder: { new (): { encode(input: string): Uint8Array } };

/** Bytes kept from each SHA-256 digest. */
export const HASH_PREFIX_BYTES = 6;

const encoder = new TextEncoder();

/** First 6 bytes of SHA-256(salt ‖ UTF-8 of the word). */
export async function hashPrefix(salt: Uint8Array, word: string): Promise<Uint8Array> {
  const text = encoder.encode(word);
  const data = new Uint8Array(salt.length + text.length);
  data.set(salt, 0);
  data.set(text, salt.length);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(digest).slice(0, HASH_PREFIX_BYTES);
}

/** The prefixes of every word, concatenated in the order of `words` (6 bytes each). */
export async function hashPrefixes(salt: Uint8Array, words: readonly string[]): Promise<Uint8Array> {
  const out = new Uint8Array(words.length * HASH_PREFIX_BYTES);
  const prefixes = await Promise.all(words.map((w) => hashPrefix(salt, w)));
  prefixes.forEach((p, i) => out.set(p, i * HASH_PREFIX_BYTES));
  return out;
}
