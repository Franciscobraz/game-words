import { describe, expect, test } from 'vitest';
import { Spellings, buildSpellings } from './spellings.ts';

describe('spellings', () => {
  test('keeps every distinct spelling sorted', () => {
    // Input order and duplicates must not matter; plain forms stay only when they are a spelling too.
    const buf = buildSpellings(
      new Map<string, string[]>([
        ['faca', ['faça', 'faca', 'faça']],
        ['coracoes', ['corações']],
        ['pais', ['país', 'pais', 'paîs']],
        ['casa', ['casa']],
      ]),
    );
    const s = Spellings.fromBuffer(buf);
    expect(s.get('faca')).toEqual(['faca', 'faça']);
    expect(s.get('coracoes')).toEqual(['corações']);
    expect(s.get('pais')).toEqual(['pais', 'paîs', 'país'].sort());
    // A word whose only spelling is the normalized form is not stored.
    expect(s.entryCount).toBe(3);
  });

  test('returns stored spellings', () => {
    // Enough entries to span several 64-line blocks, so lookups cross block boundaries.
    const entries = new Map<string, string[]>();
    for (let i = 0; i < 500; i++) {
      const key = `a${i.toString(26).replace(/[0-9]/g, (d) => String.fromCharCode(103 + Number(d)))}e`;
      entries.set(key, [key.slice(0, -1) + 'é']);
    }
    entries.set('faca', ['faca', 'faça']);
    const s = Spellings.fromBuffer(buildSpellings(entries));
    expect(s.get('faca')).toEqual(['faca', 'faça']);
    for (const [key, spellings] of entries) expect(s.get(key), key).toEqual(spellings);
  });

  test('falls back to the word itself', () => {
    const s = Spellings.fromBuffer(buildSpellings(new Map([['faca', ['faça']]])));
    expect(s.get('casa')).toEqual(['casa']);
    expect(s.get('aaa')).toEqual(['aaa']);
    expect(s.get('zzz')).toEqual(['zzz']);
    expect(Spellings.fromBuffer(buildSpellings(new Map())).get('casa')).toEqual(['casa']);
  });
});
