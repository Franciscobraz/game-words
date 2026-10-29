import { ciede2000, type PlayerInfo } from '@bwords/core';

/** One option of the color picker (JOIN-01 AC 2-3). */
export type ColorSlot =
  /** A palette color nobody has. */
  | { kind: 'free'; color: string }
  /** The palette color of this phone's player. */
  | { kind: 'mine'; color: string }
  /** A palette color another player has; it shows the owner's nickname and cannot be picked. */
  | { kind: 'locked'; color: string; owner: string }
  /** The 11th option, "Personalizada", which opens the system color picker; `color` is this player's off-palette color. */
  | { kind: 'custom'; color: string | null };

/**
 * The color picker: the palette colors in order, each free, mine or locked with its
 * owner's nickname, then the custom slot (JOIN-01 AC 2-3). Colors match ignoring case.
 */
export function colorSlots(palette: readonly string[], players: readonly PlayerInfo[], myId: string | null): ColorSlot[] {
  const me = players.find((p) => p.id === myId) ?? null;
  const slots: ColorSlot[] = palette.map((color) => paletteSlot(color, players, me));
  const isMineOffPalette = me !== null && !palette.some((color) => sameColor(color, me.color));
  slots.push({ kind: 'custom', color: isMineOffPalette ? me.color : null });
  return slots;
}

/**
 * The nickname of the player whose color is closest to `color` (CIEDE2000), for
 * "Muito parecida com a cor de <apelido>" (JOIN-01 AC 8); null in an empty room.
 */
export function closestColorOwner(color: string, players: readonly Pick<PlayerInfo, 'nickname' | 'color'>[]): string | null {
  let closest: { nickname: string; distance: number } | null = null;
  for (const player of players) {
    const distance = ciede2000(color, player.color);
    if (closest === null || distance < closest.distance) closest = { nickname: player.nickname, distance };
  }
  return closest?.nickname ?? null;
}

/**
 * The slot that shows `color` as picked: its palette slot, or the custom slot for
 * any other color; -1 when nothing is picked (JOIN-01 AC 2, 4).
 */
export function selectedSlot(slots: readonly ColorSlot[], color: string | null): number {
  if (color === null) return -1;
  const index = slots.findIndex((slot) => slot.kind !== 'custom' && sameColor(slot.color, color));
  return index === -1 ? slots.findIndex((slot) => slot.kind === 'custom') : index;
}

function paletteSlot(color: string, players: readonly PlayerInfo[], me: PlayerInfo | null): ColorSlot {
  if (me !== null && sameColor(color, me.color)) return { kind: 'mine', color };
  const owner = players.find((p) => sameColor(p.color, color));
  return owner === undefined ? { kind: 'free', color } : { kind: 'locked', color, owner: owner.nickname };
}

function sameColor(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}
