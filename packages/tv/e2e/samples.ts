import type { PlayerInfo, Settings, WelcomeMessage } from '@bwords/core';

/** The sample data of the captures: room KBXT, host Ana, and the board C A S A / Qu E R O / T I N S / L U A M. */

export const SAMPLE_CODE = 'KBXT';

export const SAMPLE_SETTINGS: Settings = {
  size: 4,
  seconds: 120,
  rounds: 3,
  minLength: 3,
  filterProfanity: true,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

/** The colors the captures draw; a player can pick any of them with the custom color (JOIN-01 AC 2-3). */
const ORANGE = '#FF7A00';
const SKY = '#00C2FF';
const GREEN = '#10D078';
const PINK = '#FF4D8D';

/** A player in the shape the server sends. */
export function samplePlayer(id: string, nickname: string, color: string, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
  return { id, nickname, color, connected: true, spectator: false, score: 0, wins: 0, ...overrides };
}

export const ANA = samplePlayer('p1', 'Ana', ORANGE, { wins: 2 });
export const BETO = samplePlayer('p2', 'Beto', SKY, { wins: 1 });
export const CAIO = samplePlayer('p3', 'Caio', GREEN, { connected: false });
export const DUDA = samplePlayer('p4', 'Duda', PINK, { spectator: true });

/** The lobby of KBXT as the server describes it to the TV. */
export function lobbyWelcome(players: PlayerInfo[], hostId: string | null): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'tv',
    code: SAMPLE_CODE,
    phase: 'lobby',
    settings: SAMPLE_SETTINGS,
    players,
    hostId,
    round: null,
  };
}

/** The board of the captures. */
export const SAMPLE_BOARD: string[][] = [
  ['c', 'a', 's', 'a'],
  ['qu', 'e', 'r', 'o'],
  ['t', 'i', 'n', 's'],
  ['l', 'u', 'a', 'm'],
];

/** When the sample round starts, on the clock the tests install. */
export const SAMPLE_START = Date.UTC(2026, 9, 30, 20, 0, 0);

/** When the sample round ends: two minutes later, as `SAMPLE_SETTINGS` says. */
export const SAMPLE_END = SAMPLE_START + SAMPLE_SETTINGS.seconds * 1_000;

/** The first round of KBXT as the server describes it to a TV that connects during it. */
export function roundWelcome(players: PlayerInfo[], hostId: string | null, board: string[][] = SAMPLE_BOARD): WelcomeMessage {
  return {
    ...lobbyWelcome(players, hostId),
    phase: 'round',
    round: { id: 1, index: 0, board, startsAt: SAMPLE_START, endsAt: SAMPLE_END },
  };
}
