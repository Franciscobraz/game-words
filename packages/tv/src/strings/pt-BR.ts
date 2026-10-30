/**
 * Every text the TV shows, in pt-BR (TVUI-01 AC 5, AD-001). The protocol only carries
 * codes; `model/messages.ts` maps them to keys of this table. Gender-neutral forms follow AD-013.
 */
export const STRINGS = {
  brand: 'BWords',

  // Opening the room (TVROOM-01)
  roomOpenFailed: 'Não foi possível abrir a sala',

  // End of the room (TVEXIT-01)
  roomExpired: 'Sala expirada',
  roomClosed: 'A sala foi encerrada',
  openedInAnotherTab: 'A TV foi aberta em outra aba',

  // Codes the TV does not expect (style guide §8)
  unexpectedError: 'Algo deu errado',
} as const;

/** A key of the text table. */
export type StringKey = keyof typeof STRINGS;
