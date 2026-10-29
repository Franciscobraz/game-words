import type { ClientMessage, ServerMessage } from '@bwords/core';
import type { Page } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * A scripted room for the pictures: the page's socket is answered by the test, so
 * a screen shows the captures' sample data (room KBXT, Ana, Beto, Caio, Duda)
 * instead of a random code and fresh players.
 */

/** What the scripted server answers to each client message; `close` drops the socket after. */
export type Script = (msg: ClientMessage) => { replies: ServerMessage[]; close?: boolean };

/** Routes the page's room socket to `script`; `time` gets the page's own clock back. */
export async function fakeRoom(page: Page, script: Script): Promise<void> {
  await page.routeWebSocket(/\/api\/rooms\/[^/]+\/ws$/, (ws) => {
    ws.onMessage((raw) => {
      const msg = JSON.parse(String(raw)) as ClientMessage;
      if (msg.type === 'time') {
        ws.send(JSON.stringify({ type: 'time', clientTime: msg.clientTime, serverTime: msg.clientTime }));
        return;
      }
      const { replies, close = false } = script(msg);
      for (const reply of replies) ws.send(JSON.stringify(reply));
      if (close) ws.close();
    });
  });
}

const captures = join(dirname(fileURLToPath(import.meta.url)), '../../../.specs/features/m3-phone/captures');

/** Where the picture of `capture` goes, beside the capture itself. */
export function picturePath(capture: string): string {
  return join(captures, `${capture}.running.png`);
}
