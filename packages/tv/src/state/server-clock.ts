import { type ReadonlySignal, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

/** How often a screen reads the server clock: the countdown and the timer follow it (TVPLAY-01 AC 1-3). */
export const SERVER_CLOCK_TICK_MS = 100;

/** The server clock as a signal, read every `SERVER_CLOCK_TICK_MS` (TVPLAY-01 AC 3). */
export function useServerClock(read: () => number): ReadonlySignal<number> {
  const now = useSignal(read());
  useEffect(() => {
    const id = setInterval(() => {
      now.value = read();
    }, SERVER_CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, [now, read]);
  return now;
}
