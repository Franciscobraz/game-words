import { type ReadonlySignal, signal } from '@preact/signals';
import type { AudioDevice } from '../device/audio.ts';
import { type CueMoment, cuesBetween } from '../model/audio-cues.ts';
import type { RevealPlan } from '../model/reveal.ts';
import type { RoomView } from '../model/room-view.ts';

/** What the sounds need from the rest of the TV. */
export interface SoundDeps {
  audio: AudioDevice;
  room: ReadonlySignal<RoomView>;
  plan: ReadonlySignal<RevealPlan | null>;
}

/** The sounds of the TV as signals and actions (TVAUDIO-01). */
export interface SoundStore {
  /** Whether the browser is holding the sound back, for the lobby's notice (TVAUDIO-01 AC 3). */
  blocked: ReadonlySignal<boolean>;
  /** Lets the sound play; a key or a click is the gesture the browser asks for (TVAUDIO-01 AC 4). */
  unlock(): void;
  /** Reads the server clock and plays the cues crossed since the last reading (TVAUDIO-01 AC 1-2, 6). */
  tick(serverNow: number): void;
}

/** Links the room and the clock to the audio device; `cuesBetween` decides, and this only plays. */
export function createSoundStore({ audio, room, plan }: SoundDeps): SoundStore {
  const blocked = signal(audio.isBlocked());
  let lastMoment: CueMoment | null = null;

  function refreshBlocked(): void {
    blocked.value = audio.isBlocked();
  }
  audio.onBlockedChange(refreshBlocked);

  return {
    blocked,
    unlock() {
      void audio.unlock().then(refreshBlocked);
    },
    tick(serverNow) {
      const view = room.peek();
      const moment: CueMoment = {
        // A new sync can move the server clock back by a little; the same instant must not be crossed twice.
        now: Math.max(lastMoment?.now ?? serverNow, serverNow),
        phase: view.phase,
        round: view.round,
        wordsStartAt: plan.peek()?.wordsStartAt ?? null,
      };
      const cues = cuesBetween(lastMoment, moment);
      lastMoment = moment;
      const { settings } = view;
      if (settings === null) return;
      for (const cue of cues) audio.play(cue, settings.volume, settings.muted);
    },
  };
}
