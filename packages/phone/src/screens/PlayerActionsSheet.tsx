import type { PlayerInfo } from '@bwords/core';
import { useState } from 'preact/hooks';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { CrownIcon, PersonRemoveIcon } from '../components/icons.tsx';
import { PlayerAvatar } from '../components/PlayerAvatar.tsx';
import { Sheet, SheetAction } from '../components/Sheet.tsx';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';

/** Props of `PlayerActionsSheet`. */
export interface PlayerActionsSheetProps {
  player: PlayerInfo;
  onClose: () => void;
}

/**
 * What the host can do to another player: "Tornar anfitrião", "Remover da sala"
 * after a confirmation, or "Cancelar", which sends nothing (HOST-01 AC 10-13,
 * phone-host-actions.png).
 */
export function PlayerActionsSheet({ player, onClose }: PlayerActionsSheetProps) {
  const { room } = useStore();
  const [isConfirmingKick, setConfirmingKick] = useState(false);

  function makeHost(): void {
    room.transferHost(player.id);
    onClose();
  }

  function kick(): void {
    room.kick(player.id);
    onClose();
  }

  if (isConfirmingKick) {
    return <ConfirmDialog message={STRINGS.confirmKick(player.nickname)} confirmLabel={STRINGS.confirmKickAction} onConfirm={kick} onCancel={onClose} />;
  }

  return (
    <Sheet label={STRINGS.playerActions(player.nickname)} onClose={onClose}>
      <div class="sheet__player">
        <PlayerAvatar nickname={player.nickname} color={player.color} size="medium" />
        <span class="sheet__player-who">
          <span class="sheet__player-name">{player.nickname}</span>
          <span class="sheet__player-wins">{STRINGS.winsInSession(player.wins)}</span>
        </span>
      </div>
      <div class="sheet__actions">
        <SheetAction tone="plain" onPress={makeHost}>
          <CrownIcon />
          {STRINGS.makeHost}
        </SheetAction>
        <SheetAction tone="danger" onPress={() => setConfirmingKick(true)}>
          <PersonRemoveIcon />
          {STRINGS.removeFromRoom}
        </SheetAction>
        <SheetAction tone="quiet" onPress={onClose}>
          {STRINGS.cancel}
        </SheetAction>
      </div>
    </Sheet>
  );
}
