import type { ClientMessage, ServerMessage, WelcomeMessage } from '@bwords/core';
import type { BrowserContext, WebSocketRoute } from '@playwright/test';

const ROOM_SOCKET = /\/api\/rooms\/[^/]+\/ws$/;

/**
 * Chromium's offline mode does not drop an open WebSocket, so the socket is cut at the route: the page's `close` event
 * fires as on a real drop, and the connection under test runs for real. This file holds a scripted server and a real one.
 */

/** A scripted room whose server the test can take down and bring back. */
export interface CuttableRoom {
  /** Sends a message to the open socket. */
  push(msg: ServerMessage): void;
  /** Drops the open socket with no `closed` message, as a dead network does. */
  cut(): void;
  /** From now on each attempt to reconnect is dropped at once. */
  goAway(): void;
  /** From now on an attempt gets the room back, as `welcome` and `after` describe it. */
  comeBack(welcome: WelcomeMessage, after?: readonly ServerMessage[]): void;
  /** Every socket the page has opened so far. */
  socketCount(): number;
}

/** Answers the page's room creation and its sockets; `time` adds `clockOffsetMs` to the page's clock. */
export async function cuttableRoom(context: BrowserContext, firstWelcome: WelcomeMessage, clockOffsetMs = 0): Promise<CuttableRoom> {
  let socket: WebSocketRoute | null = null;
  let count = 0;
  let isReachable = true;
  let welcome = firstWelcome;
  let afterWelcome: readonly ServerMessage[] = [];

  await context.route('**/api/rooms', (route) => route.fulfill({ json: { code: firstWelcome.code, tvToken: 'sample-tv-token' } }));
  await context.routeWebSocket(ROOM_SOCKET, (ws) => {
    count += 1;
    if (!isReachable) {
      void ws.close();
      return;
    }
    socket = ws;
    ws.onMessage((raw) => {
      const msg = JSON.parse(String(raw)) as ClientMessage;
      if (msg.type === 'time') ws.send(JSON.stringify({ type: 'time', clientTime: msg.clientTime, serverTime: msg.clientTime + clockOffsetMs }));
      if (msg.type !== 'hello') return;
      ws.send(JSON.stringify(welcome));
      for (const next of afterWelcome) ws.send(JSON.stringify(next));
    });
  });

  return {
    push(msg) {
      if (socket === null) throw new Error('The page has not opened the room socket yet');
      socket.send(JSON.stringify(msg));
    },
    cut() {
      if (socket === null) throw new Error('The page has not opened the room socket yet');
      void socket.close();
      socket = null;
    },
    goAway() {
      isReachable = false;
    },
    comeBack(nextWelcome, after = []) {
      isReachable = true;
      welcome = nextWelcome;
      afterWelcome = after;
    },
    socketCount: () => count,
  };
}

/** The real server behind a socket the test can cut. */
export interface CuttableLink {
  /** Drops the open socket on both ends. */
  cut(): void;
  /** From now on each attempt to reconnect is dropped at once. */
  goAway(): void;
  /** From now on an attempt reaches the server. */
  comeBack(): void;
}

/** Lets the page's sockets through to the real server until the test cuts them. */
export async function cuttableLink(context: BrowserContext): Promise<CuttableLink> {
  let cutOpenSocket: (() => void) | null = null;
  let isReachable = true;

  await context.routeWebSocket(ROOM_SOCKET, (ws) => {
    if (!isReachable) {
      void ws.close();
      return;
    }
    const server = ws.connectToServer();
    cutOpenSocket = () => {
      void server.close();
      void ws.close();
    };
  });

  return {
    cut() {
      if (cutOpenSocket === null) throw new Error('The page has not opened the room socket yet');
      cutOpenSocket();
      cutOpenSocket = null;
    },
    goAway() {
      isReachable = false;
    },
    comeBack() {
      isReachable = true;
    },
  };
}
