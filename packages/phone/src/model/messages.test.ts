import { CLOSE_REASONS, type CloseReason, ERROR_CODES, type ErrorCode } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { STRINGS, type StringKey } from '../strings/pt-BR.ts';
import { closeKey, errorKey } from './messages.ts';

/** The text of a key, with `name` filled in when the text takes a value. */
function textOf(key: StringKey, name = 'Ana'): string {
  const entry: unknown = STRINGS[key];
  if (typeof entry === 'function') return (entry as (value: string) => string)(name);
  return entry as string;
}

const ERROR_TEXTS: Record<ErrorCode, string> = {
  'bad-message': 'Algo deu errado. Tente de novo.',
  'wrong-phase': 'Essa ação não vale nesta fase',
  'not-host': 'Só o(a) anfitrião(ã) pode fazer isso',
  'bad-token': 'Sua vaga nesta sala expirou. Entre de novo.',
  'room-not-found': 'Sala não encontrada',
  'bad-nickname': 'O apelido precisa ter de 2 a 12 caracteres',
  'nickname-taken': 'Esse apelido já está em uso',
  'bad-color': 'Essa cor não é válida',
  'color-illegible': 'Essa cor fica difícil de ver na TV',
  'color-too-similar': 'Muito parecida com a cor de Ana',
  'room-full': 'Essa sala está cheia (10 jogadores)',
  'bad-settings': 'Essa configuração não é válida',
  'bad-target': 'Esse jogador não está mais na sala',
};

const CLOSE_TEXTS: Record<CloseReason, string> = {
  kicked: 'Você foi removido da sala',
  'closed-by-host': 'Ana encerrou a sala',
  idle: 'A sala foi encerrada',
  'tv-gone': 'A sala foi encerrada',
  replaced: 'Você abriu o jogo em outra aba ou aparelho',
};

describe('errorKey', () => {
  test.each(ERROR_CODES)('maps %s to its text', (code) => {
    expect(textOf(errorKey(code))).toBe(ERROR_TEXTS[code]);
  });
});

describe('closeKey', () => {
  test.each(CLOSE_REASONS)('maps %s to its text', (reason) => {
    expect(textOf(closeKey(reason))).toBe(CLOSE_TEXTS[reason]);
  });

  test('maps idle and tv-gone to the room closed text', () => {
    expect(textOf(closeKey('idle'))).toBe('A sala foi encerrada');
    expect(textOf(closeKey('tv-gone'))).toBe('A sala foi encerrada');
  });
});

test('has a string for every error code and close reason', () => {
  const keys = [...ERROR_CODES.map(errorKey), ...CLOSE_REASONS.map(closeKey)];

  for (const key of keys) {
    expect(Object.hasOwn(STRINGS, key)).toBe(true);
    expect(textOf(key).trim()).not.toBe('');
  }
});
