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
function samplePlayer(id: string, nickname: string, color: string, overrides: Partial<PlayerInfo> = {}): PlayerInfo {
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
