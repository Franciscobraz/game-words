import type { ComponentChildren } from 'preact';
import '../styles/chip.css';

/** Props of `Chip`. */
export interface ChipProps {
  icon: ComponentChildren;
  /** The icon's color, by meaning. */
  iconTone: 'action' | 'secondary' | 'valid' | 'plain';
  label: string;
}

/** A rounded label with an icon, as the rule chips of the join screen and the lobby. */
export function Chip({ icon, iconTone, label }: ChipProps) {
  return (
    <span class="chip">
      <span class={`chip__icon chip__icon--${iconTone}`}>{icon}</span>
      {label}
    </span>
  );
}
