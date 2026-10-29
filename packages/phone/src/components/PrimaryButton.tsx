import type { ComponentChildren } from 'preact';
import '../styles/primary-button.css';

/** Props of `PrimaryButton`. */
export interface PrimaryButtonProps {
  children: ComponentChildren;
  /** Orange for moving on ("CONTINUAR"), green for entering the room ("ENTRAR"). */
  tone: 'action' | 'valid';
  type?: 'button' | 'submit';
  onPress?: () => void;
}

/** The full-width main button of a screen, at least 48 px tall (UI-01 AC 7). */
export function PrimaryButton({ children, tone, type = 'button', onPress }: PrimaryButtonProps) {
  return (
    <button type={type} class={`primary-button primary-button--${tone}`} onClick={onPress}>
      {children}
    </button>
  );
}
