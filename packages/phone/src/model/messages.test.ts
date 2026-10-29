import { CLOSE_REASONS, type CloseReason, ERROR_CODES, type ErrorCode, type PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { STRINGS, type StringKey } from '../strings/pt-BR.ts';
import { closeKey, closingHostName, errorKey, type JoinErrorPlace, joinErrorPlace } from './messages.ts';

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

const JOIN_ERROR_PLACES: Record<ErrorCode, JoinErrorPlace> = {
  'bad-message': 'form',
  'wrong-phase': 'form',
  'not-host': 'form',
  'bad-token': 'form',
  'room-not-found': 'form',
  'bad-nickname': 'nickname',
  'nickname-taken': 'nickname',
  'bad-color': 'color',
  'color-illegible': 'color',
  'color-too-similar': 'color',
  'room-full': 'form',
  'bad-settings': 'form',
  'bad-target': 'form',
};

describe('joinErrorPlace', () => {
  test.each(ERROR_CODES)('places %s on the join screen', (code) => {
    expect(joinErrorPlace(code)).toBe(JOIN_ERROR_PLACES[code]);
  });
});

describe('closingHostName', () => {
  const ana: PlayerInfo = { id: 'p-ana', nickname: 'Ana', color: '#ff7a00', connected: true, spectator: false, score: 0, wins: 0 };
  const beto: PlayerInfo = { id: 'p-beto', nickname: 'Beto', color: '#00c2ff', connected: true, spectator: false, score: 0, wins: 0 };

  test('names the host who closed the room', () => {
    // EXIT-01 AC 2: "Ana encerrou a sala".
    expect(closingHostName('closed-by-host', [ana, beto], 'p-ana')).toBe('Ana');
  });

  test('names nobody when the room closed on its own or the host is unknown', () => {
    // EXIT-01 AC 3: idle and tv-gone say "A sala foi encerrada"; so does a host the phone never saw.
    expect(closingHostName('idle', [ana, beto], 'p-ana')).toBeNull();
    expect(closingHostName('tv-gone', [ana, beto], 'p-ana')).toBeNull();
    expect(closingHostName('closed-by-host', [beto], 'p-ana')).toBeNull();
  });
});
