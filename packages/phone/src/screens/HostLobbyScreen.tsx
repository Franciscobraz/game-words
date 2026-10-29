import { useState } from 'preact/hooks';
import { HostMenu } from '../components/HostMenu.tsx';
import { MedalIcon, PlayArrowIcon, TuneIcon } from '../components/icons.tsx';
import { PlayerRow } from '../components/PlayerRow.tsx';
import { PrimaryButton } from '../components/PrimaryButton.tsx';
import { SettingsPanel } from '../components/SettingsPanel.tsx';
import { lobbyRows } from '../model/players.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import { PlayerActionsSheet } from './PlayerActionsSheet.tsx';
import '../styles/host-lobby.css';
import { RoomTopBar } from './RoomTopBar.tsx';

/**
 * The host's lobby: "VOCÊ É O(A) ANFITRIÃO(Ã)", the editable match settings, the
 * players and "INICIAR PARTIDA", always enabled because the host may play alone
 * (HOST-01 AC 1-9, 14-15, phone-host-lobby.png). A tap on another player opens their
 * actions (HOST-01 AC 10-13).
 */
export function HostLobbyScreen() {
  const { room } = useStore();
  const view = room.room.value;
  const rows = lobbyRows(view.players, view.hostId, view.myId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // A player who left while the sheet was open closes it.
  const selected = view.players.find((p) => p.id === selectedId) ?? null;

  return (
    <main class="screen host-lobby">
      <RoomTopBar
        menu={<HostMenu items={[{ label: STRINGS.closeRoom, confirm: STRINGS.confirmCloseRoom, onConfirm: room.closeRoom }]} />}
      />

      <p class="host-lobby__badge">
        <MedalIcon />
        {STRINGS.youAreHost}
      </p>

      <h2 class="host-lobby__title">
        <TuneIcon />
        {STRINGS.hostMatchRules}
      </h2>
      {view.settings !== null && <SettingsPanel settings={view.settings} onChangeSettings={room.changeSettings} />}

      <div class="host-lobby__players-head">
        <h2 class="host-lobby__players-title">{STRINGS.playersTitle}</h2>
        <span class="host-lobby__count">{view.players.length}</span>
      </div>
      <ul class="host-lobby__players">
        {rows.map((row) => (
          <PlayerRow
            key={row.id}
            nickname={row.nickname}
            color={row.color}
            wins={row.wins}
            crowned={row.crowned}
            tags={row.tags}
            dimmed={row.dimmed}
            onSelect={row.id === view.myId ? undefined : () => setSelectedId(row.id)}
          />
        ))}
      </ul>

      <div class="host-lobby__start">
        <PrimaryButton tone="action" onPress={room.start}>
          <PlayArrowIcon />
          {STRINGS.startMatch}
        </PrimaryButton>
      </div>

      {selected !== null && <PlayerActionsSheet player={selected} onClose={() => setSelectedId(null)} />}
    </main>
  );
}
