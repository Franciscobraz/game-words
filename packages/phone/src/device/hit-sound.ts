import { type AudioContextLike, CHECK_SOUND, playNotes } from '@bwords/core';

/** Peak loudness of the check, from 0 to 1. */
const HIT_GAIN = 0.2;

/**
 * The sound of a valid word: the same "check" the TV plays on the words list, made
 * with Web Audio from `CHECK_SOUND`, with no audio file (FEEDBACK-02 AC 2). The
 * context is made on the first valid word, which follows a touch, so the browser
 * lets it play; later words reuse it.
 */
export function createHitSound(createContext: () => AudioContextLike): () => void {
  let context: AudioContextLike | null = null;
  return () => {
    try {
      context ??= createContext();
      playNotes(context, CHECK_SOUND, context.currentTime, HIT_GAIN);
    } catch (error) {
      console.warn('The hit sound could not play', error);
    }
  };
}
