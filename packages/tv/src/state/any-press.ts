import { useEffect } from 'preact/hooks';

/**
 * Calls `onPress` on any key or click: the TV has no buttons, and "OK" on the remote reaches the page as a key
 * or a click (TVEXIT-01 AC 3, 10, TVAUDIO-01 AC 4).
 */
export function useAnyPress(onPress: () => void): void {
  useEffect(() => {
    window.addEventListener('keydown', onPress);
    window.addEventListener('click', onPress);
    return () => {
      window.removeEventListener('keydown', onPress);
      window.removeEventListener('click', onPress);
    };
  }, [onPress]);
}
