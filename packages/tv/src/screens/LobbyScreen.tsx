import type { PlayerInfo, Settings } from '@bwords/core';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { AudioNotice } from '../components/AudioNotice.tsx';
import { BrandHeader } from '../components/BrandHeader.tsx';
import { JoinCard } from '../components/JoinCard.tsx';
import { LobbySlotRow } from '../components/LobbySlotRow.tsx';
import { RoomCard } from '../components/RoomCard.tsx';
import { type ChipPulse, SettingsChipList } from '../components/SettingsChipList.tsx';
import { lobbyFooter, lobbySlots } from '../model/lobby-rows.ts';
import { displayAddress, qrMatrix, roomUrl } from '../model/qr.ts';
import { changedChip, settingsChips } from '../model/settings-chips.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/lobby.css';

/** The lobby: how to enter, who is in the room and how the match is set up (TVLOBBY-01). */
export function LobbyScreen() {
  const { room, sound } = useStore();
  const { code, players, hostId, settings } = room.room.value;
  const roomCode = code ?? '';
  const matrix = useMemo(() => qrMatrix(roomUrl(location.origin, roomCode)), [roomCode]);
  const pulse = useChipPulse(settings);
  return (
    <main class="screen lobby" data-testid="lobby-screen">
      <header class="lobby__header">
        <BrandHeader size="large" />
        {sound.blocked.value && <AudioNotice />}
        <RoomCard label={STRINGS.roomLabel} code={roomCode} matrix={null} size="large" />
      </header>
      <div class="lobby__body">
        <JoinCard code={roomCode} address={displayAddress(location.origin)} matrix={matrix} />
        <PlayersPanel players={players} hostId={hostId} settings={settings} pulse={pulse} />
      </div>
      <footer class="lobby__footer">
        <span class="lobby__footer-dot" aria-hidden="true" />
        <span data-testid="lobby-footer">{lobbyFooter(players, hostId)}</span>
      </footer>
    </main>
  );
}

interface PlayersPanelProps {
  players: readonly PlayerInfo[];
  hostId: string | null;
  settings: Settings | null;
  pulse: ChipPulse | null;
}

function PlayersPanel({ players, hostId, settings, pulse }: PlayersPanelProps) {
  const { count, slots } = lobbySlots(players, hostId);
  return (
    <section class="lobby__panel">
      <div class="lobby__panel-title">
        <h2 class="lobby__players-title">{STRINGS.players}</h2>
        <span class="lobby__count" data-testid="player-count">
          {count}
        </span>
        {players.length === 0 && <span class="lobby__nobody">{STRINGS.nobodyYet}</span>}
      </div>
      <div class="lobby__slots">
        {slots.map((slot) => (
          <div class="lobby__slot" key={slot.kind === 'player' ? slot.id : `free-${slot.number}`}>
            <LobbySlotRow slot={slot} />
          </div>
        ))}
      </div>
      <h3 class="lobby__settings-title">{STRINGS.settings}</h3>
      {settings !== null && <SettingsChipList chips={settingsChips(settings)} pulse={pulse} />}
    </section>
  );
}

/** Which chip pulses after the last settings change (TVLOBBY-01 AC 8). */
function useChipPulse(settings: Settings | null): ChipPulse | null {
  const previous = useRef(settings);
  const [pulse, setPulse] = useState<ChipPulse | null>(null);
  useEffect(() => {
    const before = previous.current;
    previous.current = settings;
    if (before === null || settings === null) return;
    const chip = changedChip(before, settings);
    if (chip !== null) setPulse((last) => ({ chip, id: (last?.id ?? 0) + 1 }));
  }, [settings]);
  return pulse;
}
