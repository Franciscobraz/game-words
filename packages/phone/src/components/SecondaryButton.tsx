import type { ComponentChildren } from 'preact';
import '../styles/secondary-button.css';

/** Props of `SecondaryButton`. */
export interface SecondaryButtonProps {
  children: ComponentChildren;
  onPress: () => void;
}

/** The full-width quiet button under the main one, as "Voltar ao Lobby", at least 48 px tall (UI-01 AC 7). */
export function SecondaryButton({ children, onPress }: SecondaryButtonProps) {
  return (
    <button type="button" class="secondary-button" onClick={onPress}>
      {children}
    </button>
  );
}
