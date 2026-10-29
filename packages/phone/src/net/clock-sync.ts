/** Answers to `time` the phone asks for when a connection opens (COUNT-01 AC 3). */
export const CLOCK_SYNC_SAMPLES = 3;

/** One `time` answer: the phone's send time, echoed back, and the server's time. */
export interface TimeAnswer {
  clientTime: number;
  serverTime: number;
}

/** The best estimate so far of how far the server clock is ahead of the phone's. */
export interface ClockSample {
  /** Server time minus local time, in ms. */
  offsetMs: number;
  roundTripMs: number;
}

/**
 * Folds a `time` answer received at `receivedAt` (local ms) into the estimate. The
 * sample with the lowest round trip wins, because its midpoint is the most precise
 * (COUNT-01 AC 3): offset = serverTime - (sent + received) / 2.
 */
export function addTimeSample(best: ClockSample | null, answer: TimeAnswer, receivedAt: number): ClockSample {
  const roundTripMs = receivedAt - answer.clientTime;
  const midpoint = (answer.clientTime + receivedAt) / 2;
  const sample = { offsetMs: answer.serverTime - midpoint, roundTripMs };
  if (best !== null && best.roundTripMs <= sample.roundTripMs) return best;
  return sample;
}

/** The server clock at local time `localNow`; the local clock until a sample arrives. */
export function serverNow(best: ClockSample | null, localNow: number): number {
  return localNow + (best?.offsetMs ?? 0);
}
