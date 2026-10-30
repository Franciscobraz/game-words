import type { Settings } from '@bwords/core';
import { STRINGS } from '../strings/pt-BR.ts';

/** The settings the lobby shows; volume and mute have no chip (tv-lobby.png). */
export type ChipKey = 'size' | 'seconds' | 'rounds' | 'minLength' | 'filterProfanity' | 'pack';

/** One chip of "Configurações". */
export interface SettingsChip {
  key: ChipKey;
  label: string;
}

const SECONDS_PER_MINUTE = 60;

/** The text of each chip, in the capture's order (style guide §4, O). */
const CHIP_LABELS: Record<ChipKey, (settings: Settings) => string> = {
  size: ({ size }) => STRINGS.gridChip(size),
  seconds: ({ seconds }) => STRINGS.timeChip(timeText(seconds)),
  rounds: ({ rounds }) => STRINGS.roundsChip(rounds),
  minLength: ({ minLength }) => STRINGS.minLengthChip(minLength),
  filterProfanity: ({ filterProfanity }) => (filterProfanity ? STRINGS.profanityFiltered : STRINGS.profanityAllowed),
  pack: ({ pack }) => STRINGS.packNames[pack],
};

const CHIP_KEYS = Object.keys(CHIP_LABELS) as ChipKey[];

/** The chips of the lobby, with the room's values (TVLOBBY-01 AC 8). */
export function settingsChips(settings: Settings): SettingsChip[] {
  return CHIP_KEYS.map((key) => ({ key, label: CHIP_LABELS[key](settings) }));
}

/** The chip that has to pulse after a settings change; null when no chip's setting changed (TVLOBBY-01 AC 8). */
export function changedChip(before: Settings, after: Settings): ChipKey | null {
  return CHIP_KEYS.find((key) => before[key] !== after[key]) ?? null;
}

/** "2 min" for whole minutes, as the capture draws it; "1:30" for the rest. */
function timeText(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = seconds % SECONDS_PER_MINUTE;
  return rest === 0 ? STRINGS.minutes(minutes) : `${minutes}:${String(rest).padStart(2, '0')}`;
}
