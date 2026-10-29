import type { CloseReason, PlayerInfo } from '@bwords/core';
import { expect, type Page } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';
import { fakeRoom } from './fake-room.ts';
import { boardOf, openRound } from './round-room.ts';
import {
  ANA,
  ANA_FOUND,
  BETO,
  CAIO,
  DUDA,
  lobbyWelcome,
  PODIUM_PLAYERS,
  resultsWelcome,
  SAMPLE_CODE,
  SAMPLE_PODIUM,
  sampleResults,
  SCORED_PLAYERS,
} from './samples.ts';

/**
 * Every screen and state of the phone, opened on the scripted room with the
 * captures' sample data, for the layout checks and the pictures (UI-01, T40, T42).
 */
export interface ScreenState {
  name: string;
  /** Whether the state is a room screen with the common top bar (UI-01 AC 6). */
  topBar: 'participant' | 'host' | 'none';
  open(page: Page): Promise<void>;
}

const EVERYONE = [ANA, BETO, CAIO, DUDA];

/** One minute and 47 seconds left, as in the captures. */
const REMAINING_MS = 107_000;

async function openLobby(page: Page, me: PlayerInfo | null): Promise<void> {
  const players = me === null ? [ANA, CAIO, DUDA] : EVERYONE;
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [lobbyWelcome(players, me?.id ?? null)] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
}

async function openResults(page: Page, me: PlayerInfo, found: string[]): Promise<void> {
  await fakeRoom(page, (msg) => ({ replies: msg.type === 'hello' ? [resultsWelcome(SCORED_PLAYERS, me.id, found), sampleResults()] : [] }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByText(STRINGS.lookAtTv)).toBeVisible();
}

async function openPodium(page: Page, me: PlayerInfo, found: string[]): Promise<void> {
  await fakeRoom(page, (msg) => ({
    replies:
      msg.type === 'hello'
        ? [
            resultsWelcome(SCORED_PLAYERS, me.id, found, 2),
            sampleResults(2, true),
            { type: 'players', players: PODIUM_PLAYERS, hostId: ANA.id },
            SAMPLE_PODIUM,
          ]
        : [],
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByRole('region', { name: STRINGS.tableRanking })).toBeVisible();
}

async function openClosed(page: Page, reason: CloseReason): Promise<void> {
  await fakeRoom(page, (msg) => ({
    replies: msg.type === 'hello' ? [lobbyWelcome(EVERYONE, BETO.id), { type: 'closed', reason }] : [],
    close: msg.type === 'hello',
  }));
  await page.goto(`/${SAMPLE_CODE}`);
  await expect(page.getByRole('heading')).toBeVisible();
}

/** A round open on the page's clock, `found` already accepted. */
async function openBoard(page: Page, me: PlayerInfo, found: string[] = []): Promise<void> {
  const now = Date.now();
  await openRound(page, { me, startsAt: now - 13_000, endsAt: now + REMAINING_MS, found });
  await expect(boardOf(page)).toBeVisible();
}

export const SCREEN_STATES: readonly ScreenState[] = [
  {
    name: 'code entry',
    topBar: 'none',
    open: async (page) => {
      await page.goto('/');
      await expect(page.getByLabel(STRINGS.codeLetter(1))).toBeVisible();
    },
  },
  {
    name: 'join',
    topBar: 'none',
    open: async (page) => {
      await openLobby(page, null);
      await expect(page.getByLabel(STRINGS.nicknameLabel)).toBeVisible();
    },
  },
  {
    name: 'lobby',
    topBar: 'participant',
    open: async (page) => {
      await openLobby(page, BETO);
      await expect(page.getByText(STRINGS.playersInRoom(4))).toBeVisible();
    },
  },
  {
    name: 'host lobby',
    topBar: 'host',
    open: async (page) => {
      await openLobby(page, ANA);
      await expect(page.getByText(STRINGS.youAreHost)).toBeVisible();
    },
  },
  {
    name: 'host actions sheet',
    topBar: 'host',
    open: async (page) => {
      await openLobby(page, ANA);
      await page.getByRole('button', { name: STRINGS.playerActions('Beto') }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    },
  },
  {
    name: 'preferences sheet',
    topBar: 'participant',
    open: async (page) => {
      await openLobby(page, BETO);
      await page.getByRole('button', { name: STRINGS.preferences }).click();
      await expect(page.getByRole('dialog', { name: STRINGS.preferences })).toBeVisible();
    },
  },
  {
    name: 'countdown',
    topBar: 'host',
    open: async (page) => {
      const now = Date.now();
      await openRound(page, { me: ANA, startsAt: now + 60_000, endsAt: now + 180_000 });
      await expect(page.getByText(STRINGS.getReady)).toBeVisible();
    },
  },
  {
    name: 'board',
    topBar: 'participant',
    open: (page) => openBoard(page, BETO, ['sino', 'mar', 'lua', 'quero', 'casa']),
  },
  {
    name: 'board of the host',
    topBar: 'host',
    open: (page) => openBoard(page, ANA),
  },
  {
    name: 'time up',
    topBar: 'participant',
    open: async (page) => {
      const now = Date.now();
      await openRound(page, { startsAt: now - 120_000, endsAt: now - 1_000, found: ['lua'] });
      await expect(page.getByRole('alert')).toHaveText(STRINGS.timeUp);
    },
  },
  {
    name: 'spectator',
    topBar: 'participant',
    open: async (page) => {
      const now = Date.now();
      await openRound(page, { me: DUDA, startsAt: now - 13_000, endsAt: now + REMAINING_MS });
      await expect(page.getByText(STRINGS.joinsNextRound)).toBeVisible();
    },
  },
  {
    name: 'round result of the host',
    topBar: 'host',
    open: (page) => openResults(page, ANA, ANA_FOUND),
  },
  {
    name: 'round result of a participant',
    topBar: 'participant',
    open: (page) => openResults(page, BETO, ['casa', 'quero', 'lua']),
  },
  {
    name: 'round result of a spectator',
    topBar: 'participant',
    open: (page) => openResults(page, DUDA, []),
  },
  {
    name: 'podium of the host',
    topBar: 'host',
    open: (page) => openPodium(page, ANA, ANA_FOUND),
  },
  {
    name: 'podium of a participant',
    topBar: 'participant',
    open: (page) => openPodium(page, BETO, ['casa', 'quero', 'lua']),
  },
  {
    name: 'podium of a spectator',
    topBar: 'participant',
    open: (page) => openPodium(page, DUDA, []),
  },
  { name: 'kicked', topBar: 'none', open: (page) => openClosed(page, 'kicked') },
  { name: 'room closed by the host', topBar: 'none', open: (page) => openClosed(page, 'closed-by-host') },
  { name: 'room closed for inactivity', topBar: 'none', open: (page) => openClosed(page, 'idle') },
  { name: 'opened in another tab', topBar: 'none', open: (page) => openClosed(page, 'replaced') },
];
