import type { ComponentChildren } from 'preact';
import '../styles/toggle.css';

/** Props of `Toggle`. */
export interface ToggleProps {
  label: string;
  icon: ComponentChildren;
  /** The icon's tint, by meaning. */
  iconTone: 'valid' | 'secondary';
  checked: boolean;
  onToggle: () => void;
}

/** An on/off switch with its icon and label, as "Filtrar palavrões" (HOST-01 AC 7). */
export function Toggle({ label, icon, iconTone, checked, onToggle }: ToggleProps) {
  return (
    <div class="toggle">
      <div class="toggle__row">
        <span class={`toggle__icon toggle__icon--${iconTone}`}>{icon}</span>
        <span class="toggle__label">{label}</span>
        <button
          type="button"
          role="switch"
          class={`toggle__switch${checked ? ' toggle__switch--on' : ''}`}
          aria-checked={checked}
          aria-label={label}
          onClick={onToggle}
        >
          <span class="toggle__knob" />
        </button>
      </div>
    </div>
  );
}
