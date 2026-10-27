# M2 Room Server verification

**Verdict**: FAIL
**Mutations**: 3 - probed C16, C55, C93
**Proofs**: `proofs.md` at 1bd8f22 (HEAD 2eabc49 changes only `proofs.md` and `tasks.md`)
**Verifier**: independent sub-agent (author != verifier)

## Mutations injected

| Mutation | Location | Killed |
| --- | --- | --- |
| player view leaks each player's round words in players and welcome | `packages/core/src/room/effects.ts:94` | no |
| rebuilt room keeps players whose sockets died marked connected | `packages/server/src/room-do.ts:39` | no |
| static assets served before the Worker (pack public over HTTP) | `packages/server/wrangler.jsonc:9` | yes |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| C16 does not catch round words leaking to phones through `players` or `welcome` (PROTO-01 AC 5) | mutation `playerInfo` + `found: p.found` not killed by `match.test.ts` "never sends round words to phones before the results"; only `join.test.ts`, `machine.test.ts` exact-shape `toEqual` assertions fail, and none of them is about words | in `playMatch`, make a phone disconnect and reconnect after accepted submits mid-round, so `players` and `welcome` reach the phones during the round and the word scan covers them | |
| The dead-socket cleanup after a rebuild is untested: without it, players and the TV stay `connected` on dead sockets, so the host handoff (HOST-01 AC 5), the `tv-gone` timer (EXP-01 AC 3) and the disconnected state (RECON-01 AC 3) never start | mutation `dropStaleConnections()` removed from the `RoomDO` constructor: all 29 server tests stay green | add a server test that evicts with `{ webSockets: 'close' }` mid-round and asserts every player `connected: false`, `tvConn` null, `tvOfflineSince` set and the host handoff deadline on the alarm | |
| A submit's `lastActionAt` is never stored: after hibernation or eviction the room's last action falls back to the last `room` write, so it can close as `idle` earlier than `ROOM_IDLE_TIMEOUT_MIN` after a real action (PERSIST-01 AC 1, EXP-01 AC 2) | throwaway test at HEAD: submit at `startsAt + 60 s`, `evictDurableObject`, then `lastActionAt` is `startsAt - 3 s`, not `startsAt + 60 s`; `handleSubmit` persists only `found:<id>`, and C55's `durable()` leaves `lastActionAt` out | persist `room` with the submit when it changes `lastActionAt` (or store it with `found:<id>`), and assert `lastActionAt` in C55 | |

## Own examples (passed at HEAD)

- One `submit` with 25 paths: the first 10 are validated, the other 15 get `rate-limited` (ROUND-01 AC 6).
- Nickname of 12 emoji is accepted, 13 gets `bad-nickname`; `JOSÉ` clashes with `José` written with a combining accent (JOIN-01 AC 2-3).
- `seconds` 150 accepted; 165 and 30.0001 get `bad-settings`; `volume` 100 accepted, 101 refused (CFG-01 AC 3, 5).
