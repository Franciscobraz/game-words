import { PALETTE, type Settings } from '@bwords/core';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { useNow, useRoomSocket, type View } from './socket.ts';
import { Clock, Header, LogView, PlayersView, PodiumView, ResultsView, SettingsView, StaticBoard, tileText } from './views.tsx';
import '@bwords/theme/tokens.css';
import './style.css';

const MAX_PHONES = 4;
const NICKNAMES = ['Ana', 'Bruno', 'Carla', 'Davi'];

interface Room {
  code: string;
  tvToken: string;
}

type Send = ReturnType<typeof useRoomSocket>['send'];

function App() {
  const [room, setRoom] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [phones, setPhones] = useState<number[]>([]);
  const [nextPhone, setNextPhone] = useState(0);

  const createRoom = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/rooms', { method: 'POST' });
      if (!res.ok) throw new Error(`POST /api/rooms: HTTP ${res.status}`);
      setRoom((await res.json()) as Room);
      setPhones([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  };

  const addPhone = () => {
    setPhones((p) => [...p, nextPhone]);
    setNextPhone((n) => n + 1);
  };

  return (
    <main>
      <header class="top">
        <h1>BWords debug</h1>
        <button type="button" onClick={createRoom} disabled={creating}>
          Criar sala
        </button>
        <button type="button" onClick={addPhone} disabled={!room || phones.length >= MAX_PHONES}>
          Adicionar celular
        </button>
        {room && (
          <span>
            Sala <strong>{room.code}</strong>
          </span>
        )}
        {error && <span class="error">{error}</span>}
      </header>
      {room && (
        <div class="columns">
          <TvColumn key={`tv-${room.code}`} room={room} />
          {phones.map((n) => (
            <PhoneColumn
              key={`${room.code}-${n}`}
              code={room.code}
              index={n}
              onRemove={() => setPhones((p) => p.filter((x) => x !== n))}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function TvColumn({ room }: { room: Room }) {
  const sock = useRoomSocket('tv');
  const { view } = sock;
  const now = useNow();

  useEffect(() => sock.connect(room.code, room.tvToken), [room.code]);

  return (
    <section class="column">
      <h2>TV</h2>
      <ConnectionButtons view={view} onDisconnect={sock.disconnect} onReconnect={() => sock.connect(room.code, room.tvToken)} />
      <Header view={view} />
      <SettingsView settings={view.settings} />
      <PlayersView view={view} counts={view.phase === 'round' ? view.counts : undefined} />
      <Clock round={view.phase === 'round' ? view.round : null} now={now} />
      {view.round && view.phase !== 'lobby' && <StaticBoard board={view.round.board} />}
      {view.phase === 'results' && view.results && <ResultsView results={view.results} players={view.players} />}
      {view.phase === 'podium' && view.podium && <PodiumView ranking={view.podium} players={view.players} />}
      <LogView log={sock.log} onClear={sock.clearLog} />
    </section>
  );
}

function ConnectionButtons({ view, onDisconnect, onReconnect }: { view: View; onDisconnect: () => void; onReconnect: () => void }) {
  const live = view.status === 'open' || view.status === 'connecting';
  return (
    <div class="row">
      <button type="button" onClick={onDisconnect} disabled={!live}>
        Desconectar
      </button>
      <button type="button" onClick={onReconnect} disabled={live}>
        Reconectar
      </button>
    </div>
  );
}

function PhoneColumn({ code, index, onRemove }: { code: string; index: number; onRemove: () => void }) {
  const sock = useRoomSocket('player');
  const { view, send } = sock;
  const now = useNow();
  const [nickname, setNickname] = useState(NICKNAMES[index % NICKNAMES.length]! + (index >= NICKNAMES.length ? index : ''));
  const [color, setColor] = useState(PALETTE[index % PALETTE.length]!);

  useEffect(() => sock.connect(code), [code]);

  const me = view.players.find((p) => p.id === view.playerId);
  const isHost = view.playerId !== null && view.playerId === view.hostId;
  const roundOpen = view.phase === 'round' && view.round !== null && now >= view.round.startsAt && now < view.round.endsAt;

  return (
    <section class="column">
      <h2>
        Celular {index + 1}
        {me && `: ${me.nickname}`}
        {isHost && <span class="tag">host</span>}
        <button type="button" class="right" onClick={onRemove}>
          remover
        </button>
      </h2>
      <ConnectionButtons view={view} onDisconnect={sock.disconnect} onReconnect={sock.reconnect} />
      <Header view={view} />

      {view.playerId === null && (
        <form
          class="row"
          onSubmit={(e) => {
            e.preventDefault();
            send({ type: 'join', nickname, color });
          }}
        >
          <input value={nickname} onInput={(e) => setNickname(e.currentTarget.value)} size={10} aria-label="apelido" />
          <input type="color" value={color} onInput={(e) => setColor(e.currentTarget.value)} aria-label="cor" />
          <input value={color} onInput={(e) => setColor(e.currentTarget.value)} size={8} aria-label="cor hex" />
          <button type="submit">Entrar</button>
        </form>
      )}
      <p class="small">
        Entrada:{' '}
        {view.joinError ? (
          <span class="error">{view.joinError}</span>
        ) : view.token ? (
          <>
            ok, playerId <code>{view.playerId}</code>, token <code>{view.token}</code>
          </>
        ) : view.playerId ? (
          <>
            reconectado como <code>{view.playerId}</code>
          </>
        ) : (
          '-'
        )}
      </p>

      {isHost && view.settings && <HostControls view={view} settings={view.settings} send={send} />}

      <PlayersView view={view} />
      <Clock round={view.phase === 'round' ? view.round : null} now={now} />
      {view.hashes && (
        <p class="small">
          hashes: {view.hashes.words} words, round {view.hashes.roundId}
        </p>
      )}
      {view.phase === 'round' && view.round && (
        <PathBoard key={view.round.id} board={view.round.board} enabled={roundOpen && view.playerId !== null} send={send} />
      )}
      {view.lastSubmit && (
        <p class="small">
          submit-result:{' '}
          {view.lastSubmit.map((r, i) => (
            <span key={i} class={r.ok ? 'ok' : 'error'}>
              {r.ok ? `ok ${r.word}` : r.reason}{' '}
            </span>
          ))}
        </p>
      )}
      {view.phase === 'round' && (
        <p class="small">
          <strong>Aceitas ({view.found.length}):</strong> {view.found.join(', ') || '-'}
        </p>
      )}
      {view.phase === 'results' && view.results && <ResultsView results={view.results} players={view.players} />}
      {view.phase === 'podium' && view.podium && <PodiumView ranking={view.podium} players={view.players} />}
      <LogView log={sock.log} onClear={sock.clearLog} />
    </section>
  );
}

function adjacent(a: number, b: number, n: number): boolean {
  return a !== b && Math.abs(Math.floor(a / n) - Math.floor(b / n)) <= 1 && Math.abs((a % n) - (b % n)) <= 1;
}

/** The board as buttons: click adjacent unused tiles to build a path, click the last one to undo it. */
function PathBoard({ board, enabled, send }: { board: string[][]; enabled: boolean; send: Send }) {
  const n = board.length;
  const tiles = board.flat();
  const [path, setPath] = useState<number[]>([]);
  const last = path[path.length - 1];

  const canPick = (i: number) => last === undefined || (!path.includes(i) && adjacent(i, last, n));
  const click = (i: number) => {
    if (i === last) setPath(path.slice(0, -1));
    else if (canPick(i)) setPath([...path, i]);
  };
  const submit = () => {
    send({ type: 'submit', paths: [path] });
    setPath([]);
  };

  return (
    <div class="block">
      <div class="board" style={{ gridTemplateColumns: `repeat(${n}, 2.2em)` }}>
        {tiles.map((t, i) => (
          <button
            key={i}
            type="button"
            class={`tile${path.includes(i) ? ' selected' : ''}`}
            disabled={!enabled || !(i === last || canPick(i))}
            onClick={() => click(i)}
          >
            {tileText(t)}
          </button>
        ))}
      </div>
      <div class="row">
        <code class="word">{path.map((i) => tiles[i]).join('').toUpperCase() || '...'}</code>
        <button type="button" onClick={submit} disabled={!enabled || path.length === 0}>
          Enviar
        </button>
        <button type="button" onClick={() => setPath([])} disabled={path.length === 0}>
          Limpar
        </button>
      </div>
    </div>
  );
}

const SETTING_OPTIONS = {
  size: [4, 5, 6],
  seconds: [30, 60, 90, 120, 150, 180],
  rounds: [1, 2, 3, 4, 5],
  minLength: [3, 4],
} as const;

type NumberSetting = keyof typeof SETTING_OPTIONS;

function HostControls({ view, settings, send }: { view: View; settings: Settings; send: Send }) {
  const [draft, setDraft] = useState<Settings>(settings);
  const others = view.players.filter((p) => p.id !== view.playerId);
  const [target, setTarget] = useState('');
  const targetId = others.some((p) => p.id === target) ? target : (others[0]?.id ?? '');

  useEffect(() => setDraft(settings), [settings]);

  const apply = () => {
    const patch = Object.fromEntries(
      (Object.keys(draft) as (keyof Settings)[]).filter((k) => draft[k] !== settings[k]).map((k) => [k, draft[k]]),
    );
    if (Object.keys(patch).length > 0) send({ type: 'settings', patch });
  };
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft((d) => ({ ...d, [key]: value }));

  return (
    <fieldset class="host">
      <legend>Anfitrião</legend>
      <div class="row">
        {(Object.keys(SETTING_OPTIONS) as NumberSetting[]).map((key) => (
          <label key={key}>
            {key}{' '}
            <select value={String(draft[key])} onChange={(e) => set(key, Number(e.currentTarget.value) as never)}>
              {SETTING_OPTIONS[key].map((v) => (
                <option key={v} value={String(v)}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label>
          volume{' '}
          <input
            type="number"
            min={0}
            max={100}
            value={draft.volume}
            onInput={(e) => set('volume', Number(e.currentTarget.value))}
            style={{ width: '4em' }}
          />
        </label>
        {(['filterProfanity', 'muted'] as const).map((key) => (
          <label key={key}>
            <input type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.currentTarget.checked)} /> {key}
          </label>
        ))}
        <button type="button" onClick={apply}>
          Aplicar
        </button>
      </div>
      <div class="row">
        <button type="button" onClick={() => send({ type: 'start' })}>
          Iniciar
        </button>
        <button type="button" onClick={() => send({ type: 'next' })}>
          Avançar
        </button>
        <button type="button" onClick={() => send({ type: 'play-again' })}>
          Jogar de novo
        </button>
        <button type="button" onClick={() => send({ type: 'back-to-lobby' })}>
          Voltar ao lobby
        </button>
      </div>
      <div class="row">
        <select value={targetId} onChange={(e) => setTarget(e.currentTarget.value)} disabled={others.length === 0}>
          {others.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nickname}
            </option>
          ))}
        </select>
        <button type="button" disabled={!targetId} onClick={() => send({ type: 'transfer-host', playerId: targetId })}>
          Transferir host
        </button>
        <button type="button" disabled={!targetId} onClick={() => send({ type: 'kick', playerId: targetId })}>
          Expulsar
        </button>
        <button type="button" class="danger" onClick={() => send({ type: 'close-room' })}>
          Encerrar sala
        </button>
      </div>
    </fieldset>
  );
}

render(<App />, document.getElementById('app')!);
