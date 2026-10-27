import {
  type ClientMessage,
  type CloseReason,
  decodeHashFrame,
  HASH_PREFIX_BYTES,
  type ErrorCode,
  type Phase,
  type PlayerInfo,
  type PodiumEntry,
  type RoundInfo,
  type RoundResultsMessage,
  type ServerMessage,
  type Settings,
  type SubmitResult,
} from '@bwords/core';
import { useEffect, useRef, useState } from 'preact/hooks';

/** One line of a column's message log. */
export interface LogEntry {
  id: number;
  at: number;
  dir: 'in' | 'out' | 'info';
  text: string;
}

/** What a column knows about the room, built only from the messages it got. */
export interface View {
  status: 'idle' | 'connecting' | 'open' | 'closed';
  code: string | null;
  phase: Phase | null;
  settings: Settings | null;
  players: PlayerInfo[];
  hostId: string | null;
  round: RoundInfo | null;
  /** Phones only. */
  playerId: string | null;
  token: string | null;
  joinError: ErrorCode | null;
  found: string[];
  lastSubmit: SubmitResult[] | null;
  hashes: { roundId: number; words: number } | null;
  /** TV only. */
  counts: Record<string, number>;
  results: RoundResultsMessage | null;
  podium: PodiumEntry[] | null;
  lastError: ErrorCode | null;
  closedReason: CloseReason | null;
}

const INITIAL: View = {
  status: 'idle',
  code: null,
  phase: null,
  settings: null,
  players: [],
  hostId: null,
  round: null,
  playerId: null,
  token: null,
  joinError: null,
  found: [],
  lastSubmit: null,
  hashes: null,
  counts: {},
  results: null,
  podium: null,
  lastError: null,
  closedReason: null,
};

/** Folds a server message into the view. `pendingJoin` tells a join error from any other error. */
function apply(view: View, msg: ServerMessage, pendingJoin: boolean): View {
  switch (msg.type) {
    case 'welcome': {
      const base = {
        ...view,
        code: msg.code,
        phase: msg.phase,
        settings: msg.settings,
        players: msg.players,
        hostId: msg.hostId,
        round: msg.round,
        results: null,
        podium: null,
      };
      return msg.role === 'player' ? { ...base, playerId: msg.playerId, found: msg.found } : base;
    }
    case 'joined':
      return { ...view, playerId: msg.playerId, token: msg.token, joinError: null };
    case 'players':
      return { ...view, players: msg.players, hostId: msg.hostId };
    case 'settings':
      return { ...view, settings: msg.settings };
    case 'round-start': {
      const { type: _type, salt: _salt, ...round } = msg;
      return { ...view, phase: 'round', round, found: [], lastSubmit: null, counts: {}, results: null, podium: null };
    }
    case 'submit-result': {
      const words = msg.results.flatMap((r) => (r.ok ? [r.word] : []));
      return { ...view, lastSubmit: msg.results, found: [...view.found, ...words] };
    }
    case 'counts':
      return { ...view, counts: Object.fromEntries(msg.counts.map((c) => [c.playerId, c.count])) };
    case 'round-results':
      return { ...view, phase: 'results', results: msg };
    case 'podium':
      return { ...view, phase: 'podium', podium: msg.ranking };
    case 'time':
      return view;
    case 'error':
      return pendingJoin ? { ...view, joinError: msg.code, lastError: msg.code } : { ...view, lastError: msg.code };
    case 'closed':
      return { ...view, closedReason: msg.reason };
  }
}

/** Short text of a server frame for the log. */
function describe(data: unknown): { text: string; msg: ServerMessage | null; hashes?: { roundId: number; words: number } } {
  if (typeof data === 'string') {
    if (!data.startsWith('{')) return { text: data, msg: null };
    return { text: data, msg: JSON.parse(data) as ServerMessage };
  }
  const frame = decodeHashFrame(data as ArrayBuffer);
  if (!frame) return { text: `binary frame (${(data as ArrayBuffer).byteLength} bytes, unknown)`, msg: null };
  const words = frame.prefixes.length / HASH_PREFIX_BYTES;
  return { text: `hashes: ${words} words, round ${frame.roundId}`, msg: null, hashes: { roundId: frame.roundId, words } };
}

const wsUrl = (code: string) => `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/rooms/${code}/ws`;

let nextLogId = 1;

/**
 * One WebSocket to a room, as the TV or a phone. `connect` opens it and sends the
 * `hello`; the phone's token from `joined` is kept for `reconnect`.
 */
export function useRoomSocket(role: 'tv' | 'player') {
  const [view, setView] = useState<View>(INITIAL);
  const [log, setLog] = useState<LogEntry[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const pendingJoin = useRef(false);
  const tokenRef = useRef<string | null>(null);

  const addLog = (dir: LogEntry['dir'], text: string) =>
    setLog((l) => [...l.slice(-299), { id: nextLogId++, at: Date.now(), dir, text }]);

  const send = (msg: ClientMessage) => {
    const socket = ws.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      addLog('info', `not sent (socket not open): ${JSON.stringify(msg)}`);
      return;
    }
    if (msg.type === 'join') pendingJoin.current = true;
    socket.send(JSON.stringify(msg));
    addLog('out', JSON.stringify(msg));
  };

  /** Opens the socket and sends `hello` with `token` (the TV token, or a phone's player token). */
  const connect = (code: string, token?: string) => {
    ws.current?.close(1000);
    const socket = new WebSocket(wsUrl(code));
    socket.binaryType = 'arraybuffer';
    ws.current = socket;
    setView((v) => ({ ...v, status: 'connecting', code, closedReason: null, lastError: null }));
    addLog('info', `connecting to ${code}`);
    socket.addEventListener('open', () => {
      if (ws.current !== socket) return;
      setView((v) => ({ ...v, status: 'open' }));
      const hello: ClientMessage =
        role === 'tv' ? { type: 'hello', role: 'tv', token: token ?? '' } : token ? { type: 'hello', role: 'player', token } : { type: 'hello', role: 'player' };
      send(hello);
    });
    socket.addEventListener('message', (event) => {
      if (ws.current !== socket) return;
      const { text, msg, hashes } = describe(event.data);
      addLog('in', text);
      if (hashes) setView((v) => ({ ...v, hashes }));
      if (!msg) return;
      if (msg.type === 'joined') tokenRef.current = msg.token;
      const joining = pendingJoin.current;
      if (msg.type === 'joined' || msg.type === 'error') pendingJoin.current = false;
      setView((v) => apply(v, msg, joining));
    });
    socket.addEventListener('close', (event) => {
      if (ws.current !== socket) return;
      setView((v) => ({ ...v, status: 'closed' }));
      addLog('info', `closed (${event.code}${event.reason ? ` ${event.reason}` : ''})`);
    });
  };

  const disconnect = () => {
    const socket = ws.current;
    if (!socket) return;
    socket.close(1000);
    ws.current = null;
    setView((v) => ({ ...v, status: 'closed' }));
    addLog('info', 'disconnected by the page');
  };

  /** Phones: opens a new socket and says `hello` with the saved token. */
  const reconnect = () => {
    if (view.code) connect(view.code, tokenRef.current ?? undefined);
  };

  useEffect(() => () => ws.current?.close(1000), []);

  return { view, log, send, connect, disconnect, reconnect, clearLog: () => setLog([]) };
}

/** Milliseconds now, refreshed a few times per second. */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
