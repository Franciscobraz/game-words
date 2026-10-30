import type { LobbyFreeSlot, LobbyPlayerSlot, LobbySlot, PlayerStatus } from '../model/lobby-rows.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/lobby-slot-row.css';
import { CrownIcon, TrophyIcon } from './icons.tsx';
import { PlayerCircle } from './PlayerCircle.tsx';

/** Props of `LobbySlotRow`. */
export interface LobbySlotRowProps {
  slot: LobbySlot;
}

/** The text of each status (TVLOBBY-01 AC 5). */
const STATUS_TEXT: Record<PlayerStatus, string> = {
  disconnected: STRINGS.disconnectedTag,
  spectator: STRINGS.spectatorTag,
};

/** One line of the players' panel: a player or a free place (TVLOBBY-01 AC 4-7). */
export function LobbySlotRow({ slot }: LobbySlotRowProps) {
  return slot.kind === 'player' ? <PlayerLine slot={slot} /> : <FreeLine slot={slot} />;
}

function PlayerLine({ slot }: { slot: LobbyPlayerSlot }) {
  const dimmed = slot.status === 'disconnected';
  return (
    <div
      class={dimmed ? 'lobby-slot lobby-slot--dimmed' : 'lobby-slot lobby-slot--player'}
      style={{ '--player-color': slot.color }}
      data-testid={`player-${slot.id}`}
    >
      <PlayerCircle nickname={slot.nickname} color={slot.color} shape="square" />
      <div class="lobby-slot__identity">
        <div class="lobby-slot__name-line">
          <span class="lobby-slot__name">{slot.nickname}</span>
          {slot.crowned && (
            <span class="lobby-slot__crown" role="img" aria-label={STRINGS.crown}>
              <CrownIcon />
            </span>
          )}
        </div>
        {slot.isHost && <span class="lobby-slot__host">{STRINGS.hostTag}</span>}
      </div>
      <div class="lobby-slot__side">
        {slot.winsText !== null && (
          <span class="lobby-slot__wins">
            <TrophyIcon />
            <span class="lobby-slot__wins-text">{slot.winsText}</span>
          </span>
        )}
        {slot.status !== null && <span class={`lobby-slot__status lobby-slot__status--${slot.status}`}>{STATUS_TEXT[slot.status]}</span>}
      </div>
    </div>
  );
}

function FreeLine({ slot }: { slot: LobbyFreeSlot }) {
  return (
    <div class="lobby-slot lobby-slot--free" data-testid="free-slot">
      <span class="lobby-slot__place" aria-hidden="true">
        {slot.number}
      </span>
      <span class="lobby-slot__free-text">{STRINGS.freeSlot(slot.number)}</span>
    </div>
  );
}
