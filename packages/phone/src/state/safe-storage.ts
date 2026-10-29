import type { KeyValueStorage } from './room.ts';

/**
 * `storage` with every access guarded: a storage that throws, as a browser that
 * blocks site data, reads as empty and forgets writes, and the phone keeps playing
 * without saved tokens or preferences (design, Error Handling: "localStorage bloqueado").
 */
export function safeStorage(storage: KeyValueStorage): KeyValueStorage {
  return {
    get(key) {
      try {
        return storage.get(key);
      } catch (error) {
        console.warn(`Storage could not read ${key}`, error);
        return null;
      }
    },
    set(key, value) {
      try {
        storage.set(key, value);
      } catch (error) {
        console.warn(`Storage could not save ${key}`, error);
      }
    },
    remove(key) {
      try {
        storage.remove(key);
      } catch (error) {
        console.warn(`Storage could not remove ${key}`, error);
      }
    },
  };
}
