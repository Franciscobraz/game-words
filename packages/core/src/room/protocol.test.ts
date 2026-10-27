import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  CLIENT_MESSAGE_TYPES,
  CLOSE_REASONS,
  type ClientMessage,
  decodeHashFrame,
  encodeHashFrame,
  ERROR_CODES,
  parseClientMessage,
  SERVER_MESSAGE_TYPES,
  SUBMIT_REJECTS,
} from './protocol.ts';

// The names below are copied from spec.md (PROTO-01, ROUND-01, HOST-01, RES-01, EXP-01)
// and design.md "Protocol (core)".
const SPEC_CLIENT_TYPES = [
  'hello',
  'join',
  'settings',
  'start',
  'submit',
  'next',
  'transfer-host',
  'kick',
  'play-again',
  'back-to-lobby',
  'close-room',
  'time',
];
const SPEC_SERVER_TYPES = [
  'welcome',
  'joined',
  'players',
  'settings',
  'round-start',
  'submit-result',
  'counts',
  'round-results',
  'podium',
  'time',
  'error',
  'closed',
];
const SPEC_ERROR_CODES = [
  'bad-message',
  'wrong-phase',
  'not-host',
  'bad-token',
  'room-not-found',
  'bad-nickname',
  'nickname-taken',
  'bad-color',
  'color-illegible',
  'color-too-similar',
  'room-full',
  'bad-settings',
  'bad-target',
];
const SPEC_SUBMIT_REJECTS = [
  'invalid-path',
  'too-short',
  'not-a-word',
  'already-found',
  'round-closed',
  'spectator',
  'rate-limited',
];
const SPEC_CLOSE_REASONS = ['kicked', 'closed-by-host', 'idle', 'tv-gone', 'replaced'];

/** One well-formed message per client type. */
const VALID: Record<(typeof CLIENT_MESSAGE_TYPES)[number], ClientMessage[]> = {
  hello: [
    { type: 'hello', role: 'tv', token: 'tv-token' },
    { type: 'hello', role: 'player', token: 'player-token' },
    { type: 'hello', role: 'player' },
  ],
  join: [{ type: 'join', nickname: 'João', color: '#E53935' }],
  settings: [{ type: 'settings', patch: { seconds: 60 } }],
  start: [{ type: 'start' }],
  submit: [{ type: 'submit', paths: [[0, 1, 2], [5, 9, 8]] }],
  next: [{ type: 'next' }],
  'transfer-host': [{ type: 'transfer-host', playerId: 'p2' }],
  kick: [{ type: 'kick', playerId: 'p2' }],
  'play-again': [{ type: 'play-again' }],
  'back-to-lobby': [{ type: 'back-to-lobby' }],
  'close-room': [{ type: 'close-room' }],
  time: [{ type: 'time', clientTime: 1_700_000_000_123 }],
};

/** Per client type, messages with a field out of format (missing, wrong type, or extra). */
const MALFORMED: Record<(typeof CLIENT_MESSAGE_TYPES)[number], unknown[]> = {
  hello: [
    { type: 'hello', role: 'tv' },
    { type: 'hello', role: 'tv', token: 7 },
    { type: 'hello', role: 'tv', token: '' },
    { type: 'hello', role: 'tv', token: 'x'.repeat(65) },
    { type: 'hello', role: 'admin', token: 't' },
    { type: 'hello' },
    { type: 'hello', role: 'player', token: null },
    { type: 'hello', role: 'player', room: 'ABCD' },
  ],
  join: [
    { type: 'join', color: '#E53935' },
    { type: 'join', nickname: 'Ana' },
    { type: 'join', nickname: 42, color: '#E53935' },
    { type: 'join', nickname: 'Ana', color: 0xe53935 },
    { type: 'join', nickname: 'Ana', color: '#E53935', host: true },
  ],
  settings: [
    { type: 'settings' },
    { type: 'settings', patch: null },
    { type: 'settings', patch: [60] },
    { type: 'settings', patch: 'seconds=60' },
    { type: 'settings', seconds: 60 },
  ],
  start: [{ type: 'start', now: true }],
  submit: [
    { type: 'submit' },
    { type: 'submit', paths: [] },
    { type: 'submit', paths: [0, 1, 2] },
    { type: 'submit', paths: [[0, 1.5, 2]] },
    { type: 'submit', paths: [['0', '1', '2']] },
    { type: 'submit', paths: [[0, 1, 2]], word: 'gato' },
  ],
  next: [{ type: 'next', round: 2 }],
  'transfer-host': [
    { type: 'transfer-host' },
    { type: 'transfer-host', playerId: 3 },
    { type: 'transfer-host', playerId: '' },
  ],
  kick: [{ type: 'kick' }, { type: 'kick', playerId: false }, { type: 'kick', playerId: '' }],
  'play-again': [{ type: 'play-again', keepScores: true }],
  'back-to-lobby': [{ type: 'back-to-lobby', keepScores: true }],
  'close-room': [{ type: 'close-room', reason: 'idle' }],
  time: [
    { type: 'time' },
    { type: 'time', clientTime: '1700000000123' },
    { type: 'time', clientTime: null },
    { type: 'time', clientTime: 1, serverTime: 2 },
  ],
};

describe('protocol names', () => {
  test('exports every message type, error code and reason', () => {
    expect([...CLIENT_MESSAGE_TYPES]).toEqual(SPEC_CLIENT_TYPES);
    expect([...SERVER_MESSAGE_TYPES]).toEqual(SPEC_SERVER_TYPES);
    expect([...ERROR_CODES]).toEqual(SPEC_ERROR_CODES);
    expect([...SUBMIT_REJECTS]).toEqual(SPEC_SUBMIT_REJECTS);
    expect([...CLOSE_REASONS]).toEqual(SPEC_CLOSE_REASONS);
  });

  test('uses only the English protocol names', () => {
    const all = [...CLIENT_MESSAGE_TYPES, ...SERVER_MESSAGE_TYPES, ...ERROR_CODES, ...SUBMIT_REJECTS, ...CLOSE_REASONS];
    for (const name of all) expect(name).toMatch(/^[a-z]+(-[a-z]+)*$/);
    const spec = new Set([
      ...SPEC_CLIENT_TYPES,
      ...SPEC_SERVER_TYPES,
      ...SPEC_ERROR_CODES,
      ...SPEC_SUBMIT_REJECTS,
      ...SPEC_CLOSE_REASONS,
    ]);
    for (const name of all) expect(spec.has(name)).toBe(true);
    // Field names of every client message are English camelCase.
    for (const messages of Object.values(VALID)) {
      for (const m of messages) for (const key of Object.keys(m)) expect(key).toMatch(/^[a-z]+([A-Z][a-z]+)*$/);
    }
  });
});

describe('parseClientMessage', () => {
  test.each(CLIENT_MESSAGE_TYPES)('reads a well-formed %s message', (type) => {
    for (const msg of VALID[type]) expect(parseClientMessage(JSON.stringify(msg))).toEqual(msg);
  });

  describe('rejects malformed messages', () => {
    test('that are not JSON objects', () => {
      for (const raw of ['', '{', 'hello', '{"type":"start"', 'null', '42', '"start"', '[{"type":"start"}]', 'true']) {
        expect(parseClientMessage(raw)).toBeNull();
      }
    });

    test('without a known type', () => {
      for (const msg of [{}, { type: 7 }, { type: 'START' }, { type: 'start-round' }, { type: 'ping' }, { type: 'welcome' }]) {
        expect(parseClientMessage(JSON.stringify(msg))).toBeNull();
      }
      expect(parseClientMessage('{"type":"__proto__"}')).toBeNull();
      expect(parseClientMessage('{"type":"toString"}')).toBeNull();
    });

    test.each(CLIENT_MESSAGE_TYPES)('with a field out of format: %s', (type) => {
      expect(MALFORMED[type].length).toBeGreaterThan(0);
      for (const msg of MALFORMED[type]) expect(parseClientMessage(JSON.stringify(msg))).toBeNull();
    });
  });

  describe('rejects messages over 4096 bytes before parsing', () => {
    afterEach(() => vi.restoreAllMocks());

    /** A join message whose JSON is exactly `bytes` UTF-8 bytes, padded in the nickname with `pad`. */
    const joinOf = (bytes: number, pad: string, padBytes: number) => {
      const head = '{"type":"join","color":"#E53935","nickname":"';
      const tail = '"}';
      const room = bytes - head.length - tail.length;
      const raw = head + pad.repeat(Math.floor(room / padBytes)) + 'a'.repeat(room % padBytes) + tail;
      return raw;
    };

    test('ASCII: 4096 bytes are read, 4097 are refused', () => {
      const atLimit = joinOf(4096, 'a', 1);
      expect(atLimit.length).toBe(4096);
      expect(parseClientMessage(atLimit)).toMatchObject({ type: 'join', color: '#E53935' });
      const spy = vi.spyOn(JSON, 'parse');
      expect(parseClientMessage(joinOf(4097, 'a', 1))).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });

    test('counts UTF-8 bytes, not characters', () => {
      // "ã" is 2 bytes in UTF-8.
      const atLimit = joinOf(4096, 'ã', 2);
      expect(atLimit.length).toBeLessThan(4096);
      expect(parseClientMessage(atLimit)).toMatchObject({ type: 'join' });
      const over = joinOf(4097, 'ã', 2);
      expect(over.length).toBeLessThan(4096);
      const spy = vi.spyOn(JSON, 'parse');
      expect(parseClientMessage(over)).toBeNull();
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

describe('hash frame', () => {
  const prefixes = Uint8Array.from({ length: 18 }, (_, i) => (i * 37 + 5) & 0xff);

  test('decodes what it encodes', () => {
    for (const roundId of [0, 1, 7, 0xffffffff]) {
      const out = decodeHashFrame(encodeHashFrame(roundId, prefixes));
      expect(out).not.toBeNull();
      expect(out!.roundId).toBe(roundId);
      expect([...out!.prefixes]).toEqual([...prefixes]);
    }
    expect(decodeHashFrame(encodeHashFrame(3, new Uint8Array(0)))).toEqual({ roundId: 3, prefixes: new Uint8Array(0) });
  });

  test('lays out u8 kind 1, u32 round id, then 6 bytes per word', () => {
    const buf = encodeHashFrame(0x01020304, prefixes);
    const bytes = new Uint8Array(buf);
    expect(buf.byteLength).toBe(1 + 4 + 3 * 6);
    expect(bytes[0]).toBe(1);
    expect(new DataView(buf).getUint32(1)).toBe(0x01020304);
    expect([...bytes.subarray(5)]).toEqual([...prefixes]);
  });

  test('refuses a frame of another kind or a broken length', () => {
    const good = new Uint8Array(encodeHashFrame(9, prefixes));
    const otherKind = Uint8Array.from(good);
    otherKind[0] = 2;
    expect(decodeHashFrame(otherKind.buffer)).toBeNull();
    expect(decodeHashFrame(good.slice(0, good.length - 1).buffer)).toBeNull();
    expect(decodeHashFrame(good.slice(0, 4).buffer)).toBeNull();
    expect(decodeHashFrame(new ArrayBuffer(0))).toBeNull();
    expect(() => encodeHashFrame(1, new Uint8Array(7))).toThrow();
    expect(() => encodeHashFrame(-1, prefixes)).toThrow();
    expect(() => encodeHashFrame(2 ** 32, prefixes)).toThrow();
  });
});
