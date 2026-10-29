import { type ReadonlySignal, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

/** How often a screen reads the server clock: the countdown, the timer and the board's lock follow it (COUNT-01, PLAY-01 AC 14, 20). */
export const SERVER_CLOCK_TICK_MS = 100;

/** The server clock as a signal, read every `SERVER_CLOCK_TICK_MS` (COUNT-01 AC 3). */
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
