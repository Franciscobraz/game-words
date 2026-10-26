# m0-dictionary-spike proofs

**HEAD**: c55c9af
**Tree**: clean
**Result**: 48 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run tools/dict-build/src/fetch.test.ts -t "downloads from the pinned commit"` | 1 | 1 | pass |
| C2 | `npx vitest run tools/dict-build/src/unmunch.test.ts -t "expands fixture forms"` | 1 | 1 | pass |
| C3 | `npx vitest run packages/core/src/lang/ptBR.test.ts -t "discards uppercase forms"` | 1 | 1 | pass |
| C4 | `npx vitest run packages/core/src/lang/ptBR.test.ts -t "discards non-letter forms"` | 1 | 1 | pass |
| C5 | `npx vitest run packages/core/src/lang/ptBR.test.ts -t "strips diacritics and cedilla"` | 1 | 1 | pass |
| C6 | `npx vitest run packages/core/src/lang/ptBR.test.ts -t "discards length outside 3-16"` | 1 | 1 | pass |
| C7 | `npx vitest run tools/dict-build/src/build.test.ts -t "stores duplicate normalized words once"` | 1 | 1 | pass |
| C8 | `npx vitest run tools/dict-build/src/build.test.ts -t "writes bin and stats with per-filter counts"` | 1 | 1 | pass |
| C9 | `npx vitest run tools/dict-build/src/build.test.ts -t "is byte-identical across runs"` | 1 | 1 | pass |
| C10 | `npx vitest run tools/dict-build/src/fetch.test.ts -t "fails naming the file that did not download"` | 1 | 1 | pass |
| C11 | `npx vitest run tools/dict-build/src/unmunch.test.ts -t "fails naming unmunch when missing"` | 1 | 1 | pass |
| C12 | `npx vitest run packages/core/src/dawg.test.ts -t "has returns true for every stored word"` | 1 | 1 | pass |
| C13 | `npx vitest run packages/core/src/dawg.test.ts -t "has returns false for unknown words"` | 1 | 1 | pass |
| C14 | `npx vitest run packages/core/src/dawg.test.ts -t "hasPrefix matches stored prefixes only"` | 1 | 1 | pass |
| C15 | `npx vitest run packages/core/src/dawg.test.ts -t "rejects a buffer with a bad header"` | 1 | 1 | pass |
| C16 | `npx vitest run packages/core/src/solver.test.ts -t "finds exactly the expected words"` | 1 | 1 | pass |
| C17 | `npx vitest run packages/core/src/solver.test.ts -t "never reuses a tile"` | 1 | 1 | pass |
| C18 | `npx vitest run packages/core/src/solver.test.ts -t "treats Qu as qu"` | 1 | 1 | pass |
| C19 | `npx vitest run packages/core/src/solver.test.ts -t "drops words below the minimum length"` | 1 | 1 | pass |
| C20 | `npx vitest run packages/core/src/solver.test.ts -t "rejects invalid boards"` | 1 | 1 | pass |
| C21 | `npx vitest run packages/core/src/solver.test.ts -t "uses distinct tiles with the same letter"` | 1 | 1 | pass |
| C22 | `npx vitest run packages/core/src/generator.test.ts -t "weights letters by dictionary frequency"` | 1 | 1 | pass |
| C23 | `npx vitest run packages/core/src/generator.test.ts -t "caps copies of a letter at 4"` | 1 | 1 | pass |
| C24 | `npx vitest run packages/core/src/generator.test.ts -t "emits Q only as Qu"` | 1 | 1 | pass |
| C25 | `npx vitest run packages/core/src/generator.test.ts -t "meets the minimum word count per size"` | 1 | 1 | pass |
| C26 | `npx vitest run packages/core/src/generator.test.ts -t "returns the same board for the same seed"` | 1 | 1 | pass |
| C27 | `npx vitest run packages/core/src/generator.test.ts -t "throws after 200 attempts"` | 1 | 1 | pass |
| C28 | `walk - spikes/m0/results/cf.json mostra o registro /load com loadMs e status 200` | - | - | pass (Walked) |
| C29 | `walk - spikes/m0/results/cf.json tem 126 registros com rota e semente` | - | - | pass (Walked) |
| C30 | `walk - todos os 126 registros de cf.json têm cpuMs numérico` | - | - | pass (Walked) |
| C31 | `walk - spikes/m0/results/node.json tem heapUsedMb` | - | - | pass (Walked) |
| C32 | `npx vitest run spikes/m0/src/report.test.ts -t "marks memory as FAIL when the load was rejected"` | 1 | 1 | pass |
| C33 | `walk - npx wrangler deployments list --name bwords-m0-spike responde que o Worker não existe` | - | - | pass (Walked) |
| C34 | `npx vitest run spikes/m0/src/report.test.ts -t "lists every D3 criterion with value, limit and verdict"` | 1 | 1 | pass |
| C35 | `npx vitest run spikes/m0/src/report.test.ts -t "includes per-filter counts"` | 1 | 1 | pass |
| C36 | `npx vitest run spikes/m0/src/report.test.ts -t "includes 50 accepted and 50 discarded samples"` | 1 | 1 | pass |
| C37 | `npx vitest run spikes/m0/src/report.test.ts -t "recommends a plan B for each failed criterion"` | 1 | 1 | pass |
| C38 | `npx vitest run spikes/m0/src/report.test.ts -t "records the VERO commit and the worker removal"` | 1 | 1 | pass |
| C39 | `npx vitest run tools/dict-build/src/unmunch.test.ts -t "decodes per the aff SET encoding"` | 1 | 1 | pass |
| C40 | `walk - pt-BR.stats.json registra peakHeapMb < 1024` | - | - | pass (Walked) |
| C41 | `npx vitest run tools/dict-build/src/flags.test.ts -t "keeps utf-8 flags that share a first byte apart"` | 1 | 1 | pass |
| C42 | `npx vitest run spikes/m0/src/report.test.ts -t "uses the median of five cold loads"` | 1 | 1 | pass |
| C43 | `npx vitest run spikes/m0/src/report.test.ts -t "passes every D3 criterion with a value exactly at the limit"` | 1 | 1 | pass |
| C44 | `npx vitest run spikes/m0/src/report.test.ts -t "fails the cold load without five valid cold samples"` | 1 | 1 | pass |
| C45 | `npx vitest run packages/core/src/lang/ptBR.test.ts -t "classifies decomposed"` | 1 | 1 | pass |
| C46 | `npx vitest run packages/core/src/generator.test.ts -t "throws a clear error when the weights leave too few let` | 1 | 1 | pass |
| Build | `npx tsc -b` | - | - | pass |
| Build | `npx vitest run` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| C22 - draw total ignores the 4-copy cap (capped weight falls to the last letter) | `packages\core\src\generator.ts:37` | yes |
| C42 - warm-up /load counted as a cold sample | `spikes\m0\src\report.ts:108` | yes |
| C42 - cold-load limit <= 500 -> < 500 | `spikes\m0\src\report.ts:145` | yes |
