import type { ServerMessage } from '@bwords/core';
import { computed, type ReadonlySignal, type Signal, signal } from '@preact/signals';
import { addRound, type MatchSummary, matchSummary, type RoundRecord } from '../model/match-summary.ts';
import { myWordRows } from '../model/results.ts';
import type { RoomStore } from './room.ts';

/** The rounds of the match this phone saw, for the podium's personal blocks (POD-01 AC 4-6, AD-007). */
export interface MatchStore {
  /** Grows with every `round-results`; empty again when round 0 of a new match counts down. */
  history: Signal<readonly RoundRecord[]>;
  /** "SEU RENDIMENTO" and "MAIOR PALAVRA ENCONTRADA". */
  summary: ReadonlySignal<MatchSummary>;
}

/**
 * Follows the room's messages to keep the match history. It lives only in memory, so
 * a phone that reloads counts only the rounds that end after it came back (POD-01 AC 6).
 */
export function createMatchStore(room: RoomStore): MatchStore {
  const history = signal<readonly RoundRecord[]>([]);
  const summary = computed(() => matchSummary(history.value));

  room.listen((msg) => follow(msg));

  function follow(msg: ServerMessage): void {
    if (msg.type === 'round-start' && msg.index === 0) history.value = [];
    if (msg.type !== 'round-results') return;
    // The room signal already took the message in, so `found` holds the round's accepted words.
    const view = room.room.value;
    const words = myWordRows(view.found, msg, view.myId);
    history.value = addRound(history.value, { index: msg.index, words });
  }

  return { history, summary };
}
