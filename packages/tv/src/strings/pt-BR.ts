/**
 * Every text the TV shows, in pt-BR (TVUI-01 AC 5, AD-001). The protocol only carries
 * codes; `model/messages.ts` maps them to keys of this table. Gender-neutral forms follow AD-013.
 */
export const STRINGS = {
  brand: 'BWords',
} as const;

/** A key of the text table. */
export type StringKey = keyof typeof STRINGS;
