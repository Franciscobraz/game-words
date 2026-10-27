import type { PersistKey, Player, PreparedBoard, RoomState, RoundSolutions } from '@bwords/core';

/**
 * The room in the Durable Object storage (KV API on SQLite), one key per group of
 * data, so a step writes only what it changed (design: "Storage"):
 * - `room`: the state without the round words, the solutions and the rate window
 * - `round:solutions`: the current round's solutions and hash prefixes
 * - `round:next`: the prepared next board and its solutions
 * - `found:<playerId>`: the words a player found in the current round
 * A key whose data is gone (no round, no player, no words) is deleted.
 */

/** What `room` holds: players without their round words. */
type RoomRecord = Omit<RoomState, 'solutions' | 'nextRound' | 'nextSolutions' | 'rateWindow' | 'players'> & {
  players: Omit<Player, 'found'>[];
};

interface NextRecord {
  board: PreparedBoard;
  solutions: RoundSolutions;
}

const FOUND = 'found:';

function roomRecord(state: RoomState): RoomRecord {
  const { solutions: _s, nextRound: _n, nextSolutions: _ns, rateWindow: _r, players, ...rest } = state;
  return { ...rest, players: players.map(({ found: _f, ...p }) => p) };
}

/**
 * Writes `keys` from `state`. The writes are not awaited: the output gate of the
 * Durable Object holds every message sent after them until they are stored
 * (PERSIST-01 AC 1).
 */
export function saveKeys(storage: DurableObjectStorage, state: RoomState, keys: readonly PersistKey[]): void {
  for (const key of keys) {
    if (key === 'room') {
      void storage.put(key, roomRecord(state));
    } else if (key === 'round:solutions') {
      void (state.solutions ? storage.put(key, state.solutions) : storage.delete(key));
    } else if (key === 'round:next') {
      const next: NextRecord | null =
        state.nextRound && state.nextSolutions ? { board: state.nextRound, solutions: state.nextSolutions } : null;
      void (next ? storage.put(key, next) : storage.delete(key));
    } else {
      const found = state.players.find((p) => p.id === key.slice(FOUND.length))?.found ?? [];
      void (found.length > 0 ? storage.put(key, found) : storage.delete(key));
    }
  }
}

/** The room rebuilt from storage (PERSIST-01 AC 2), or null when there is none. The rate window starts empty. */
export async function loadRoom(storage: DurableObjectStorage): Promise<RoomState | null> {
  const record = await storage.get<RoomRecord>('room');
  if (!record) return null;
  const [solutions, next, found] = await Promise.all([
    storage.get<RoundSolutions>('round:solutions'),
    storage.get<NextRecord>('round:next'),
    storage.list<string[]>({ prefix: FOUND }),
  ]);
  return {
    ...record,
    players: record.players.map((p) => ({ ...p, found: found.get(`${FOUND}${p.id}`) ?? [] })),
    solutions: solutions ?? null,
    nextRound: next?.board ?? null,
    nextSolutions: next?.solutions ?? null,
    rateWindow: {},
  };
}
