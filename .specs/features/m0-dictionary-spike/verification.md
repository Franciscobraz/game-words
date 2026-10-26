# M0 Dictionary Spike verification

**Verdict**: FAIL
**Mutations**: 3 - probed C22, C42, C42 (1 survived)
**Proofs**: `proofs.md` at 2dba6a1
**Verifier**: independent sub-agent (author != verifier)

## Mutations injected

| Mutation | Location | Killed |
| --- | --- | --- |
| C22 - draw total ignores the 4-copy cap (capped weight falls to the last letter) | `packages/core/src/generator.ts:37` | yes |
| C42 - warm-up /load counted as a cold sample | `spikes/m0/src/report.ts:108` | yes |
| C42 - cold-load limit <= 500 -> < 500 | `spikes/m0/src/report.ts:142` | no |

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Major - the D3 limits are inclusive (≤) but no test holds a value at the limit; the cold-load bound `<= 500` turned into `< 500` and every test stays green. The same holds for 10 MB, 64 MB, 50 ms and 1 s (C34, C42; D3) | mutation `loadMs <= 500 -> < 500` not killed; `report.test.ts` uses only 8-900 ms, 10/80 ms CPU, 13/1500 ms | in `report.test.ts`, assert PASSA for a value exactly at each D3 limit (500 ms median, 10 MB, 64 MB, 50 ms p95, 1000 ms p95) | 7bb8bbf |
| Major - "Carga a frio" passes with fewer than 5 cold samples: a cold `/load` with status 500 is dropped and the verdict reads "42 ms (mediana de 4)" PASSA (BENCH-01 AC 7) | own example: `evaluate()` with warm-up 200, one cold 500 and four cold 200 -> `Carga a frio PASSA 42 ms (mediana de 4)`; solver and generation already require 100/20 | in `evaluate`, give FALHA (or no measure) unless there are exactly 5 cold samples with status 200 and `loadMs`, and add a test with 4 valid samples | 9cb555c |
| Minor - the memory verdict only looks at the first `/load` (the warm-up); a rejected cold `/load` with no `cf.loadError` gives memory PASSA (BENCH-01 AC 5). `bench-cf.ts` sets `loadError` for any failed `/load`, so today's pipeline is not affected | same own example -> `Memória com o dicionário carregado PASSA 10 MB`; `report.ts:105` `records.find((r) => r.route === '/load')` | mark `loadRejected` when any `/load` has status != 200, and extend C32's test to a rejected cold sample after a good warm-up | 51b7f79 |
| Minor - with fewer than ceil(N²/4) letters of non-zero weight, `drawBoard` picks letter -1 and emits tile "`"; `generateBoard` then throws `Invalid tile "`"` on the first attempt instead of the AC 6 error (GEN-01 AC 2, AC 6). The real dictionary weights all 26 letters | own example: weights only on a, b, size 4 -> `Invalid tile "`": expected a-z or Qu` | in `drawBoard`, throw a clear error when no eligible letter is left (or reject such weights in `generateBoard`), with a test | ff54121 |
| Minor - `classifyForm` discards a decomposed (NFD) form as `non-letter`: "ação" in NFD -> `{ok:false, reason:"non-letter"}`, in NFC -> `acao` (DICT-02 AC 4-5) | own example via `classifyForm('ação'.normalize('NFD'))` | normalize to NFC before the letter checks and add the NFD case to C4/C5's tests | 02d3ea9 |
| Minor - the walk checks have no evidence: the Handoff says `**Walked:** none`, yet `proofs.md` shows C28-C31, C33, C40 as "pass (Walked)" because the script only looks for the line. C29 and C30 also still say 121 records; after E2 `cf.json` has 126 (1 warm-up + 5 cold + 100 + 20) | `tasks.md` Handoff; `cf.json`: 126 records, all `cpuMs` numeric, 6 `/load` with status 200 and `loadMs`; `node.json` `heapUsedMb` 8.3; `stats.json` `peakHeapMb` 242.8 (walked by the Verifier, data agrees except the count); C33 not re-walked (no Cloudflare calls), `cf.json` removal records "This Worker does not exist" | update C29/C30 to the 126 records of BENCH-01 AC 2 + AC 7, walk C28-C31, C33, C40 and record them in `**Walked:**` | |

Note (tooling, not this feature): on Windows `mutate.py` fails with `module 'signal' has no attribute 'SIGHUP'`; the mutations above ran with a shim that maps SIGHUP to SIGTERM. `check_proofs.py --mutations` will need the same shim.
