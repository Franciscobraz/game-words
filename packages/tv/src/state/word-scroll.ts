import type { RoundResultsMessage, ScrollDirection } from '@bwords/core';
import { computed, effect, type ReadonlySignal, signal } from '@preact/signals';
import { foundWordCount, type RevealPlan } from '../model/reveal.ts';
import type { RoomView } from '../model/room-view.ts';
import { autoOffset, highlightIndex, type ScrollLayout, stepOffset } from '../model/word-scroll.ts';

/** Who moves the list: the clock, until the host's first step (WORDCTL-01 AC 5-6, 16). */
export type ScrollMode = 'auto' | 'manual';

/** What the list needs from the rest of the TV; the tests pass fakes (style guide §4, D). */
export interface WordScrollDeps {
  room: ReadonlySignal<RoomView>;
  /** The reveal's plan: the list opens at `wordsStartAt`. */
  plan: ReadonlySignal<RevealPlan | null>;
  /** The results of the round whose words are on the screen. */
  results: ReadonlySignal<RoundResultsMessage | null>;
  /** The server clock now. */
  serverNow(): number;
  /** Plays the "check" in the room's volume and mute (WORDCTL-01 AC 15). */
  playCheck(): void;
}

/** The list of words as signals and actions (WORDCTL-01). */
export interface WordScrollStore {
  mode: ReadonlySignal<ScrollMode>;
  /** How far the list has gone up, in pixels of the measured layout; 0 before the layout. */
  offset: ReadonlySignal<number>;
  /** The highlighted word, in list order; null before the list opens and after the host's first step. */
  highlight: ReadonlySignal<number | null>;
  /** The screen measured the panel and the rows. */
  setLayout(layout: ScrollLayout): void;
  /** A step of the host, from the server's `scroll` (WORDCTL-01 AC 5-7). */
  step(direction: ScrollDirection): void;
  /** Reads the server clock; the list moves and highlights from it. */
  tick(serverNow: number): void;
}

/**
 * Keeps where the list is and which word is highlighted. The list moves by itself from the clock, and the host's first
 * step freezes it where it is and hands it over, with no highlight and no "check" until the end (WORDCTL-01 AC 5-7, 16).
 * Every list starts in the automatic mode: a new round, the result, or a reload (WORDCTL-01 AC 11).
 */
export function createWordScrollStore({ room, plan, results, serverNow, playCheck }: WordScrollDeps): WordScrollStore {
  const now = signal(serverNow());
  const layout = signal<ScrollLayout | null>(null);
  const mode = signal<ScrollMode>('auto');
  const manualOffset = signal(0);

  /** The instant the list on the screen opened; null while no list is on it. */
  const listStartAt = computed(() => (room.value.phase === 'words' ? (plan.value?.wordsStartAt ?? null) : null));

  const highlight = computed(() => {
    const startAt = listStartAt.value;
    const shown = results.value;
    if (mode.value === 'manual' || startAt === null || shown === null) return null;
    return highlightIndex(now.value - startAt, foundWordCount(shown));
  });

  const offset = computed(() => {
    const measured = layout.value;
    const startAt = listStartAt.value;
    if (measured === null || startAt === null) return 0;
    return mode.value === 'manual' ? manualOffset.value : autoOffset(measured, now.value - startAt);
  });

  // A new list, or none: back to the automatic mode, with no word checked yet.
  let checkedIndex: number | null = null;
  let listedAt: number | null | undefined;
  effect(() => {
    const startAt = listStartAt.value;
    if (startAt === listedAt) return;
    listedAt = startAt;
    mode.value = 'auto';
    manualOffset.value = 0;
    layout.value = null;
    checkedIndex = null;
  });

  // Each word that becomes highlighted plays one "check" (WORDCTL-01 AC 15).
  effect(() => {
    const index = highlight.value;
    if (index === null || index === checkedIndex) return;
    checkedIndex = index;
    playCheck();
  });

  return {
    mode,
    offset,
    highlight,
    setLayout(measured) {
      layout.value = measured;
    },
    step(direction) {
      const measured = layout.peek();
      const startAt = listStartAt.peek();
      if (startAt === null) return;
      if (measured === null) {
        mode.value = 'manual';
        return;
      }
      const from = mode.peek() === 'manual' ? manualOffset.peek() : autoOffset(measured, serverNow() - startAt);
      manualOffset.value = stepOffset(measured, from, direction);
      mode.value = 'manual';
    },
    tick(serverNowMs) {
      now.value = serverNowMs;
    },
  };
}
