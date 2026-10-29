import { type ClientMessage, cleanNickname, type CloseReason, type ServerMessage, type Settings } from '@bwords/core';
import { type Signal, signal } from '@preact/signals';
import { applyHashFrame, applyServerMessage, type HashFrame, INITIAL_VIEW, type RoomView } from '../model/room-view.ts';
import type { ConnectionStatus, RoomConnection } from '../net/room-connection.ts';

/** The part of `localStorage` the store uses; the browser one may throw, the device adapter hides that. */
export interface KeyValueStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** What the connection reports to the store. */
export interface ConnectionHandlers {
  onMessage(msg: ServerMessage): void;
  onHashes(frame: HashFrame): void;
  onStatus(status: ConnectionStatus): void;
}

/** Builds the room connection around the store's handlers; tests pass a fake one. */
export type OpenConnection = (handlers: ConnectionHandlers) => RoomConnection;

/** Dependencies of the room store (style guide §4, D). */
export interface RoomDeps {
  openConnection: OpenConnection;
  storage: KeyValueStorage;
}

/** The room as signals, and the actions the screens call (ENTRY-01, JOIN-01, HOST-01, EXIT-01). */
export interface RoomStore {
  room: Signal<RoomView>;
  connection: Signal<ConnectionStatus>;
  /** The server clock now (COUNT-01 AC 3). */
  serverNow(): number;
  /** Opens room `code`, coming back with its saved token when there is one (ENTRY-01 AC 1, 6). */
  openRoom(code: string): void;
  /** Sends `join` with the trimmed nickname and the color (JOIN-01 AC 5). */
  join(nickname: string, color: string): void;
  changeSettings(patch: Partial<Settings>): void;
  start(): void;
  next(): void;
  transferHost(playerId: string): void;
  kick(playerId: string): void;
  playAgain(): void;
  backToLobby(): void;
  closeRoom(): void;
  /** "Tentar de novo" after "Sem conexão" (RECON-01 AC 4). */
  retry(): void;
  /** "ENTRAR EM OUTRA SALA": forgets this room, which brings back the code screen (EXIT-01 AC 5). */
  leaveRoom(): void;
}

/** Close reasons that end this phone's place in the room, so its token is useless (EXIT-01 AC 1-3). */
const TOKEN_ENDING_REASONS: ReadonlySet<CloseReason> = new Set<CloseReason>(['kicked', 'closed-by-host', 'idle', 'tv-gone']);

/** Where the token of room `code` is kept; never in the URL (ENTRY-01, DESIGN §2). */
export function tokenKey(code: string): string {
  return `bwords.token.${code}`;
}

/** Creates the room signals and actions over one connection. */
export function createRoomStore(deps: RoomDeps): RoomStore {
  const { storage } = deps;
  const room = signal<RoomView>(INITIAL_VIEW);
  const connection = signal<ConnectionStatus>('closed');

  const link = deps.openConnection({
    onMessage: (msg) => receive(msg),
    onHashes: (frame) => {
      room.value = applyHashFrame(room.value, frame);
    },
    onStatus: (status) => {
      connection.value = status;
    },
  });

  function receive(msg: ServerMessage): void {
    room.value = applyServerMessage(room.value, msg);
    const code = room.value.code;
    if (code === null) return;
    if (msg.type === 'joined') storage.set(tokenKey(code), msg.token);
    if (msg.type === 'error' && msg.code === 'bad-token') restartWithoutToken(code);
    if (msg.type === 'closed' && TOKEN_ENDING_REASONS.has(msg.reason)) storage.remove(tokenKey(code));
  }

  /** The saved token is no longer valid: forget it and enter the room as a newcomer (ENTRY-01 AC 7). */
  function restartWithoutToken(code: string): void {
    storage.remove(tokenKey(code));
    room.value = { ...INITIAL_VIEW, code };
    link.connect(code, null);
  }

  const send = (msg: ClientMessage) => link.send(msg);

  return {
    room,
    connection,
    serverNow: () => link.serverNow(),
    openRoom(code) {
      room.value = { ...INITIAL_VIEW, code };
      link.connect(code, storage.get(tokenKey(code)));
    },
    join(nickname, color) {
      // An invalid nickname still goes out trimmed, for the server to answer `bad-nickname` (JOIN-01 AC 6).
      const cleaned = cleanNickname(nickname) ?? nickname.trim();
      send({ type: 'join', nickname: cleaned, color });
    },
    changeSettings: (patch) => send({ type: 'settings', patch }),
    start: () => send({ type: 'start' }),
    next: () => send({ type: 'next' }),
    transferHost: (playerId) => send({ type: 'transfer-host', playerId }),
    kick: (playerId) => send({ type: 'kick', playerId }),
    playAgain: () => send({ type: 'play-again' }),
    backToLobby: () => send({ type: 'back-to-lobby' }),
    closeRoom: () => send({ type: 'close-room' }),
    retry: () => link.retry(),
    leaveRoom() {
      link.close();
      room.value = INITIAL_VIEW;
    },
  };
}
