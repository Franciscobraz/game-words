import { GamepadIcon } from '../components/icons.tsx';
import { PlayerAvatar } from '../components/PlayerAvatar.tsx';
import { PlayerRow } from '../components/PlayerRow.tsx';
import { PlayerTagPill } from '../components/PlayerTagPill.tsx';
import { RuleChips } from '../components/RuleChips.tsx';
import { TopBar } from '../components/TopBar.tsx';
import { WaitingDots } from '../components/WaitingDots.tsx';
import { WinsBadge } from '../components/WinsBadge.tsx';
import { lobbyRows } from '../model/players.ts';
import { useStore } from '../state/store.ts';
import { STRINGS } from '../strings/pt-BR.ts';
import '../styles/lobby.css';

/**
 * The lobby of a player who is not the host: the "Você" card, the rule chips, the
 * players with crown and tags, and "Aguardando <anfitrião> iniciar a partida"; it
 * follows every `settings` and `players` from the server (LOBBY-01, phone-lobby.png).
 */
export function LobbyScreen() {
  const { room, prefs } = useStore();
  const view = room.room.value;
  const rows = lobbyRows(view.players, view.hostId, view.myId);
  const me = view.players.find((p) => p.id === view.myId) ?? null;
  const host = view.players.find((p) => p.id === view.hostId) ?? null;

  return (
    <main class="screen lobby">
      <TopBar onOpenPrefs={prefs.openSheet} code={view.code ?? ''} />

      {me !== null && (
        <section class="lobby__me" aria-label={STRINGS.youLabel}>
          <PlayerAvatar nickname={me.nickname} color={me.color} size="large" />
          <span class="lobby__me-who">
            <span class="lobby__me-name">{me.nickname}</span>
            <PlayerTagPill tag="you" />
          </span>
          <span class="lobby__me-wins">
            <WinsBadge wins={me.wins} />
          </span>
        </section>
      )}

      {view.settings !== null && (
        <div class="lobby__rules">
          <RuleChips settings={view.settings} />
        </div>
      )}

      <div class="lobby__players-head">
        <h2 class="lobby__players-title">{STRINGS.playersTitle}</h2>
        <span class="lobby__count">{STRINGS.playersInRoom(view.players.length)}</span>
      </div>
      <ul class="lobby__players">
        {rows.map((row) => (
          <PlayerRow
            key={row.id}
            nickname={row.nickname}
            color={row.color}
            wins={row.wins}
            crowned={row.crowned}
            tags={row.tags}
            dimmed={row.dimmed}
          />
        ))}
      </ul>

      {host !== null && (
        <section class="lobby__waiting">
          <span class="lobby__waiting-icon">
            <GamepadIcon />
          </span>
          <p class="lobby__waiting-text">
            <span>{STRINGS.waitingForHostToStart(host.nickname)}</span>
            <WaitingDots />
          </p>
        </section>
      )}
    </main>
  );
}
