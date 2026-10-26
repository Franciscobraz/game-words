import { describe, expect, test } from 'vitest';
import { classifyForm } from './ptBR.ts';

describe('classifyForm', () => {
  test('discards uppercase forms', () => {
    expect(classifyForm('Brasil')).toEqual({ ok: false, reason: 'uppercase' });
    expect(classifyForm('ONU')).toEqual({ ok: false, reason: 'uppercase' });
    expect(classifyForm('Ávila')).toEqual({ ok: false, reason: 'uppercase' });
  });

  test('discards non-letter forms', () => {
    for (const form of ['guarda-chuva', "d'água", 'mp3', 'etc.', 'boa noite']) {
      expect(classifyForm(form)).toEqual({ ok: false, reason: 'non-letter' });
    }
  });

  test('strips diacritics and cedilla', () => {
    expect(classifyForm('ação')).toEqual({ ok: true, word: 'acao' });
    expect(classifyForm('mãe')).toEqual({ ok: true, word: 'mae' });
    expect(classifyForm('pôr')).toEqual({ ok: true, word: 'por' });
    expect(classifyForm('pinguim')).toEqual({ ok: true, word: 'pinguim' });
    expect(classifyForm('àquele')).toEqual({ ok: true, word: 'aquele' });
  });

  test('classifies decomposed (NFD) forms like their composed equivalents', () => {
    expect(classifyForm('ação'.normalize('NFD'))).toEqual({ ok: true, word: 'acao' });
    expect(classifyForm('pôr'.normalize('NFD'))).toEqual({ ok: true, word: 'por' });
    expect(classifyForm('Ávila'.normalize('NFD'))).toEqual({ ok: false, reason: 'uppercase' });
    expect(classifyForm('pé-de-moleque'.normalize('NFD'))).toEqual({ ok: false, reason: 'non-letter' });
    expect(classifyForm('pé'.normalize('NFD'))).toEqual({ ok: false, reason: 'length' });
  });

  test('discards length outside 3-16', () => {
    expect(classifyForm('ar')).toEqual({ ok: false, reason: 'length' });
    expect(classifyForm('pé')).toEqual({ ok: false, reason: 'length' });
    expect(classifyForm('a'.repeat(17))).toEqual({ ok: false, reason: 'length' });
    expect(classifyForm('constitucionalíssimo'.slice(0, 17))).toEqual({ ok: false, reason: 'length' });
    expect(classifyForm('sol')).toEqual({ ok: true, word: 'sol' });
    expect(classifyForm('b'.repeat(16))).toEqual({ ok: true, word: 'b'.repeat(16) });
    expect(classifyForm('ônibusônibusônib')).toEqual({ ok: true, word: 'onibusonibusonib' });
  });
});
