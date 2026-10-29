import { PALETTE, type PlayerInfo } from '@bwords/core';
import { describe, expect, test } from 'vitest';
import { closestColorOwner, colorSlots } from './colors.ts';

/** A connected player in the lobby with `color`. */
function player(id: string, nickname: string, color: string): PlayerInfo {
  return { id, nickname, color, connected: true, spectator: false, score: 0, wins: 0 };
}

const ORANGE = PALETTE[1]!;
const GREEN = PALETTE[3]!;
const CYAN = PALETTE[4]!;

describe('colorSlots', () => {
  test('lists the ten palette colors and a custom slot', () => {
    const slots = colorSlots(PALETTE, [], null);

    expect(slots).toHaveLength(11);
    expect(slots.slice(0, 10)).toEqual(PALETTE.map((color) => ({ kind: 'free', color })));
    expect(slots[10]).toEqual({ kind: 'custom', color: null });
  });

  test("locks a color owned by another player with the owner's name", () => {
    const ana = player('p1', 'Ana', ORANGE);
    const caio = player('p3', 'Caio', GREEN.toLowerCase());

    const slots = colorSlots(PALETTE, [ana, caio], null);

    expect(slots[1]).toEqual({ kind: 'locked', color: ORANGE, owner: 'Ana' });
    expect(slots[3]).toEqual({ kind: 'locked', color: GREEN, owner: 'Caio' });
    expect(slots.filter((slot) => slot.kind === 'locked')).toHaveLength(2);
  });

  test("marks the player's own palette color as mine", () => {
    const ana = player('p1', 'Ana', ORANGE);
    const beto = player('p2', 'Beto', CYAN);

    const slots = colorSlots(PALETTE, [ana, beto], 'p2');

    expect(slots[4]).toEqual({ kind: 'mine', color: CYAN });
    expect(slots[1]).toEqual({ kind: 'locked', color: ORANGE, owner: 'Ana' });
    expect(slots[10]).toEqual({ kind: 'custom', color: null });
  });

  test("puts the player's off-palette color in the custom slot", () => {
    const beto = player('p2', 'Beto', '#00C1FD');

    const slots = colorSlots(PALETTE, [beto], 'p2');

    expect(slots[10]).toEqual({ kind: 'custom', color: '#00C1FD' });
    expect(slots.slice(0, 10).every((slot) => slot.kind === 'free')).toBe(true);
  });

  test("leaves another player's off-palette color out of the slots", () => {
    const duda = player('p4', 'Duda', '#FF4D8D');

    const slots = colorSlots(PALETTE, [duda], null);

    expect(slots.slice(0, 10).every((slot) => slot.kind === 'free')).toBe(true);
    expect(slots[10]).toEqual({ kind: 'custom', color: null });
  });
});

describe('closestColorOwner', () => {
  test('names the player whose color is closest', () => {
    const players = [player('p1', 'Ana', ORANGE), player('p3', 'Caio', GREEN), player('p4', 'Duda', CYAN)];

    expect(closestColorOwner('#FA8E05', players)).toBe('Ana');
    expect(closestColorOwner('#45A049', players)).toBe('Caio');
  });

  test('has nobody to name in an empty room', () => {
    expect(closestColorOwner('#FA8E05', [])).toBeNull();
  });
});
