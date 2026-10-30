import { isRoomCode } from '@bwords/core';

/** The room this TV opened: its code and the token `POST /api/rooms` gave it. */
export interface SavedRoom {
  code: string;
  tvToken: string;
}

/** Where the TV remembers its room between reloads; never in the URL (TVROOM-01 AC 2, 4). */
export interface TokenStore {
  load(): SavedRoom | null;
  save(room: SavedRoom): void;
  clear(): void;
}

/** The part of `localStorage` the TV uses. */
export type RoomStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const STORAGE_KEY = 'bwords.tv.room';

/** Reads a room out of untrusted data (saved text or a server response); null when it is not one. */
export function parseSavedRoom(raw: unknown): SavedRoom | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { code, tvToken } = raw as { code?: unknown; tvToken?: unknown };
  if (typeof code !== 'string' || !isRoomCode(code)) return null;
  if (typeof tvToken !== 'string' || tvToken === '') return null;
  return { code, tvToken };
}

/**
 * The store over `localStorage`, reached through `storage` because the access itself throws in a browser that
 * blocks site data. Then the TV keeps working and only forgets its room on a reload (design, Error Handling).
 */
export function createTokenStore(storage: () => RoomStorage): TokenStore {
  return {
    load() {
      const text = guarded(() => storage().getItem(STORAGE_KEY));
      return text === null || text === undefined ? null : parseSavedText(text);
    },
    save(room) {
      guarded(() => storage().setItem(STORAGE_KEY, JSON.stringify(room)));
    },
    clear() {
      guarded(() => storage().removeItem(STORAGE_KEY));
    },
  };
}

function parseSavedText(text: string): SavedRoom | null {
  try {
    return parseSavedRoom(JSON.parse(text));
  } catch (error) {
    console.warn('The saved room is not valid', error);
    return null;
  }
}

/** Runs a storage access; a failure is logged and reads as undefined. */
function guarded<T>(access: () => T): T | undefined {
  try {
    return access();
  } catch (error) {
    console.warn('localStorage is not available', error);
    return undefined;
  }
}
