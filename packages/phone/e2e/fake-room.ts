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
export type Script = (msg: ClientMessage) => { replies: Reply[]; close?: boolean };

/** A message of the scripted server, or a binary hash frame. */
export type Reply = ServerMessage | ArrayBuffer;

/** The scripted room after the page connected: the test pushes messages and reads what the phone sent. */
export interface FakeRoom {
  /** Sends a message, or a binary hash frame, to the page's socket. */
  push(msg: Reply): void;
  /** Every message the page sent, `time` excluded, in order. */
  sent(): readonly ClientMessage[];
  /** The network drops the page's socket, with no `closed` from the server. */
  drop(): void;
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
      for (const reply of replies) ws.send(encode(reply));
      if (close) ws.close();
    });
  });
  return {
    push(msg) {
      if (socket === null) throw new Error('The page has not opened the room socket yet');
      socket.send(encode(msg));
    },
    sent: () => received,
    drop() {
      if (socket === null) throw new Error('The page has not opened the room socket yet');
      void socket.close({ code: 1006 });
    },
  };
}

/** A reply as the socket carries it: JSON text, or the bytes of a hash frame. */
function encode(reply: Reply): string | Buffer {
  return reply instanceof ArrayBuffer ? Buffer.from(reply) : JSON.stringify(reply);
}

const captures = join(dirname(fileURLToPath(import.meta.url)), '../../../.specs/features/m3-phone/captures');

/** The width the captures were drawn at; their pictures are taken there. */
const CAPTURE_WIDTH = 390;

/**
 * The width of the pictures: 390 px, or `PICTURE_WIDTH` to see the same screens at 320 or
 * 480 px (UI-01 AC 10): `PICTURE_WIDTH=320 npx playwright test -c packages/phone/playwright.pictures.config.ts`.
 */
export const PICTURE_WIDTH = Number(process.env.PICTURE_WIDTH ?? CAPTURE_WIDTH);

/** Where the other widths go: out of the repository, beside the test results. */
const otherWidths = join(dirname(fileURLToPath(import.meta.url)), '../test-results/pictures');

/** Where the picture of `capture` goes: beside the capture at 390 px, in `test-results/pictures/<width>/` otherwise. */
export function picturePath(capture: string): string {
  if (PICTURE_WIDTH !== CAPTURE_WIDTH) return join(otherWidths, String(PICTURE_WIDTH), `${capture}.png`);
  return join(captures, `${capture}.running.png`);
}

/** Where the picture of a screen without a capture goes, for the user to judge (T42); other widths as in `picturePath`. */
export function uncapturedPath(name: string): string {
  if (PICTURE_WIDTH !== CAPTURE_WIDTH) return join(otherWidths, String(PICTURE_WIDTH), 'uncaptured', `${name}.png`);
  return join(captures, 'uncaptured', `${name}.png`);
}
