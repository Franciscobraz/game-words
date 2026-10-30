import type { ComponentChildren } from 'preact';
import type { ChipKey, SettingsChip } from '../model/settings-chips.ts';
import '../styles/settings-chip-list.css';
import { GlobeIcon, GridIcon, RepeatIcon, ShieldIcon, TextSizeIcon, TimerIcon } from './icons.tsx';

/** Which chip pulses; a new `id` pulses it again. */
export interface ChipPulse {
  chip: ChipKey;
  id: number;
}

/** Props of `SettingsChipList`. */
export interface SettingsChipListProps {
  chips: readonly SettingsChip[];
  pulse: ChipPulse | null;
}

/** The icon of each chip (tv-lobby.png). */
const CHIP_ICONS: Record<ChipKey, ComponentChildren> = {
  size: <GridIcon />,
  seconds: <TimerIcon />,
  rounds: <RepeatIcon />,
  minLength: <TextSizeIcon />,
  filterProfanity: <ShieldIcon />,
  pack: <GlobeIcon />,
};

/** The room's settings as chips; the one the host just changed pulses once (TVLOBBY-01 AC 8). */
export function SettingsChipList({ chips, pulse }: SettingsChipListProps) {
  return (
    <div class="settings-chips">
      {chips.map(({ key, label }) => {
        const isPulsing = pulse?.chip === key;
        return (
          // A new element restarts the animation when the same chip changes again.
          <span
            key={isPulsing ? `${key}-${pulse.id}` : key}
            class={isPulsing ? 'settings-chip settings-chip--pulse' : 'settings-chip'}
            data-testid={`chip-${key}`}
          >
            <span class={`settings-chip__icon settings-chip__icon--${key}`}>{CHIP_ICONS[key]}</span>
            {label}
          </span>
        );
      })}
    </div>
  );
}
