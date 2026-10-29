import type { ComponentChildren } from 'preact';
import '../styles/sheet.css';

/** Props of `Sheet`. */
export interface SheetProps {
  /** The sheet's name, read by screen readers. */
  label: string;
  children: ComponentChildren;
  /** A tap on the dimmed screen behind the sheet. */
  onClose: () => void;
}

/** A panel that rises from the bottom over a dimmed screen (HOST-01 AC 10, PREF-01 AC 1). */
export function Sheet({ label, children, onClose }: SheetProps) {
  return (
    <div class="sheet">
      <div class="sheet__backdrop" aria-hidden="true" onClick={onClose} />
      <section class="sheet__panel" role="dialog" aria-modal="true" aria-label={label}>
        <span class="sheet__handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  );
}

/** Props of `SheetAction`. */
export interface SheetActionProps {
  children: ComponentChildren;
  /** `danger` for an action that removes something, as "Remover da sala". */
  tone: 'plain' | 'danger' | 'quiet';
  onPress: () => void;
}

/** A full-width button of a sheet or a confirmation, at least 48 px tall (UI-01 AC 7). */
export function SheetAction({ children, tone, onPress }: SheetActionProps) {
  return (
    <button type="button" class={`sheet-action sheet-action--${tone}`} onClick={onPress}>
      {children}
    </button>
  );
}
