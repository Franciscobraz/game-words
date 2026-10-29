/** Pitch of the hit beep, in Hz. */
const HIT_FREQUENCY_HZ = 880;

/** Length of the hit beep, in seconds: short enough not to cover the next swipe (PLAY-01 AC 19). */
const HIT_DURATION_S = 0.12;

/** Loudness of the beep, from 0 to 1. */
const HIT_GAIN = 0.2;

/** The fade-out ends at this gain, since an exponential ramp cannot reach 0. */
const SILENT_GAIN = 0.0001;

let context: AudioContext | null = null;

/**
 * Plays a short beep made with Web Audio, with no audio file (design, device/).
 * The context starts on the first valid word, which follows a touch, so the
 * browser lets it play.
 */
export function playHitSound(): void {
  try {
    context ??= new AudioContext();
    const start = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = HIT_FREQUENCY_HZ;
    gain.gain.setValueAtTime(HIT_GAIN, start);
    gain.gain.exponentialRampToValueAtTime(SILENT_GAIN, start + HIT_DURATION_S);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + HIT_DURATION_S);
  } catch (error) {
    console.warn('The hit sound could not play', error);
  }
}
