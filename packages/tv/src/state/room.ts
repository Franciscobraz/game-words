import type { CloseReason, ConnectionStatus, RoomConnection, Schedule, ServerMessage } from '@bwords/core';
import { type Signal, signal } from '@preact/signals';
import { applyServerMessage, INITIAL_VIEW, type RoomView } from '../model/room-view.ts';
import type { SavedRoom, TokenStore } from './token-store.ts';

/** The wait before asking for a room again after a failure (TVROOM-01 AC 5). */
export const ROOM_RETRY_MS = 5_000;

/** The connection's status, plus the time before there is a room to connect to (TVROOM-01 AC 1, 5). */
export type RoomStatus = ConnectionStatus | 'creating' | 'create-failed';

/** What the TV does when the server closes the room: open another by itself, wait for a press, or just stop. */
export type CloseAction = 'open-new-room' | 'wait-for-press' | 'stop';

/**
 * The action of each close reason (TVEXIT-01 AC 1-2, 4). A TV is never kicked, but the protocol has the code, and a
 * screen left without a room must not get stuck. `replaced` keeps the token, which the other tab is using.
 */
const CLOSE_ACTIONS: Record<CloseReason, CloseAction> = {
  'closed-by-host': 'open-new-room',
  kicked: 'open-new-room',
  idle: 'wait-for-press',
  'tv-gone': 'wait-for-press',
  replaced: 'stop',
};

/** What to do when the server closes the room for `reason` (TVEXIT-01 AC 1-2, 4). */
export function closeAction(reason: CloseReason): CloseAction {
  return CLOSE_ACTIONS[reason];
}

/** What the connection reports to the store. */
export interface ConnectionHandlers {
  onMessage(msg: ServerMessage): void;
  onStatus(status: ConnectionStatus): void;
}

/** Everything the store needs from the outside; the tests pass fakes (style guide §4, D). */
export interface RoomDeps {
  /** Builds the room connection around the store's handlers. */
  openConnection(handlers: ConnectionHandlers): RoomConnection;
  /** Asks the server for a new room; rejects when it cannot get one. */
  createRoom(): Promise<SavedRoom>;
  tokens: TokenStore;
  schedule: Schedule;
}

/** The room as signals, and what the app can do with it (TVROOM-01). */
export interface RoomStore {
  room: Signal<RoomView>;
  status: Signal<RoomStatus>;
  /** The server clock now (TVPLAY-01 AC 3). */
  serverNow(): number;
  /** Goes back to the saved room, or creates one when there is none (TVROOM-01 AC 1-2). */
  open(): void;
  /** A key or a click: on "Sala expirada" it opens a new room; anywhere else it does nothing here (TVEXIT-01 AC 3). */
  pressOk(): void;
}

/** Creates the room signals and actions over one connection. */
export function createRoomStore(deps: RoomDeps): RoomStore {
  const { tokens } = deps;
  const room = signal<RoomView>(INITIAL_VIEW);
  const status = signal<RoomStatus>('closed');

  const link = deps.openConnection({
    onMessage: receive,
    onStatus: (next) => {
      status.value = next;
    },
  });

  function receive(msg: ServerMessage): void {
    room.value = applyServerMessage(room.value, msg);
    if (isRoomRefused(msg)) replaceRoom();
    if (msg.type === 'closed') endRoom(closeAction(msg.reason));
  }

  /** The connection already stopped by itself when `closed` arrived; what is left is the room (TVEXIT-01 AC 1-2, 4). */
  function endRoom(action: CloseAction): void {
    switch (action) {
      case 'open-new-room':
        replaceRoom();
        return;
      case 'wait-for-press':
        tokens.clear();
        return;
      case 'stop':
        return;
      default: {
        const never: never = action;
        throw new Error(`Unknown close action: ${String(never)}`);
      }
    }
  }

  /** The saved room is gone: forget it and open another (TVROOM-01 AC 3). */
  function replaceRoom(): void {
    tokens.clear();
    // `bad-token` leaves the socket to the server's close; closing here keeps that from reading as a drop to reconnect from.
    link.close();
    room.value = INITIAL_VIEW;
    void createRoom();
  }

  async function createRoom(): Promise<void> {
    status.value = 'creating';
    const created = await requestRoom();
    if (created === null) {
      status.value = 'create-failed';
      deps.schedule(() => void createRoom(), ROOM_RETRY_MS);
      return;
    }
    tokens.save(created);
    link.connect(created.code, created.tvToken);
  }

  /** The new room, or null when the server could not give one. */
  async function requestRoom(): Promise<SavedRoom | null> {
    try {
      return await deps.createRoom();
    } catch (error) {
      console.warn('The room could not be created', error);
      return null;
    }
  }

  return {
    room,
    status,
    serverNow: () => link.serverNow(),
    open() {
      const saved = tokens.load();
      if (saved === null) void createRoom();
      else link.connect(saved.code, saved.tvToken);
    },
    pressOk() {
      const { closeReason } = room.value;
      if (closeReason !== null && closeAction(closeReason) === 'wait-for-press') replaceRoom();
    },
  };
}

/** Whether the server refused the room this TV asked for: the token is wrong or the room no longer exists. */
function isRoomRefused(msg: ServerMessage): boolean {
  return msg.type === 'error' && (msg.code === 'bad-token' || msg.code === 'room-not-found');
}
