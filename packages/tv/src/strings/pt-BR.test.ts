/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { CLOSE_REASONS, ERROR_CODES } from '@bwords/core';
import { expect, test } from 'vitest';
import { closeKey, errorKey } from '../model/messages.ts';
import { STRINGS } from './pt-BR.ts';

/** The words that name a person's gender, each only allowed in its neutral form (AD-013). */
const GENDERED_WORDS = [/anfitri[ãa]o(?!\(ã\))/i, /anfitri[ãa](?!\p{L})/iu, /espectador(?!\(a\))/i, /espectadora/i, /\b(?:o|a) (?:jogador|vencedor)/i];

/** Every text of the table; a function gets a list with one nickname, which also reads as a name and as a count. */
function allTexts(): string[] {
  const entries: unknown[] = Object.values(STRINGS);
  const values = entries.flatMap((value) => (typeof value === 'object' && value !== null ? Object.values(value) : [value]));
  return values.map((value) => (typeof value === 'function' ? String(value(['Ana'], 2)) : String(value)));
}

const isNeutral = (text: string) => !GENDERED_WORDS.some((word) => word.test(text));

/** Text written straight between two tags of a `.tsx`: every word on the screen comes from the table (TVUI-01 AC 5). */
function textsInMarkup(source: string): string[] {
  const between = source.matchAll(/>\s*([^<>{}\s][^<>{}]*?)\s*</g);
  const written = [...between].map((match) => match[1]!);
  // Code between a type's `<...>` and the next tag starts with punctuation or carries `=`, `;` or `()`, and text does not.
  return written.filter((text) => /^\p{L}.*\p{L}/su.test(text) && !/[=;()]/.test(text));
}

test('has a neutral text for every code', () => {
  for (const code of ERROR_CODES) {
    const text = STRINGS[errorKey(code)];
    expect(typeof text, code).toBe('string');
    expect(text, code).not.toBe('');
  }
  for (const reason of CLOSE_REASONS) {
    const text = STRINGS[closeKey(reason)];
    expect(typeof text, reason).toBe('string');
    expect(text, reason).not.toBe('');
  }
  expect(allTexts().filter((text) => !isNeutral(text))).toEqual([]);
});

test('catches a text that names a gender', () => {
  expect(isNeutral('O anfitrião saiu')).toBe(false);
  expect(isNeutral('ANFITRIÃ')).toBe(false);
  expect(isNeutral('ESPECTADOR')).toBe(false);
  expect(isNeutral('O jogador venceu')).toBe(false);
  expect(isNeutral('ANFITRIÃO(Ã)')).toBe(true);
  expect(isNeutral('ESPECTADOR(A)')).toBe(true);
});

test('writes no text outside the table', () => {
  const dir = new URL('../', import.meta.url);
  const names = readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((name) => name.replaceAll('\\', '/'));
  const report: Record<string, string[]> = {};
  for (const name of names.filter((file) => file.endsWith('.tsx'))) {
    const written = textsInMarkup(readFileSync(new URL(name, dir), 'utf8'));
    if (written.length > 0) report[name] = written;
  }
  expect(names).toContain('screens/LobbyScreen.tsx');
  expect(report).toEqual({});
});

test('catches text written in the markup', () => {
  expect(textsInMarkup('<p>Sala expirada</p>')).toEqual(['Sala expirada']);
  expect(textsInMarkup('<p>{STRINGS.roomExpired}</p>')).toEqual([]);
  expect(textsInMarkup('<span class="x">·</span>')).toEqual([]);
});
