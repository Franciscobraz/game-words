import { CLOSE_REASONS, type CloseReason, ERROR_CODES, type ErrorCode } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { STRINGS } from '../strings/pt-BR.ts';
import { closeKey, errorKey } from './messages.ts';

const OPEN_FAILED = 'Não foi possível abrir a sala';
const UNEXPECTED = 'Algo deu errado';

const ERROR_TEXTS: Record<ErrorCode, string> = {
  'bad-token': OPEN_FAILED,
  'room-not-found': OPEN_FAILED,
  'bad-message': UNEXPECTED,
  'wrong-phase': UNEXPECTED,
  'not-host': UNEXPECTED,
  'bad-nickname': UNEXPECTED,
  'nickname-taken': UNEXPECTED,
  'bad-color': UNEXPECTED,
  'color-illegible': UNEXPECTED,
  'color-too-similar': UNEXPECTED,
  'room-full': UNEXPECTED,
  'bad-settings': UNEXPECTED,
  'bad-target': UNEXPECTED,
};

const CLOSE_TEXTS: Record<CloseReason, string> = {
  idle: 'Sala expirada',
  'tv-gone': 'Sala expirada',
  replaced: 'A TV foi aberta em outra aba',
  'closed-by-host': 'A sala foi encerrada',
  kicked: 'A sala foi encerrada',
};

describe('messages', () => {
  test.each(ERROR_CODES)('gives the error %s its text', (code) => {
    expect(STRINGS[errorKey(code)]).toBe(ERROR_TEXTS[code]);
  });

  test.each(CLOSE_REASONS)('gives the close reason %s its text', (reason) => {
    expect(STRINGS[closeKey(reason)]).toBe(CLOSE_TEXTS[reason]);
  });
});
