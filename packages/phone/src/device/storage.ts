import type { KeyValueStorage } from '../state/room.ts';

/**
 * `localStorage` behind the store's storage contract. A browser that blocks site
 * data throws on access; the phone then plays without saved tokens instead of
 * breaking (design, Error Handling: "localStorage bloqueado").
 */
export const browserStorage: KeyValueStorage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage is not available', error);
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('localStorage is not available', error);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage is not available', error);
    }
  },
};
