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

  // Lobby (TVLOBBY-01)
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

  // End of the room (TVEXIT-01)
  roomExpired: 'Sala expirada',
  roomClosed: 'A sala foi encerrada',
  openedInAnotherTab: 'A TV foi aberta em outra aba',

  // Codes the TV does not expect (style guide §8)
  unexpectedError: 'Algo deu errado',
} as const;

/** A key of the text table. */
export type StringKey = keyof typeof STRINGS;
