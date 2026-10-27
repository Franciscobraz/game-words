import { createWithFreeCode, isRoomCode } from '@bwords/core';
import { readConfig } from './config.ts';
import type { Env } from './env.ts';
import { roomNotFound } from './socket.ts';

export { RoomDO } from './room-do.ts';

const WS_ROUTE = /^\/api\/rooms\/([^/]+)\/ws$/;

/** A float in [0, 1) from the crypto RNG, to draw room codes. */
const randomFloat = () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;

/** `POST /api/rooms`: a room on a free code, with its TV token (ROOM-01 AC 1-2). */
async function createRoom(env: Env): Promise<Response> {
  const cfg = readConfig(env);
  const { code, result } = await createWithFreeCode(
    (code) => env.ROOM.get(env.ROOM.idFromName(code)).create(code, cfg),
    randomFloat,
  );
  return Response.json({ code, tvToken: result.tvToken });
}

/** `GET /api/rooms/:code/ws`: the room's WebSocket, or `room-not-found` for a malformed code. */
function connect(request: Request, env: Env, code: string): Promise<Response> | Response {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected a WebSocket upgrade', { status: 426 });
  }
  if (!isRoomCode(code)) return roomNotFound();
  return env.ROOM.get(env.ROOM.idFromName(code)).fetch(request);
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/rooms' && request.method === 'POST') return createRoom(env);
    const ws = WS_ROUTE.exec(pathname);
    if (ws && request.method === 'GET') return connect(request, env, ws[1]!);
    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
