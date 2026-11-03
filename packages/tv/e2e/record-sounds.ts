import type { Page } from '@playwright/test';

/** One sound the page started, as the fake context saw it. */
export interface StartedSound {
  frequencyHz: number;
  peakGain: number;
}

/** One note of the music the page started, at `startS` on the context's clock. */
export interface StartedNote {
  frequencyHz: number;
  startS: number;
}

/**
 * Replaces the browser's `AudioContext` with one that notes each sound, in the state `state`. The tests can read
 * what the TV plays; a real speaker is out of reach (TVAUDIO-01, Independent Test). The notes of the music go through
 * the gain of their track, so a note whose gain connects to another gain is music, in `window.music`; the effects go
 * straight to the speakers or, as the whistle's vibrato, to a param, and stay in `window.sounds` (MUSIC-01).
 */
export async function recordSounds(page: Page, state: 'running' | 'suspended') {
  await page.addInitScript((initialState) => {
    const sounds: { frequencyHz: number; peakGain: number }[] = [];
    const music: { frequencyHz: number; startS: number }[] = [];
    const recorded = window as unknown as { sounds: typeof sounds; music: typeof music };
    recorded.sounds = sounds;
    recorded.music = music;
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
        const node = {
          gain: param(),
          target: null as { gain?: unknown } | null,
          connect(target: { gain?: unknown }) {
            node.target = target;
          },
        };
        return node;
      }
      createOscillator() {
        const oscillator = {
          frequency: param(),
          output: null as { gain?: { peak: number }; target?: { gain?: unknown } | null } | null,
          connect(target: { gain?: { peak: number } }) {
            oscillator.output = target;
          },
          start(time: number) {
            const frequencyHz = oscillator.frequency.value;
            if (oscillator.output?.target?.gain !== undefined) music.push({ frequencyHz, startS: time });
            else sounds.push({ frequencyHz, peakGain: oscillator.output?.gain?.peak ?? 0 });
          },
          stop() {},
        };
        return oscillator;
      }
    }
    (window as unknown as { AudioContext: unknown }).AudioContext = RecordingContext;
  }, state);
}
