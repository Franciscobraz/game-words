import { pickLongestWord } from '../longest.ts';
import type { LanguagePack } from '../pack.ts';
import { findPath } from '../path.ts';
import { scoreRound, wordPoints } from '../scoring.ts';
import { countsMessage } from './counts.ts';
import { type Effect, playersMessage, type RoomDeps, type StepResult } from './effects.ts';
import { awardWins, podiumMessage } from './flow.ts';
import type { PlayerResult, ResultWord, RoundResultsMessage } from './protocol.ts';
import { isLastRound } from './round.ts';
import type { RoomState } from './state.ts';

/** Shortest first, then alphabetical. */
const shortestFirst = (a: string, b: string) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0);

/** A result word with its real spellings, left out when the only spelling is the word itself (RES-01 AC 2). */
function resultWord(pack: LanguagePack, word: string, points: number): ResultWord {
  const spellings = pack.spellings(word);
  return spellings.length === 1 && spellings[0] === word ? { word, points } : { word, points, spellings };
}

/**
 * Ends the round: the TV first gets the final counts (ROUND-01 AC 10), then every
 * connection gets `round-results`, scored with `scoreRound` over the players of the
 * round (spectators and kicked players are out). Shared words go shortest first,
 * with who found each (PROTO-02 AC 1); players go from the lowest to the highest accumulated score, ties in joining
 * order; each player's unique words go shortest first with the doubled points they
 * earned. The longest word comes from `pickLongestWord`, with its path and finders.
 * `possibleWords` counts the round's solutions, which `prepareRound` already kept
 * with the room's minimum and filter (PROTO-02 AC 2).
 * While rounds remain, the adapter is asked to prepare the next board at once
 * (`prepare-next`, RES-01 AC 4). The last round ends the match without a `next`:
 * the room goes to the podium, with the wins counted over the final scores
 * (PROTO-02 AC 4, AC 7).
 */
export function endRound(state: RoomState, now: number, deps: RoomDeps): StepResult {
  const pack = deps.pack();
  const playing = state.players.filter((p) => !p.spectator);
  const found = new Map(playing.map((p) => [p.id, new Set(p.found)] as const));
  const score = scoreRound(found);
  const players = state.players.map((p) => (p.spectator ? p : { ...p, score: p.score + score.totals.get(p.id)! }));

  const ranked: PlayerResult[] = players
    .filter((p) => !p.spectator)
    .sort((a, b) => a.score - b.score)
    .map((p) => ({
      playerId: p.id,
      unique: [...score.unique.get(p.id)!].sort(shortestFirst).map((w) => resultWord(pack, w, wordPoints(w) * 2)),
      roundPoints: score.totals.get(p.id)!,
      score: p.score,
    }));

  const longest = pickLongestWord(state.solutions?.words ?? [], pack, found, false);
  const last = isLastRound(state);
  const msg: RoundResultsMessage = {
    type: 'round-results',
    index: state.roundIndex,
    shared: [...score.shared].sort(shortestFirst).map((w) => ({
      ...resultWord(pack, w, wordPoints(w)),
      foundBy: playing.filter((p) => found.get(p.id)!.has(w)).map((p) => p.id),
    })),
    players: ranked,
    longest: longest && {
      ...resultWord(pack, longest.word, wordPoints(longest.word)),
      path: findPath(state.round!.board, longest.word)!,
      foundBy: longest.foundBy,
    },
    possibleWords: state.solutions?.words.length ?? 0,
    last,
  };

  const next: RoomState = {
    ...state,
    phase: last ? 'podium' : 'results',
    players: last ? awardWins(players) : players,
    results: msg,
    rateWindow: {},
    tvCounts: { dirty: false, lastSentAt: now },
  };
  const effects: Effect[] = [{ kind: 'persist', keys: ['room'] }];
  if (state.tvConn !== null) effects.push({ kind: 'send', to: { id: state.tvConn, role: 'tv' }, msg: countsMessage(state) });
  effects.push({ kind: 'broadcast', msg });
  if (last) effects.push({ kind: 'broadcast', msg: podiumMessage(next) });
  // The players list carries the new scores and wins (RES-01 AC 11).
  effects.push({ kind: 'broadcast', msg: playersMessage(next) });
  if (!last) effects.push({ kind: 'prepare-next' });
  return { state: next, effects };
}
