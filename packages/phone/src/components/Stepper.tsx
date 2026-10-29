import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/stepper.css';
import { AddIcon, RemoveIcon } from './icons.tsx';

/** Props of `Stepper`. */
export interface StepperProps {
  /** The setting's name, shown beside the stepper and read in the buttons' labels. */
  label: string;
  /** The value as shown ("2:00", "3"). */
  display: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
}

/** A labeled "− value +" row; a button with nowhere to go is disabled (HOST-01 AC 3-5). */
export function Stepper({ label, display, canDecrease, canIncrease, onDecrease, onIncrease }: StepperProps) {
  return (
    <div class="stepper">
      <span class="stepper__label">{label}</span>
      <div class="stepper__control">
        <button type="button" class="stepper__button" aria-label={STRINGS.decrease(label)} disabled={!canDecrease} onClick={onDecrease}>
          <RemoveIcon />
        </button>
        <output class="stepper__value" aria-label={label}>
          {display}
        </output>
        <button type="button" class="stepper__button" aria-label={STRINGS.increase(label)} disabled={!canIncrease} onClick={onIncrease}>
          <AddIcon />
        </button>
      </div>
    </div>
  );
}
