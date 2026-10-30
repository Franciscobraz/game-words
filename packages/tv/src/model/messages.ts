import type { CloseReason, ErrorCode } from '@bwords/core';
import type { StringKey } from '../strings/pt-BR.ts';

/**
 * The text of each server error code (style guide §8). The TV sends no player action, so
 * it only meets the two that refuse its room; the others exist so no code goes untranslated.
 */
const ERROR_KEYS: Record<ErrorCode, StringKey> = {
  'bad-token': 'roomOpenFailed',
  'room-not-found': 'roomOpenFailed',
  'bad-message': 'unexpectedError',
  'wrong-phase': 'unexpectedError',
  'not-host': 'unexpectedError',
  'bad-nickname': 'unexpectedError',
  'nickname-taken': 'unexpectedError',
  'bad-color': 'unexpectedError',
  'color-illegible': 'unexpectedError',
  'color-too-similar': 'unexpectedError',
  'room-full': 'unexpectedError',
  'bad-settings': 'unexpectedError',
  'bad-target': 'unexpectedError',
};

/** The text of each reason the server closes the TV's connection (TVEXIT-01 AC 2, 4). */
const CLOSE_KEYS: Record<CloseReason, StringKey> = {
  idle: 'roomExpired',
  'tv-gone': 'roomExpired',
  replaced: 'openedInAnotherTab',
  'closed-by-host': 'roomClosed',
  kicked: 'roomClosed',
};

/** The string key for a server error code (style guide §8). */
export function errorKey(code: ErrorCode): StringKey {
  return ERROR_KEYS[code];
}

/** The string key for a close reason; `idle` and `tv-gone` share "Sala expirada" (TVEXIT-01 AC 2). */
export function closeKey(reason: CloseReason): StringKey {
  return CLOSE_KEYS[reason];
}
