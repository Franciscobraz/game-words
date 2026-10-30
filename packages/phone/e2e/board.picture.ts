import { expect, test } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { picturePath, PICTURE_WIDTH } from './fake-room.ts';
import { boardOf, openRound, slideOver, swipe } from './round-room.ts';
import { SAMPLE_WORDS } from './samples.ts';

/** The page's clock, installed and stopped: the feedback stays on screen while the picture is taken. */
const NOW = Date.UTC(2026, 9, 29, 12, 0, 0);

/** 1 min 47 s left, as in the capture. */
const REMAINING_MS = 107_000;

test('phone-board', async ({ page }) => {
  // The capture's state: Beto's phone in round 1 of 3, CASA just judged valid and swiped again, so the
  // path is lit while "VÁLIDA (+2 PTS)" still shows; QUERO, LUA and two more words found before.
  await page.clock.install({ time: NOW });
  await openRound(page, { startsAt: NOW - 13_000, endsAt: NOW + REMAINING_MS, found: ['sino', 'mar', 'lua', 'quero'] });
  await expect(boardOf(page)).toBeVisible();
  await page.clock.runFor(200);

  await swipe(page, SAMPLE_WORDS.casa);
  await expect(page.getByRole('status')).toHaveText(STRINGS.validWord(2));
  await slideOver(page, SAMPLE_WORDS.casa);

  await page.screenshot({ path: picturePath('phone-board'), animations: 'disabled' });
  await page.mouse.up();
});

test('phone-feedbacks', async ({ page, browser }) => {
  // The capture is a sheet of the four verdicts; on the phone they show one at a time above the board
  // (spec, Differences from the source). Each verdict's card is shot on the running app, then the four
  // shots are stacked in the capture's order on a page of the capture's width.
  await page.clock.install({ time: NOW });
  await openRound(page, { startsAt: NOW - 13_000, endsAt: NOW + REMAINING_MS });
  await expect(boardOf(page)).toBeVisible();
  await page.clock.runFor(200);

  const verdicts = [
    { tiles: SAMPLE_WORDS.casa, text: STRINGS.validWord(2) },
    { tiles: [0, 5, 6], text: STRINGS.invalidWord },
    { tiles: SAMPLE_WORDS.casa, text: STRINGS.alreadyFound },
    { tiles: [0, 1], text: STRINGS.tooShort },
  ];
  const shots: string[] = [];
  for (const { tiles, text } of verdicts) {
    await swipe(page, tiles);
    await expect(page.getByRole('status')).toHaveText(text);
    const card = page.locator('.word-rack');
    shots.push((await card.screenshot({ animations: 'disabled' })).toString('base64'));
    // The feedback leaves after 0.5 s (PLAY-01 AC 11).
    await page.clock.runFor(600);
    await expect(page.getByRole('status')).toHaveCount(0);
  }

  const sheet = await browser.newPage({ viewport: { width: PICTURE_WIDTH, height: 884 }, deviceScaleFactor: 2 });
  const cards = await page.locator('.word-rack').boundingBox();
  const width = cards?.width ?? 350;
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await sheet.setContent(sheetHtml(shots, width, background));
  await sheet.screenshot({ path: picturePath('phone-feedbacks') });
  await sheet.close();
});

/** The four card shots stacked at their own CSS width, on the app's background color. */
function sheetHtml(shots: readonly string[], width: number, background: string): string {
  const images = shots
    .map((shot) => `<img src="data:image/png;base64,${shot}" style="display:block;width:${width}px;margin:0 auto 24px">`)
    .join('');
  return `<body style="margin:0;padding:40px 0;background:${background}">${images}</body>`;
}
