import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Board, boardSolutions, findPath, LanguagePack, type PackMeta, wordPoints } from '@bwords/core';
import { expect, type Page, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { openPhones } from './phones.ts';
import { boardOf, swipe } from './round-room.ts';
import { createRoom, type TvRoom } from './tv.ts';

/**
 * The words of each board come from the same pt-BR pack `wrangler dev` serves, read
 * here only by the test (the phone never gets it, PROTO-01 AC 8). Run
 * `npm run dict:build` once before the E2E.
 */
const PACK_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../tools/dict-build/dist/pt-BR');

function loadPack(): LanguagePack {
  const file = (name: string) => {
    const bytes = readFileSync(join(PACK_DIR, name));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  };
  return LanguagePack.fromBuffers({
    dict: file('dict.bin'),
    common: file('common.bin'),
    profanity: file('profanity.bin'),
    spellings: file('spellings.bin'),
    meta: JSON.parse(readFileSync(join(PACK_DIR, 'meta.json'), 'utf8')) as PackMeta,
  });
}

/** The board of round `index`, as the TV got it. */
async function boardOfRound(tv: TvRoom, index: number): Promise<Board> {
  await expect.poll(() => tv.messages().filter((msg) => msg.type === 'round-start').length, { timeout: 15_000 }).toBeGreaterThan(index);
  const start = tv.messages().filter((msg) => msg.type === 'round-start')[index];
  if (start?.type !== 'round-start') throw new Error(`No round ${index}`);
  return start.board;
}

/** Three words of the board for the round's plays, the longest first, with their paths. */
function threeWords(board: Board, pack: LanguagePack): { word: string; path: number[] }[] {
  const { words } = boardSolutions(board, pack, { minLength: 3, filterProfanity: true });
  const sorted = [...words].sort((a, b) => b.length - a.length || a.localeCompare(b));
  const picked = sorted.slice(0, 3).map((word) => ({ word, path: findPath(board, word) }));
  if (picked.length < 3) throw new Error(`The board has only ${picked.length} words`);
  return picked.map(({ word, path }) => {
    if (path === null) throw new Error(`No path for ${word}`);
    return { word, path };
  });
}

/** Swipes `word` and waits for "VÁLIDA (+N PTS)". */
async function play(page: Page, entry: { word: string; path: number[] }): Promise<void> {
  await swipe(page, entry.path);
  await expect(page.getByRole('status')).toHaveText(STRINGS.validWord(wordPoints(entry.word)));
}

test('plays a two-round match with three phones until play again', async ({ browser }) => {
  // Success Criteria (PLAY-01, RES-01, POD-01): a TV and three phones. Ana hosts and sets 2 rounds of 30 s;
  // in each round Ana finds two words, Beto one of hers and Caio another; the first round ends in the results, with
  // "PRÓXIMA RODADA" for the host; the last one opens the podium with no tap (PHONE-01 AC 1), where Ana's "SEU RENDIMENTO" counts the 4 words she sent, and
  // "JOGAR DE NOVO" takes the three phones to the countdown of a new match.
  test.setTimeout(240_000);
  const pack = loadPack();
  const tv = await createRoom();
  const [ana, beto, caio] = await openPhones(browser, tv.code, ['Ana', 'Beto', 'Caio']);
  if (ana === undefined || beto === undefined || caio === undefined) throw new Error('Three phones expected');
  const phones = [ana.page, beto.page, caio.page];

  await expect(ana.page.getByText(STRINGS.youAreHost)).toBeVisible();
  await ana.page.getByRole('button', { name: STRINGS.increase(STRINGS.rounds) }).click();
  await expect(ana.page.getByLabel(STRINGS.rounds, { exact: true })).toHaveText('2');
  for (const seconds of ['1:30', '1:00', '0:30']) {
    await ana.page.getByRole('button', { name: STRINGS.decrease(STRINGS.roundTime) }).click();
    await expect(ana.page.getByLabel(STRINGS.roundTime, { exact: true })).toHaveText(seconds);
  }
  await ana.page.getByRole('button', { name: STRINGS.startMatch }).click();

  for (const round of [0, 1]) {
    const board = await boardOfRound(tv, round);
    const [longest, second, third] = threeWords(board, pack);
    if (longest === undefined || second === undefined || third === undefined) throw new Error('Three words expected');
    for (const page of phones) await expect(boardOf(page)).toBeVisible({ timeout: 10_000 });

    await play(ana.page, longest);
    await play(ana.page, second);
    await play(beto.page, second);
    await play(caio.page, third);
    await expect(ana.page.getByText(STRINGS.roundTally(2, wordPoints(longest.word) + wordPoints(second.word)))).toBeVisible();

    if (round === 1) break;
    const advance = STRINGS.nextRound(2, 2);
    await expect(ana.page.getByRole('button', { name: advance })).toBeVisible({ timeout: 45_000 });
    for (const page of [beto.page, caio.page]) await expect(page.getByText(STRINGS.waitingForHostToAdvance('Ana'))).toBeVisible();
    await ana.page.getByRole('button', { name: advance }).click();
  }

  await expect(ana.page.getByRole('button', { name: STRINGS.playAgain })).toBeVisible({ timeout: 45_000 });
  await expect(ana.page.getByRole('region', { name: STRINGS.yourPerformance }).locator('.match-performance__count')).toHaveText('4');
  await expect(beto.page.getByRole('region', { name: STRINGS.yourPerformance }).locator('.match-performance__count')).toHaveText('2');
  await expect(caio.page.getByRole('region', { name: STRINGS.yourPerformance }).locator('.match-performance__count')).toHaveText('2');
  await expect(ana.page.getByRole('heading', { name: STRINGS.yourFinalPlace(1) })).toBeVisible();

  await ana.page.getByRole('button', { name: STRINGS.playAgain }).click();
  for (const page of phones) await expect(page.getByText(STRINGS.getReady)).toBeVisible();

  for (const phone of [ana, beto, caio]) await phone.close();
  tv.close();
});
