import type { Phase, RoundResultsMessage } from '@bwords/core';
import { effect, type ReadonlySignal, signal } from '@preact/signals';
import { type RevealPhase, type RevealPlan, revealPlan, type RevealStage, revealStage } from '../model/reveal.ts';
import type { RoomView } from '../model/room-view.ts';

/** What the reveal clock needs from the outside; the tests pass fakes (style guide §4, D). */
export interface RevealDeps {
  room: ReadonlySignal<RoomView>;
  /** The server clock now. */
  serverNow(): number;
  /** Whether `serverNow` reads the server yet; before the first sample it is the TV's own clock. */
  clockSynced: ReadonlySignal<boolean>;
}

/** The stages after a round (TVWORDS-01, WORDCTL-01). */
export interface RevealClock {
  /** The plan of the round that ended; null when no reveal is running. */
  plan: ReadonlySignal<RevealPlan | null>;
  /** The results of that round; they stay when a reconnect's `welcome` empties the view for an instant (TVEXIT-01 AC 5). */
  results: ReadonlySignal<RoundResultsMessage | null>;
  /** The stage at `now`; null when no reveal is running. */
  stageAt(now: number): RevealStage | null;
}

/**
 * Notes when the results of a round arrive and when the result opens; the stages come from those instants, the phase and
 * the clock, so nothing here counts time. A reconnect gets the same results again and keeps its plan, while a reload
 * starts from nothing and restarts the words from the top (WORDCTL-01 AC 11, TVEXIT-01 AC 7). After a reload the results
 * come before the first clock sample, so the plan waits for it: the TV's own clock can be minutes off.
 */
export function createRevealClock({ room, serverNow, clockSynced }: RevealDeps): RevealClock {
  const plan = signal<RevealPlan | null>(null);
  const planned = signal<RoundResultsMessage | null>(null);
  // The index repeats in every match; the round id is unique in the room, so another match is another plan.
  let plannedRoundId: number | null = null;

  effect(() => {
    const { phase, results, round } = room.value;
    const synced = clockSynced.value;
    if (!isRevealPhase(phase)) {
      plan.value = null;
      planned.value = null;
      plannedRoundId = null;
      return;
    }
    if (results === null) return;
    const roundId = round?.id ?? null;
    if (results.index !== planned.peek()?.index || roundId !== plannedRoundId) {
      planned.value = results;
      plannedRoundId = roundId;
      plan.value = null;
    }
    if (!synced) return;
    const current = plan.peek() ?? revealPlan(round?.endsAt ?? null, serverNow());
    const resultOpened = phase !== 'words' && current.resultShownAt === null;
    plan.value = resultOpened ? { ...current, resultShownAt: serverNow() } : current;
  });

  return {
    plan,
    results: planned,
    stageAt(now) {
      const current = plan.value;
      const phase = room.value.phase;
      return current === null || !isRevealPhase(phase) ? null : revealStage(now, current, phase);
    },
  };
}

function isRevealPhase(phase: Phase | null): phase is RevealPhase {
  return phase === 'words' || phase === 'results' || phase === 'podium';
}
