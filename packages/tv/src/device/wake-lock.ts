import type { WakeLock } from '../state/awake.ts';

/**
 * The Screen Wake Lock of the browser (TVAWAKE-01 AC 1). A browser without it, or one that refuses, rejects the
 * request; the keep-awake store logs it and the game goes on (TVAWAKE-01 AC 4).
 */
export function browserWakeLock(): WakeLock {
  let sentinel: WakeLockSentinel | null = null;
  let isWanted = false;

  return {
    async request() {
      isWanted = true;
      if (!('wakeLock' in navigator)) throw new Error('This browser has no Screen Wake Lock');
      if (sentinel !== null && !sentinel.released) return;
      const granted = await navigator.wakeLock.request('screen');
      sentinel = granted;
      // The room expired while the browser answered.
      if (!isWanted) await granted.release();
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
