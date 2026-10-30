import type { ClientMessage, ServerMessage, WelcomeMessage } from '@bwords/core';
import type { Page, WebSocketRoute } from '@playwright/test';

/**
 * A scripted room for the screens: `POST /api/rooms` and the room socket are answered by the test,
 * so a screen shows the captures' sample data (room KBXT) at a time the test controls. The real
 * server is covered by `open-room.spec.ts` and by the full match.
 */

/** The scripted room after the page connected. */
export interface FakeRoom {
  /** Sends a message to the page's socket. */
  push(msg: ServerMessage): void;
}

/** Answers the page's room creation and its `hello` with `welcome`; `time` gets the page's own clock back. */
export async function fakeRoom(page: Page, welcome: WelcomeMessage): Promise<FakeRoom> {
  let socket: WebSocketRoute | null = null;
  await page.route('**/api/rooms', (route) => route.fulfill({ json: { code: welcome.code, tvToken: 'sample-tv-token' } }));
  await page.routeWebSocket(/\/api\/rooms\/[^/]+\/ws$/, (ws) => {
    socket = ws;
    ws.onMessage((raw) => {
      const msg = JSON.parse(String(raw)) as ClientMessage;
      if (msg.type === 'time') ws.send(JSON.stringify({ type: 'time', clientTime: msg.clientTime, serverTime: msg.clientTime }));
      if (msg.type === 'hello') ws.send(JSON.stringify(welcome));
    });
  });
  return {
    push(msg) {
      if (socket === null) throw new Error('The page has not opened the room socket yet');
      socket.send(JSON.stringify(msg));
    },
  };
}
