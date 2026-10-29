import type { ClientMessage, ServerMessage } from '@bwords/core';
import type { Page, WebSocketRoute } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A scripted room for the pictures: the page's socket is answered by the test, so
 * a screen shows the captures' sample data (room KBXT, Ana, Beto, Caio, Duda)
 * instead of a random code and fresh players.
 */

/** What the scripted server answers to each client message; `close` drops the socket after. */
export type Script = (msg: ClientMessage) => { replies: ServerMessage[]; close?: boolean };

/** The scripted room after the page connected: the test pushes messages and reads what the phone sent. */
export interface FakeRoom {
  /** Sends a message, or a binary hash frame, to the page's socket. */
  push(msg: ServerMessage | ArrayBuffer): void;
  /** Every message the page sent, `time` excluded, in order. */
  sent(): readonly ClientMessage[];
}

/** Routes the page's room socket to `script`; `time` gets the page's own clock back. */
export async function fakeRoom(page: Page, script: Script): Promise<FakeRoom> {
  const received: ClientMessage[] = [];
  let socket: WebSocketRoute | null = null;
  await page.routeWebSocket(/\/api\/rooms\/[^/]+\/ws$/, (ws) => {
    socket = ws;
    ws.onMessage((raw) => {
      const msg = JSON.parse(String(raw)) as ClientMessage;
      if (msg.type === 'time') {
        ws.send(JSON.stringify({ type: 'time', clientTime: msg.clientTime, serverTime: msg.clientTime }));
        return;
      }
      received.push(msg);
      const { replies, close = false } = script(msg);
      for (const reply of replies) ws.send(JSON.stringify(reply));
      if (close) ws.close();
    });
  });
  return {
    push(msg) {
      if (socket === null) throw new Error('The page has not opened the room socket yet');
      socket.send(msg instanceof ArrayBuffer ? Buffer.from(msg) : JSON.stringify(msg));
    },
    sent: () => received,
  };
}

const captures = join(dirname(fileURLToPath(import.meta.url)), '../../../.specs/features/m3-phone/captures');

/** Where the picture of `capture` goes, beside the capture itself. */
export function picturePath(capture: string): string {
  return join(captures, `${capture}.running.png`);
}
