import { PALETTE, type PlayerInfo, type Settings, type WelcomeMessage } from '@bwords/core';

/** The sample data of the captures: room KBXT, host Ana, Beto on the phone, Caio and Duda. */

export const SAMPLE_CODE = 'KBXT';

export const SAMPLE_SETTINGS: Settings = {
  size: 4,
  seconds: 120,
  rounds: 3,
  minLength: 3,
  filterProfanity: true,
  fastMode: false,
  pack: 'pt-BR',
  volume: 80,
  muted: false,
};

export const ANA: PlayerInfo = { id: 'p1', nickname: 'Ana', color: PALETTE[1]!, connected: true, spectator: false, score: 0, wins: 2 };
export const BETO: PlayerInfo = { id: 'p2', nickname: 'Beto', color: PALETTE[4]!, connected: true, spectator: false, score: 0, wins: 1 };
export const CAIO: PlayerInfo = { id: 'p3', nickname: 'Caio', color: PALETTE[3]!, connected: false, spectator: false, score: 0, wins: 0 };
export const DUDA: PlayerInfo = { id: 'p4', nickname: 'Duda', color: PALETTE[7]!, connected: true, spectator: true, score: 0, wins: 0 };

/** The lobby of KBXT as the server describes it to a phone; `playerId` null is the join screen. */
export function lobbyWelcome(players: PlayerInfo[], playerId: string | null): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'player',
    code: SAMPLE_CODE,
    phase: 'lobby',
    settings: SAMPLE_SETTINGS,
    players,
    hostId: ANA.id,
    round: null,
    playerId,
    found: [],
    salt: null,
  };
}
