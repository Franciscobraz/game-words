import { type PlayerInfo, type SubmitResult } from '@bwords/core';
import { expect, type Page } from '@playwright/test';
import { wordOfPath } from '../src/model/path.ts';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { type FakeRoom, fakeRoom } from './fake-room.ts';
import { ANA, BETO, CAIO, DUDA, roundWelcome, SAMPLE_BOARD, SAMPLE_CODE, sampleHashFrame, sampleRound } from './samples.ts';

/** How a scripted round opens on the phone under test. */
export interface RoundOptions {
  /** The players of KBXT; Ana, Beto, Caio and Duda by default. */
  players?: PlayerInfo[];
  /** The phone's player; Beto by default. */
  me?: PlayerInfo;
  /** `startsAt` and `endsAt` on the page's clock. */
  startsAt: number;
  endsAt: number;
  /** Words the server already accepted from this phone, oldest first. */
  found?: string[];
}

/**
 * Opens KBXT on the phone in the middle of a round of the sample board, as a phone
 * that reconnects gets it: `welcome` with the round and the salt, then the hash
 * frame of CASA, QUERO and LUA. The scripted server accepts every path the phone sends.
 */
export async function openRound(page: Page, options: RoundOptions): Promise<FakeRoom> {
  const { players = [ANA, BETO, CAIO, DUDA], me = BETO, startsAt, endsAt, found = [] } = options;
  const frame = await sampleHashFrame();
  const room = await fakeRoom(page, (msg) => {
    if (msg.type === 'hello') return { replies: [roundWelcome(players, me.id, sampleRound(startsAt, endsAt), found), frame] };
    if (msg.type === 'submit') return { replies: [{ type: 'submit-result', results: msg.paths.map(acceptPath) }] };
    return { replies: [] };
  });
  await page.goto(`/${SAMPLE_CODE}`);
  return room;
}

function acceptPath(path: number[]): SubmitResult {
  return { ok: true, word: wordOfPath(SAMPLE_BOARD, path) };
}

/** The board of the screen. */
export function boardOf(page: Page) {
  return page.getByRole('group', { name: STRINGS.board });
}

/** The center of `tile` on the board, in page pixels. */
export async function tileCenter(page: Page, tile: number): Promise<{ x: number; y: number }> {
  const box = await boardOf(page).boundingBox();
  if (box === null) throw new Error('The board is not on screen');
  const size = SAMPLE_BOARD.length;
  const side = box.width / size;
  return { x: box.x + ((tile % size) + 0.5) * side, y: box.y + (Math.floor(tile / size) + 0.5) * side };
}

/** Presses on the first tile and slides the mouse over the others, without lifting it. */
export async function slideOver(page: Page, tiles: readonly number[]): Promise<void> {
  await expect(boardOf(page)).toBeVisible();
  const first = await tileCenter(page, tiles[0]!);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  for (const tile of tiles.slice(1)) {
    const center = await tileCenter(page, tile);
    await page.mouse.move(center.x, center.y, { steps: 4 });
  }
}

/** Swipes the tiles and lifts the finger. */
export async function swipe(page: Page, tiles: readonly number[]): Promise<void> {
  await slideOver(page, tiles);
  await page.mouse.up();
}
