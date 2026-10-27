# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Plan/Checks)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Test every inclusive limit with a value exactly at the limit
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `thresholds` · harmful: 0
- features: m0-dictionary-spike
- evidence: spikes/m0/src/report.ts:145 (C42) (thresholds)
- last seen: 2026-10-26T21:14:23Z

### L-002 - Fail a measurement verdict when the required sample count is not met instead of dropping invalid samples
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `benchmarks` · harmful: 0
- features: m0-dictionary-spike
- evidence: spikes/m0/src/report.ts:108 (BENCH-01 AC 7) (benchmarks)
- last seen: 2026-10-26T21:14:23Z

### L-003 - Judge a failure condition over every matching record, not only the first one
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `benchmarks` · harmful: 0
- features: m0-dictionary-spike
- evidence: spikes/m0/src/report.ts:126 (BENCH-01 AC 5) (benchmarks)
- last seen: 2026-10-26T21:14:24Z

### L-004 - Validate weighted-draw inputs so an exhausted pool raises a clear error instead of an out-of-range pick
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `core` · harmful: 0
- features: m0-dictionary-spike
- evidence: packages/core/src/generator.ts (GEN-01 AC 6) (core)
- last seen: 2026-10-26T21:14:24Z

### L-005 - Normalize text to NFC before character-class checks
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `lang` · harmful: 0
- features: m0-dictionary-spike
- evidence: packages/core/src/lang/ptBR.ts (DICT-02 AC 4-5) (lang)
- last seen: 2026-10-26T21:14:24Z

### L-006 - Record each walk proof on the Walked line when it is done and update its expected counts when the spec changes
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `specs` · harmful: 0
- features: m0-dictionary-spike
- evidence: tasks.md Handoff Walked (C28-C33, C40) (specs)
- last seen: 2026-10-26T21:14:24Z

### L-007 - Give every branch of a lookup table its own fixture case
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `dict-build` · harmful: 0
- features: m1-dictionary-pack
- evidence: tools/dict-build/src/cleanup.ts (C14, CLEAN-01 AC 2) (dict-build)
- last seen: 2026-10-26T23:49:25Z

### L-008 - Prove a no-leak rule over every message the client can receive, including reconnect snapshots
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `server` · harmful: 0
- features: m2-room-server
- evidence: packages/core/src/room/effects.ts:94 (C16, PROTO-01 AC 5) (server)
- last seen: 2026-10-27T20:59:02Z

### L-009 - Test restart recovery with dead sockets, not only with hibernated ones
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `server` · harmful: 0
- features: m2-room-server
- evidence: packages/server/src/room-do.ts:39 (C55, RECON-01 AC 3) (server)
- last seen: 2026-10-27T20:59:02Z

### L-010 - Persist every state field an action changes, not only the record it adds
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `persistence` · harmful: 0
- features: m2-room-server
- evidence: packages/core/src/room/submit.ts (PERSIST-01 AC 1, EXP-01 AC 2) (persistence)
- last seen: 2026-10-27T20:59:02Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
