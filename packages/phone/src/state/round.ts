import { MIN_WORD_LENGTH, type ServerMessage, type SubmitResult } from '@bwords/core';
import { effect, type Signal, signal } from '@preact/signals';
import { isBoardOpen } from '../model/board-lock.ts';
import { addFound, reconcileFound } from '../model/found.ts';
import { type Feedback, type JudgeContext, judgeWord } from '../model/judge.ts';
import { extendPath, type Path, wordOfPath } from '../model/path.ts';
import type { RoomView } from '../model/room-view.ts';
import { type QueuedWord, recentSends, stillUnsent, submitDelay, takeBatch, windowFreesIn } from '../model/submit-queue.ts';
import type { Schedule } from '../net/room-connection.ts';
import type { RoomStore } from './room.ts';

/** How long the feedback of a word stays on screen (PLAY-01 AC 11). */
export const FEEDBACK_VISIBLE_MS = 500;

/** How long the phone vibrates on a valid word (PLAY-01 AC 18). */
export const HIT_VIBRATION_MS = 50;

/** A path needs two tiles; a release on one tile shows nothing and sends nothing (Edge Cases). */
const MIN_PATH_TILES = 2;

/** The player's preferences the round reads on a valid word (PLAY-01 AC 18-19, PREF-01). */
export interface HitPrefs {
  vibrate: boolean;
  sound: boolean;
}

/** The device feedback of a valid word; `device/` gives the browser one, tests a fake (style guide §4, D). */
export interface HitDevice {
  vibrate(ms: number): void;
  playHitSound(): void;
}

/** Dependencies of the round state. */
export interface RoundDeps {
  room: RoomStore;
  schedule: Schedule;
  device: HitDevice;
  prefs: () => HitPrefs;
}

/** A valid path waiting to be sent, with the word it spells and its points. */
export type QueuedPath = QueuedWord;

/** The swipe, its feedback and the paths waiting to go to the server (PLAY-01). */
export interface RoundStore {
  /** The path under the finger. */
  path: Signal<Path>;
  /** The feedback on screen, for 0.5 s after a release; null when none shows. */
  feedback: Signal<Feedback | null>;
  /** Valid paths not sent yet. */
  pendingPaths: Signal<readonly QueuedPath[]>;
  /** The finger reached `tile`: the path grows, shrinks or stays (PLAY-01 AC 2-4). Ignored while the board is locked. */
  extendPathTo(tile: number): void;
  /** The finger lifted: judges the word, shows the feedback and queues a valid path (PLAY-01 AC 6-12, 18-19). */
  releasePath(): Promise<void>;
}

/** Creates the round state over the room store; it follows the room's messages to settle what it sent. */
export function createRoundStore(deps: RoundDeps): RoundStore {
  const { room, schedule } = deps;
  const path = signal<Path>([]);
  const feedback = signal<Feedback | null>(null);
  const pendingPaths = signal<readonly QueuedPath[]>([]);

  /** Each batch sent and not answered yet, oldest first; the server answers in order. */
  let inFlight: QueuedPath[][] = [];
  /** The round of the queued and sent paths, to send them again after a reconnect into the same round. */
  let queuedRoundId: number | null = null;
  /** From a drop until the `welcome` that rebuilds the room: nothing is sent, the queue waits (RECON-01). */
  let isRejoining = false;
  /** Server time of each path sent, for the 1 s rate window. */
  let sentAt: number[] = [];
  let cancelFlush: (() => void) | null = null;
  let cancelFeedback: (() => void) | null = null;

  room.listen((msg) => followServer(msg));
  effect(() => {
    const status = room.connection.value;
    if (status === 'reconnecting' || status === 'offline') isRejoining = true;
  });

  function followServer(msg: ServerMessage): void {
    switch (msg.type) {
      case 'submit-result':
        settleBatch(msg.results);
        return;
      case 'round-results':
        // The server closed the round: paths still waiting would come back `round-closed` (Edge Cases).
        dropPending();
        path.value = [];
        return;
      case 'welcome':
        resumeAfterWelcome();
        return;
      case 'round-start':
      case 'closed':
        reset();
        return;
      default:
        return;
    }
  }

  /** The server answered the oldest batch: refused words leave the list (PLAY-01 AC 13). */
  function settleBatch(results: readonly SubmitResult[]): void {
    const batch = inFlight.shift();
    if (batch === undefined) return;
    const view = room.room.value;
    const words = batch.map((q) => q.word);
    room.room.value = { ...view, found: reconcileFound(view.found, words, results) };
  }

  function dropPending(): void {
    cancelFlush?.();
    cancelFlush = null;
    pendingPaths.value = [];
  }

  /**
   * The `welcome` rebuilt the view with only the words the server accepted. Paths
   * queued or sent before a drop into this same round are listed again and sent
   * again, so a word shown as valid is still judged (RECON-01 AC 3, PLAY-01 AC 12).
   */
  function resumeAfterWelcome(): void {
    const carried = [...inFlight.flat(), ...pendingPaths.value];
    const carriedRoundId = queuedRoundId;
    reset();
    isRejoining = false;
    const view = room.room.value;
    const round = view.round;
    if (view.phase !== 'round' || round === null || round.id !== carriedRoundId) return;
    const missing = stillUnsent(
      carried,
      view.found.map((f) => f.word),
    );
    if (missing.length === 0) return;
    let found = view.found;
    for (const entry of missing) found = addFound(found, entry.word, entry.points);
    room.room.value = { ...view, found };
    queuedRoundId = round.id;
    pendingPaths.value = missing;
    scheduleFlush(submitDelay(room.serverNow(), round.endsAt));
  }

  /** A new round, a rebuilt view or a closed room: nothing of the old swipes is left. */
  function reset(): void {
    dropPending();
    inFlight = [];
    queuedRoundId = null;
    path.value = [];
    cancelFeedback?.();
    cancelFeedback = null;
    feedback.value = null;
  }

  function isOpen(): boolean {
    return isBoardOpen(room.room.value, room.connection.value, room.serverNow());
  }

  function showFeedback(next: Feedback): void {
    cancelFeedback?.();
    feedback.value = next;
    cancelFeedback = schedule(() => {
      cancelFeedback = null;
      feedback.value = null;
    }, FEEDBACK_VISIBLE_MS);
  }

  /** A valid word: first in the list, queued for the server, and the device's cheer (PLAY-01 AC 7, 12, 18-19). */
  function accept(swiped: Path, word: string, points: number, round: { id: number; endsAt: number }): void {
    const view = room.room.value;
    room.room.value = { ...view, found: addFound(view.found, word, points) };
    queuedRoundId = round.id;
    pendingPaths.value = [...pendingPaths.value, { path: swiped, word, points }];
    scheduleFlush(submitDelay(room.serverNow(), round.endsAt));
    const prefs = deps.prefs();
    if (prefs.vibrate) deps.device.vibrate(HIT_VIBRATION_MS);
    if (prefs.sound) deps.device.playHitSound();
  }

  /** Each valid path restarts the wait, so a burst of words goes in one `submit` (PLAY-01 AC 12). */
  function scheduleFlush(delayMs: number): void {
    cancelFlush?.();
    cancelFlush = null;
    if (delayMs === 0) {
      flush();
      return;
    }
    cancelFlush = schedule(flush, delayMs);
  }

  /** Sends what the rate window allows; the rest waits for the window to free up. */
  function flush(): void {
    cancelFlush = null;
    // A path sent into a dropped socket is lost; the queue waits for the welcome instead.
    if (isRejoining) return;
    const now = room.serverNow();
    const recent = recentSends(sentAt, now);
    const queued = pendingPaths.value;
    const { batch } = takeBatch(
      queued.map((q) => q.path),
      recent.length,
    );
    const sending = queued.slice(0, batch.length);
    if (sending.length > 0) {
      room.submit(sending.map((q) => [...q.path]));
      inFlight.push(sending);
    }
    sentAt = [...recent, ...sending.map(() => now)];
    pendingPaths.value = queued.slice(sending.length);
    if (pendingPaths.value.length > 0) cancelFlush = schedule(flush, windowFreesIn(sentAt, now));
  }

  return {
    path,
    feedback,
    pendingPaths,
    extendPathTo(tile) {
      const round = room.room.value.round;
      if (round === null || !isOpen()) return;
      path.value = extendPath(path.value, tile, round.board.length);
    },
    async releasePath() {
      const swiped = path.value;
      path.value = [];
      const view = room.room.value;
      const round = view.round;
      if (round === null || swiped.length < MIN_PATH_TILES || !isOpen()) return;

      const word = wordOfPath(round.board, swiped);
      const judged = await judgeWord(word, judgeContext(view));
      const latest = room.room.value;
      // The round ended or changed while the hash was computed: the swipe no longer counts.
      if (latest.phase !== 'round' || latest.round?.id !== round.id) return;

      const verdict = recheckFound(judged, latest);
      showFeedback(verdict);
      if (verdict.kind === 'valid') accept(swiped, verdict.word, verdict.points, round);
    },
  };
}

/** What the judge needs from the view (PLAY-01 AC 7-10). */
function judgeContext(view: RoomView): JudgeContext {
  return {
    minLength: view.settings?.minLength ?? MIN_WORD_LENGTH,
    found: view.found.map((f) => f.word),
    salt: view.salt,
    hashes: view.hashes,
  };
}

/** A word listed by a quicker swipe while this one was judged is already found, not valid twice (PLAY-01 AC 8). */
function recheckFound(judged: Feedback, view: RoomView): Feedback {
  if (judged.kind !== 'valid') return judged;
  const listed = view.found.some((f) => f.word === judged.word);
  return listed ? { kind: 'already-found', word: judged.word } : judged;
}
