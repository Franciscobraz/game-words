import type { WakeLock } from '../state/prefs.ts';

/**
 * The Screen Wake Lock of the browser (PREF-01 AC 4). A browser without it, or one
 * that refuses (low battery, page hidden), leaves the screen to sleep as usual; the
 * game goes on (design, Error Handling).
 */
export function browserWakeLock(): WakeLock {
  let sentinel: WakeLockSentinel | null = null;
  let isWanted = false;

  return {
    request() {
      isWanted = true;
      if (!('wakeLock' in navigator) || (sentinel !== null && !sentinel.released)) return;
      navigator.wakeLock
        .request('screen')
        .then((granted) => {
          sentinel = granted;
          // The phase moved on while the browser answered.
          if (!isWanted) void granted.release();
        })
        .catch((error: unknown) => console.warn('The screen wake lock was refused', error));
    },
    release() {
      isWanted = false;
      const held = sentinel;
      sentinel = null;
      held?.release().catch((error: unknown) => console.warn('The screen wake lock could not be released', error));
    },
  };
}

/** Calls `listener` each time the page comes back to the front; the browser drops the wake lock when it hides. */
export function onPageVisible(listener: () => void): () => void {
  const handle = () => {
    if (document.visibilityState === 'visible') listener();
  };
  document.addEventListener('visibilitychange', handle);
  return () => document.removeEventListener('visibilitychange', handle);
}
