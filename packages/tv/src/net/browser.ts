import type { OpenSocket, Schedule } from '@bwords/core';
import { parseSavedRoom, type SavedRoom } from '../state/token-store.ts';

/**
 * The browser side of `RoomConnection`: a real WebSocket on the page's own origin,
 * which Vite proxies to the server in development, and real timers. Tokens never go
 * in the URL; they travel in `hello` (TVROOM-01 AC 4).
 */
export const browserSocket: OpenSocket = (path, events) => {
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${scheme}://${location.host}${path}`);
  socket.binaryType = 'arraybuffer';
  socket.addEventListener('open', () => events.onOpen());
  socket.addEventListener('message', (event: MessageEvent<string | ArrayBuffer>) => events.onMessage(event.data));
  socket.addEventListener('close', () => events.onClose());
  return {
    send: (text) => socket.send(text),
    close: () => socket.close(1000),
  };
};

/** `setTimeout` with a cancel function. */
export const browserSchedule: Schedule = (run, ms) => {
  const id = setTimeout(run, ms);
  return () => clearTimeout(id);
};

/** `POST /api/rooms`: a new room and its TV token (TVROOM-01 AC 1). Rejects on any failure, and the store retries. */
export async function requestNewRoom(): Promise<SavedRoom> {
  const response = await fetch('/api/rooms', { method: 'POST' });
  if (!response.ok) throw new Error(`POST /api/rooms answered ${response.status}`);
  const room = parseSavedRoom(await response.json());
  if (room === null) throw new Error('POST /api/rooms answered without a room');
  return room;
}
