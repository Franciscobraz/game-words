import type { RoundResultsMessage } from '@bwords/core';
import { effect, type ReadonlySignal, signal } from '@preact/signals';
import { type RevealPlan, revealPlan, type RevealStage, revealStage } from '../model/reveal.ts';
import type { RoomView } from '../model/room-view.ts';

/** What the reveal clock needs from the outside; the tests pass fakes (style guide §4, D). */
export interface RevealDeps {
  room: ReadonlySignal<RoomView>;
  /** The server clock now. */
  serverNow(): number;
}

/** The stages after a round (TVWORDS-01). */
export interface RevealClock {
  /** The plan of the round that ended; null when no reveal is running. */
  plan: ReadonlySignal<RevealPlan | null>;
  /** The results of that round; they stay when a reconnect's `welcome` empties the view for an instant (TVEXIT-01 AC 5). */
  results: ReadonlySignal<RoundResultsMessage | null>;
  /** The stage at `now`; null when no reveal is running. */
  stageAt(now: number): RevealStage | null;
}

/**
 * Notes when the results of a round arrive; the stages come from that instant and the clock, so nothing here counts time.
 * A reconnect gets the same results again and keeps its plan, while a reload starts from nothing and restarts the words
 * (TVWORDS-01 AC 11, TVEXIT-01 AC 7).
 */
export function createRevealClock({ room, serverNow }: RevealDeps): RevealClock {
  const plan = signal<RevealPlan | null>(null);
  const planned = signal<RoundResultsMessage | null>(null);

  effect(() => {
    const { phase, results, round } = room.value;
    if (phase !== 'results' && phase !== 'podium') {
      plan.value = null;
      planned.value = null;
      return;
    }
    if (results === null || results.index === planned.peek()?.index) return;
    planned.value = results;
    plan.value = revealPlan(results, round?.endsAt ?? null, serverNow());
  });

  return {
    plan,
    results: planned,
    stageAt(now) {
      const current = plan.value;
      return current === null ? null : revealStage(now, current);
    },
  };
}
