import type { ServerMessage } from '@bwords/core';

/** Close code of every socket the server closes; the reason travels in a `closed` or `error` message first. */
export const CLOSE_CODE = 1000;

/**
 * Answers a WebSocket upgrade for a room that does not exist: accepts it, sends
 * `error room-not-found` and closes it (JOIN-01 AC 8).
 */
export function roomNotFound(): Response {
  const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
  server.accept();
  const msg: ServerMessage = { type: 'error', code: 'room-not-found' };
  server.send(JSON.stringify(msg));
  server.close(CLOSE_CODE, 'room-not-found');
  return new Response(null, { status: 101, webSocket: client });
}

/** 16 random bytes in base64url: room and player tokens. */
export function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
