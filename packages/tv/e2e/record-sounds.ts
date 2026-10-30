import type { Page } from '@playwright/test';

/** One sound the page started, as the fake context saw it. */
export interface StartedSound {
  frequencyHz: number;
  peakGain: number;
}

/**
 * Replaces the browser's `AudioContext` with one that notes each sound, in the state `state`. The tests can read
 * what the TV plays; a real speaker is out of reach (TVAUDIO-01, Independent Test).
 */
export async function recordSounds(page: Page, state: 'running' | 'suspended') {
  await page.addInitScript((initialState) => {
    const sounds: { frequencyHz: number; peakGain: number }[] = [];
    (window as unknown as { sounds: typeof sounds }).sounds = sounds;
    const param = () => ({
      value: 0,
      peak: 0,
      setValueAtTime(value: number) {
        this.value = value;
        this.peak = Math.max(this.peak, value);
      },
      exponentialRampToValueAtTime() {},
    });
    class RecordingContext {
      state = initialState;
      currentTime = 0;
      destination = {};
      addEventListener() {}
      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
      createGain() {
        return { gain: param(), connect() {} };
      }
      createOscillator() {
        const oscillator = {
          frequency: param(),
          output: null as { gain?: { peak: number } } | null,
          connect(target: { gain?: { peak: number } }) {
            oscillator.output = target;
          },
          start() {
            sounds.push({ frequencyHz: oscillator.frequency.value, peakGain: oscillator.output?.gain?.peak ?? 0 });
          },
          stop() {},
        };
        return oscillator;
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = RecordingContext;
  }, state);
}
