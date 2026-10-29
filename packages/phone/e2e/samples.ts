import {
  encodeHashFrame,
  hashPrefixes,
  PALETTE,
  type PlayerInfo,
  type RoundInfo,
  type RoundStartMessage,
  type Settings,
  type WelcomeMessage,
} from '@bwords/core';

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

/** The board of the captures: C A S A / Qu E R O / T I N S / L U A M. */
export const SAMPLE_BOARD: string[][] = [
  ['c', 'a', 's', 'a'],
  ['qu', 'e', 'r', 'o'],
  ['t', 'i', 'n', 's'],
  ['l', 'u', 'a', 'm'],
];

/** Words of the sample board the scripted round accepts, with the tiles that spell them (row-major). */
export const SAMPLE_WORDS = {
  casa: [0, 1, 2, 3],
  quero: [4, 5, 6, 7],
  lua: [12, 13, 14],
} as const;

/** The scripted round's salt; any fixed bytes do. */
const SAMPLE_SALT = Uint8Array.from({ length: 16 }, (_, i) => i + 1);

/** The id of the scripted round, carried by its hash frame. */
export const SAMPLE_ROUND_ID = 7;

/** A round of the sample board opening at `startsAt` and closing at `endsAt` on the page's clock. */
export function sampleRound(startsAt: number, endsAt: number, index = 0): RoundInfo {
  return { id: SAMPLE_ROUND_ID, index, board: SAMPLE_BOARD, startsAt, endsAt };
}

/** The `round-start` of `round`, with the salt a phone gets. */
export function roundStartOf(round: RoundInfo): RoundStartMessage {
  return { type: 'round-start', ...round, salt: Buffer.from(SAMPLE_SALT).toString('base64url') };
}

/** The phase `round` of KBXT as the server describes it to `playerId`, with the words it already found. */
export function roundWelcome(players: PlayerInfo[], playerId: string, round: RoundInfo, found: string[] = []): WelcomeMessage {
  return {
    type: 'welcome',
    role: 'player',
    code: SAMPLE_CODE,
    phase: 'round',
    settings: { ...SAMPLE_SETTINGS, rounds: 3 },
    players,
    hostId: ANA.id,
    round,
    playerId,
    found,
    salt: Buffer.from(SAMPLE_SALT).toString('base64url'),
  };
}

/** The binary hash frame of the scripted round: the salted prefixes of the sample words. */
export async function sampleHashFrame(): Promise<ArrayBuffer> {
  return encodeHashFrame(SAMPLE_ROUND_ID, await hashPrefixes(SAMPLE_SALT, Object.keys(SAMPLE_WORDS)));
}
