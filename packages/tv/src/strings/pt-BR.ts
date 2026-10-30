/**
 * Every text the TV shows, in pt-BR (TVUI-01 AC 5, AD-001). The protocol only carries
 * codes; `model/messages.ts` maps them to keys of this table. Gender-neutral forms follow AD-013.
 */
export const STRINGS = {
  brand: 'BWords',
  brandMark: 'B',
  roomQr: 'QR code da sala',

  // Opening the room (TVROOM-01)
  roomOpenFailed: 'Não foi possível abrir a sala',

  // Players, in every screen (AD-013)
  hostTag: 'ANFITRIÃO(Ã)',
  disconnectedTag: 'DESCONECTADO',
  spectatorTag: 'ESPECTADOR(A)',
  crown: 'Mais vitórias',

  // Lobby (TVLOBBY-01)
  roomLabel: 'SALA',
  joinByPhone: 'Entre pelo celular',
  orVisit: 'ou acesse',
  andTypeCode: 'e digite o código',
  players: 'Jogadores',
  nobodyYet: 'Ninguém entrou ainda',
  freeSlot: (place: number) => `Vaga Livre #${place}`,
  settings: 'CONFIGURAÇÕES',
  winsCount: (wins: number) => (wins === 1 ? '1 vitória' : `${wins} vitórias`),
  playerCount: (count: number, max: number) => `${count} / ${max}`,
  firstJoinerHosts: 'O primeiro a entrar vira anfitrião(ã)',
  waitingForHost: (nickname: string) => `Aguardando ${nickname} iniciar a partida…`,

  // Settings chips (TVLOBBY-01 AC 8)
  gridChip: (size: number) => `Grade ${size}x${size}`,
  timeChip: (time: string) => `Tempo ${time}`,
  minutes: (minutes: number) => `${minutes} min`,
  roundsChip: (rounds: number) => (rounds === 1 ? '1 rodada' : `${rounds} rodadas`),
  minLengthChip: (letters: number) => `Mín. ${letters} letras`,
  profanityFiltered: 'Palavrões filtrados',
  profanityAllowed: 'Palavrões liberados',
  packNames: { 'pt-BR': 'Português (BR)' },

  // Countdown and round (TVPLAY-01)
  roundOf: (round: number, rounds: number) => `RODADA ${round} DE ${rounds}`,
  wordsLabel: (count: number) => (count === 1 ? 'palavra' : 'palavras'),
  roomCodeLabel: 'CÓDIGO DA SALA',
  board: 'Tabuleiro da rodada',
  timeUp: 'Tempo!',

  // End of the room (TVEXIT-01)
  roomExpired: 'Sala expirada',
  roomClosed: 'A sala foi encerrada',
  openedInAnotherTab: 'A TV foi aberta em outra aba',

  // Codes the TV does not expect (style guide §8)
  unexpectedError: 'Algo deu errado',
} as const;

/** A key of the text table. */
export type StringKey = keyof typeof STRINGS;
