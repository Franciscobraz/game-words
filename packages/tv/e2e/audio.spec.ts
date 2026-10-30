import { expect, type Page, test } from '@playwright/test';
import { fakeRoom } from './fake-room.ts';
import { recordSounds, type StartedSound } from './record-sounds.ts';
import { ANA, BETO, lobbyWelcome, roundWelcome, SAMPLE_END, SAMPLE_SETTINGS, SAMPLE_START, sampleResults } from './samples.ts';

/** A screen reads the clock this often, so a change shows up to this late (`SERVER_CLOCK_TICK_MS`). */
const TICK_MS = 150;

/** "Tempo!" comes before the words (TVPLAY-01 AC 10). */
const TIME_UP_MS = 2_000;

const sounds = (page: Page) => page.evaluate(() => (window as unknown as { sounds: StartedSound[] }).sounds);

/** The sounds that reach the speakers: the whistle's vibrato has a gain of its own and is not one of them. */
const heard = async (page: Page) => (await sounds(page)).filter((sound) => sound.peakGain > 0 && sound.frequencyHz > 100);

/** Opens the TV with the clock stopped at `at`, a second after the clock was installed, since it cannot pause in its past. */
async function stopClockAt(page: Page, at: number) {
  await page.clock.install({ time: at - 1_000 });
  await page.clock.pauseAt(at);
}

test('plays the cues of a round, each once', async ({ page }) => {
  // TVAUDIO-01 AC 1, 6: start, 10 s left, the whistle and the scroll.
  await recordSounds(page, 'running');
  await stopClockAt(page, SAMPLE_START - 500);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('countdown-number')).toHaveText('1');
  expect(await heard(page)).toHaveLength(0);

  await page.clock.runFor(500 + TICK_MS);
  await expect(page.getByTestId('round-screen')).toBeVisible();
  await expect.poll(async () => (await heard(page)).length).toBe(1);

  await page.clock.fastForward(SAMPLE_SETTINGS.seconds * 1_000 - 10_000 - 500);
  await page.clock.runFor(1_000);
  await expect.poll(async () => (await heard(page)).length).toBe(2);

  await page.clock.fastForward(8_000);
  await page.clock.runFor(1_500);
  await expect(page.getByTestId('time-up')).toBeVisible();
  await expect.poll(async () => (await heard(page)).length).toBe(3);
  const whistle = (await heard(page))[2]!;
  expect(whistle.frequencyHz).toBeGreaterThanOrEqual(2_000);

  room.push(sampleResults());
  await page.clock.runFor(TIME_UP_MS + TICK_MS);
  await expect(page.getByTestId('words-screen')).toBeVisible();
  await expect.poll(async () => (await heard(page)).length).toBe(4);

  await page.clock.runFor(1_000);
  expect(await heard(page)).toHaveLength(4);
});

test('plays in the volume of the room, and nothing when it is muted', async ({ page }) => {
  // TVAUDIO-01 AC 2: the host changes the room during the countdown.
  await recordSounds(page, 'running');
  await stopClockAt(page, SAMPLE_START - 500);
  const room = await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('countdown-number')).toHaveText('1');

  await page.clock.runFor(500 + TICK_MS);
  await expect.poll(async () => (await heard(page)).length).toBe(1);
  const atSampleVolume = (await heard(page))[0]!.peakGain;

  room.push({ type: 'settings', settings: { ...SAMPLE_SETTINGS, volume: SAMPLE_SETTINGS.volume / 2 } });
  await page.clock.fastForward(SAMPLE_SETTINGS.seconds * 1_000 - 10_000 - 500);
  await page.clock.runFor(1_000);
  await expect.poll(async () => (await heard(page)).length).toBe(2);
  expect((await heard(page))[1]!.peakGain).toBeCloseTo(atSampleVolume / 2);

  room.push({ type: 'settings', settings: { ...SAMPLE_SETTINGS, muted: true } });
  await page.clock.fastForward(8_000);
  await page.clock.runFor(1_500);
  await expect(page.getByTestId('time-up')).toBeVisible();
  expect(await heard(page)).toHaveLength(2);
});

test('a reload in the middle of the round replays no cue', async ({ page }) => {
  await recordSounds(page, 'running');
  await stopClockAt(page, SAMPLE_START + 30_000);
  await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('round-screen')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('round-screen')).toBeVisible();
  await page.clock.runFor(1_000);

  expect(await heard(page)).toHaveLength(0);
});

test('plays nothing while the browser blocks the sound', async ({ page }) => {
  // A blocked context keeps its time still: a sound scheduled now would come out at the unlock.
  await recordSounds(page, 'suspended');
  await stopClockAt(page, SAMPLE_START - 500);
  await fakeRoom(page, roundWelcome([ANA, BETO], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('countdown-number')).toHaveText('1');

  await page.clock.runFor(500 + TICK_MS);
  await expect(page.getByTestId('round-screen')).toBeVisible();

  expect(await sounds(page)).toHaveLength(0);
  await expect(page.getByTestId('audio-notice')).toHaveCount(0);
});

test('unlocks with a click', async ({ page }) => {
  // TVAUDIO-01 AC 4.
  await recordSounds(page, 'suspended');
  await fakeRoom(page, lobbyWelcome([ANA], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('audio-notice')).toBeVisible();

  await page.getByTestId('lobby-screen').click();

  await expect(page.getByTestId('audio-notice')).toHaveCount(0);
});

test('works with no sound and no notice without web audio', async ({ page }) => {
  // TVAUDIO-01 AC 5.
  await page.addInitScript(() => {
    delete (window as unknown as { AudioContext?: unknown }).AudioContext;
  });
  await stopClockAt(page, SAMPLE_END - 1_000);
  const room = await fakeRoom(page, lobbyWelcome([ANA], ANA.id));
  await page.goto('/');
  await expect(page.getByTestId('lobby-screen')).toBeVisible();
  await expect(page.getByTestId('audio-notice')).toHaveCount(0);

  room.push(roundWelcome([ANA], ANA.id));
  await page.keyboard.press('Enter');

  await expect(page.getByTestId('round-screen')).toBeVisible();
});
