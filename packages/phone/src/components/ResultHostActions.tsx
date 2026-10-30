import { useState } from 'preact/hooks';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/result-host-actions.css';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { ArrowBackIcon } from './icons.tsx';
import { PrimaryButton } from './PrimaryButton.tsx';
import { SecondaryButton } from './SecondaryButton.tsx';

/** Props of `ResultHostActions`. */
export interface ResultHostActionsProps {
  /** "PRÓXIMA RODADA (2 DE 3)". */
  nextLabel: string;
  onNext: () => void;
  /** Called only after the host confirms. */
  onBackToLobby: () => void;
}

/**
 * The host's buttons at the foot of the round result: the main one starts the next
 * round, since this screen only exists while rounds remain (PHONE-01 AC 3); "Voltar ao Lobby" asks "Cancelar a partida? O placar será zerado." before
 * acting (RES-01 AC 7-8).
 */
export function ResultHostActions({ nextLabel, onNext, onBackToLobby }: ResultHostActionsProps) {
  const [isConfirming, setConfirming] = useState(false);

  function confirm(): void {
    setConfirming(false);
    onBackToLobby();
  }

  return (
    <div class="result-host-actions">
      <PrimaryButton tone="action" onPress={onNext}>
        {nextLabel}
      </PrimaryButton>
      <SecondaryButton onPress={() => setConfirming(true)}>
        <ArrowBackIcon />
        {STRINGS.backToLobbyTitle}
      </SecondaryButton>
      {isConfirming && (
        <ConfirmDialog
          message={STRINGS.confirmCancelMatch}
          confirmLabel={STRINGS.backToLobbyTitle}
          onConfirm={confirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
