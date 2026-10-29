import type { CloseReason, ErrorCode } from '@bwords/core';
import type { StringKey } from '../strings/pt-BR.ts';

/**
 * The text of each server error code (UI-01 AC 5). Join errors are the ones the
 * join screen shows (JOIN-01 AC 6-10, ENTRY-01 AC 5); the rest exist so that no
 * code reaches the player untranslated.
 */
const ERROR_KEYS: Record<ErrorCode, StringKey> = {
  'bad-message': 'badMessage',
  'wrong-phase': 'wrongPhase',
  'not-host': 'notHost',
  'bad-token': 'badToken',
  'room-not-found': 'roomNotFound',
  'bad-nickname': 'nicknameLength',
  'nickname-taken': 'nicknameTaken',
  'bad-color': 'badColor',
  'color-illegible': 'colorIllegible',
  'color-too-similar': 'colorTooSimilar',
  'room-full': 'roomFull',
  'bad-settings': 'badSettings',
  'bad-target': 'badTarget',
};

/** The text of each reason the server closes the connection (EXIT-01 AC 1-4). */
const CLOSE_KEYS: Record<CloseReason, StringKey> = {
  kicked: 'kicked',
  'closed-by-host': 'hostClosedRoom',
  idle: 'roomClosed',
  'tv-gone': 'roomClosed',
  replaced: 'replaced',
};

/** The string key for a server error code (JOIN-01 AC 6-10, UI-01 AC 5). */
export function errorKey(code: ErrorCode): StringKey {
  return ERROR_KEYS[code];
}

/** The string key for a close reason; `idle` and `tv-gone` share one text (EXIT-01 AC 3). */
export function closeKey(reason: CloseReason): StringKey {
  return CLOSE_KEYS[reason];
}
