import { useState } from 'preact/hooks';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/podium-host-actions.css';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { DoorIcon, LogoutIcon } from './icons.tsx';
import { PrimaryButton } from './PrimaryButton.tsx';
import { SecondaryButton } from './SecondaryButton.tsx';

/** Props of `PodiumHostActions`. */
export interface PodiumHostActionsProps {
  onPlayAgain: () => void;
  onBackToLobby: () => void;
  /** Called only after the host confirms. */
  onCloseRoom: () => void;
}

/**
 * The host's three buttons fixed at the foot of the podium, in order of importance:
 * "JOGAR DE NOVO", "Voltar ao Lobby" and "ENCERRAR SALA", the last one only after a
 * confirmation (POD-01 AC 9-11).
 */
export function PodiumHostActions({ onPlayAgain, onBackToLobby, onCloseRoom }: PodiumHostActionsProps) {
  const [isConfirming, setConfirming] = useState(false);

  function confirm(): void {
    setConfirming(false);
    onCloseRoom();
  }

  return (
    <div class="podium-host-actions">
      <PrimaryButton tone="action" onPress={onPlayAgain}>
        {STRINGS.playAgain}
      </PrimaryButton>
      <SecondaryButton onPress={onBackToLobby}>
        <DoorIcon />
        {STRINGS.backToLobbyTitle}
      </SecondaryButton>
      <button type="button" class="podium-host-actions__close" onClick={() => setConfirming(true)}>
        <LogoutIcon />
        {STRINGS.closeRoomUpper}
      </button>
      {isConfirming && (
        <ConfirmDialog
          message={STRINGS.confirmCloseRoom}
          confirmLabel={STRINGS.closeRoom}
          onConfirm={confirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}
