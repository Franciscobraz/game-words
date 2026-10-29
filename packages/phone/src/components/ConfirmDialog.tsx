import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/sheet.css';
import { SheetAction } from './Sheet.tsx';

/** Props of `ConfirmDialog`. */
export interface ConfirmDialogProps {
  /** The question, as "Remover Beto? Ele perde os pontos.". */
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before an action that cannot be undone; only "confirm" lets it through
 * (HOST-01 AC 12, 15, HOSTPLAY-01 AC 2, RES-01 AC 8, POD-01 AC 11).
 */
export function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div class="sheet">
      <div class="sheet__backdrop" aria-hidden="true" onClick={onCancel} />
      <section class="sheet__panel" role="alertdialog" aria-modal="true" aria-label={message}>
        <p class="sheet__message">{message}</p>
        <div class="sheet__actions">
          <SheetAction tone="danger" onPress={onConfirm}>
            {confirmLabel}
          </SheetAction>
          <SheetAction tone="quiet" onPress={onCancel}>
            {STRINGS.cancel}
          </SheetAction>
        </div>
      </section>
    </div>
  );
}
