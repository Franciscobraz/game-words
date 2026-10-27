# m1-dictionary-pack proofs

**HEAD**: fe7ee0f
**Tree**: clean
**Result**: 64 pass, 0 fail; mutations 3 killed, 0 not

| Check | Proof | Ran | Passed | Result |
| --- | --- | --- | --- | --- |
| C1 | `npx vitest run tools/dict-build/src/build.test.ts -t "writes every pack file"` | 1 | 1 | pass |
| C2 | `npx vitest run tools/dict-build/src/pack.test.ts -t "reads every pack field"` | 1 | 1 | pass |
| C3 | `npx vitest run tools/dict-build/src/pack.test.ts -t "fails naming a missing field"` | 1 | 1 | pass |
| C4 | `npx vitest run tools/dict-build/src/build.test.ts -t "is byte-identical across runs"` | 1 | 1 | pass |
| C5 | `npx vitest run tools/dict-build/src/pack.test.ts -t "NOTICE attributes the data sources"` | 1 | 1 | pass |
| C6 | `npx vitest run tools/dict-build/src/lists.test.ts -t "ignores comments and blank lines"` | 1 | 1 | pass |
| C7 | `npx vitest run tools/dict-build/src/build.test.ts -t "adds extra words to the dictionary"` | 1 | 1 | pass |
| C8 | `npx vitest run tools/dict-build/src/build.test.ts -t "keeps extra spellings for display"` | 1 | 1 | pass |
| C9 | `npx vitest run tools/dict-build/src/lists.test.ts -t "fails on an extra word that breaks a filter"` | 1 | 1 | pass |
| C10 | `npx vitest run tools/dict-build/src/build.test.ts -t "removes blocklisted words with their spellings"` | 1 | 1 | pass |
| C11 | `npx vitest run tools/dict-build/src/lists.test.ts -t "fails on a word in both lists"` | 1 | 1 | pass |
| C12 | `npx vitest run tools/dict-build/src/build.test.ts -t "counts extra and blocklist changes"` | 1 | 1 | pass |
| C13 | `npx vitest run tools/dict-build/src/cleanup.test.ts -t "drops forbidden words"` | 1 | 1 | pass |
| C14 | `npx vitest run tools/dict-build/src/cleanup.test.ts -t "drops enclitic-only forms"` | 1 | 1 | pass |
| C15 | `npx vitest run tools/dict-build/src/build.test.ts -t "reports each cleanup with examples"` | 1 | 1 | pass |
| C16 | `npx vitest run tools/dict-build/src/frequency.test.ts -t "marks the top forms as common"` | 1 | 1 | pass |
| C17 | `npx vitest run tools/dict-build/src/frequency.test.ts -t "sums colliding forms before ranking"` | 1 | 1 | pass |
| C18 | `npx vitest run tools/dict-build/src/frequency.test.ts -t "ignores forms outside the dictionary"` | 1 | 1 | pass |
| C19 | `npx vitest run packages/core/src/pack.test.ts -t "isCommon matches the common set"` | 1 | 1 | pass |
| C20 | `npx vitest run tools/dict-build/src/build.test.ts -t "marks profanity without removing it"` | 1 | 1 | pass |
| C21 | `npx vitest run packages/core/src/pack.test.ts -t "isProfane matches the profanity set"` | 1 | 1 | pass |
| C22 | `npx vitest run tools/dict-build/src/build.test.ts -t "fails on profanity outside the dictionary"` | 1 | 1 | pass |
| C23 | `npx vitest run packages/core/src/validate.test.ts -t "rejects profanity while the filter is on"` | 1 | 1 | pass |
| C24 | `npx vitest run packages/core/src/validate.test.ts -t "accepts profanity while the filter is off"` | 1 | 1 | pass |
| C25 | `npx vitest run packages/core/src/generator.test.ts -t "rejects boards with straight-line profanity"` | 1 | 1 | pass |
| C26 | `npx vitest run tools/dict-build/src/pack.test.ts -t "ships pt-BR with an empty profanity list"` | 1 | 1 | pass |
| C27 | `npx vitest run packages/core/src/spellings.test.ts -t "keeps every distinct spelling sorted"` | 1 | 1 | pass |
| C28 | `npx vitest run packages/core/src/spellings.test.ts -t "returns stored spellings"` | 1 | 1 | pass |
| C29 | `npx vitest run packages/core/src/spellings.test.ts -t "falls back to the word itself"` | 1 | 1 | pass |
| C30 | `npx vitest run tools/dict-build/src/build.test.ts -t "reports spellings size"` | 1 | 1 | pass |
| C31 | `npx vitest run packages/core/src/validate.test.ts -t "accepts a valid path"` | 1 | 1 | pass |
| C32 | `npx vitest run packages/core/src/validate.test.ts -t "rejects an invalid path"` | 1 | 1 | pass |
| C33 | `npx vitest run packages/core/src/validate.test.ts -t "rejects a word below the minimum"` | 1 | 1 | pass |
| C34 | `npx vitest run packages/core/src/validate.test.ts -t "rejects a non-word"` | 1 | 1 | pass |
| C35 | `npx vitest run packages/core/src/validate.test.ts -t "rejects a word already found"` | 1 | 1 | pass |
| C36 | `npx vitest run packages/core/src/scoring.test.ts -t "scores by normalized length"` | 1 | 1 | pass |
| C37 | `npx vitest run packages/core/src/scoring.test.ts -t "doubles unique words"` | 1 | 1 | pass |
| C38 | `npx vitest run packages/core/src/scoring.test.ts -t "scores shared words once each and lists them"` | 1 | 1 | pass |
| C39 | `npx vitest run packages/core/src/scoring.test.ts -t "never deducts for rejected submissions"` | 1 | 1 | pass |
| C40 | `npx vitest run packages/core/src/longest.test.ts -t "picks the longest common word"` | 1 | 1 | pass |
| C41 | `npx vitest run packages/core/src/longest.test.ts -t "prefers a word someone found"` | 1 | 1 | pass |
| C42 | `npx vitest run packages/core/src/longest.test.ts -t "breaks remaining ties alphabetically"` | 1 | 1 | pass |
| C43 | `npx vitest run packages/core/src/longest.test.ts -t "falls back to all solutions"` | 1 | 1 | pass |
| C44 | `npx vitest run packages/core/src/longest.test.ts -t "names the players who found it"` | 1 | 1 | pass |
| C45 | `npx vitest run tools/dict-build/src/calibrate.test.ts -t "stores the 10th percentile as the minimum"` | 1 | 1 | pass |
| C46 | `npx vitest run packages/core/src/generator.test.ts -t "meets the common-word minimum"` | 1 | 1 | pass |
| C47 | `npx vitest run tools/dict-build/src/calibrate.test.ts -t "reports the common-word distribution"` | 1 | 1 | pass |
| C48 | `npx vitest run packages/core/src/generator.test.ts -t "throws after 200 attempts"` | 2 | 2 | pass |
| C49 | `npx playwright test tools/play/e2e/play.spec.ts -g "serves the page with the pack loaded"` | 1 | - | pass |
| C50 | `npx playwright test tools/play/e2e/play.spec.ts -g "shows the board for the chosen seed"` | 1 | - | pass |
| C51 | `npx playwright test tools/play/e2e/play.spec.ts -g "submits the dragged path on release"` | 1 | - | pass |
| C52 | `npx playwright test tools/play/e2e/play.spec.ts -g "lists an accepted word with spelling and points"` | 1 | - | pass |
| C53 | `npx playwright test tools/play/e2e/play.spec.ts -g "shows the rejection reason"` | 1 | - | pass |
| C54 | `npx playwright test tools/play/e2e/play.spec.ts -g "shows solutions with common words and the longest"` | 1 | - | pass |
| C55 | `npx playwright test tools/play/e2e/play.spec.ts -g "shows the board stats"` | 1 | - | pass |
| C56 | `npx playwright test tools/play/e2e/play.spec.ts -g "recomputes on option change"` | 1 | - | pass |
| C57 | `npx playwright test tools/play/e2e/play.spec.ts -g "shows loading and disables the board"` | 1 | - | pass |
| C58 | `npx playwright test tools/play/e2e/play.spec.ts -g "shows the load error"` | 1 | - | pass |
| C59 | `npx vitest run packages/core/src/validate.test.ts -t "treats a profane common word as invalid while filtering"` | 1 | 1 | pass |
| C60 | `npx vitest run packages/core/src/scoring.test.ts -t "counts both letters of Qu"` | 1 | 1 | pass |
| C61 | `npx vitest run packages/core/src/validate.test.ts -t "rejects an empty or single-tile path"` | 1 | 1 | pass |
| Build | `npx tsc -b` | - | - | pass |
| Build | `npx vitest run` | - | - | pass |
| Build | `npx playwright test` | - | - | pass |

## Mutations

| Mutation | Location | Killed |
| --- | --- | --- |
| C14: enclitic infinitive fragments only for -ar (drop -er -> ê and -or -> ô) | `tools\dict-build\src\cleanup.ts:56` | yes |
| C25: straight-line profanity scanned in one direction only (reverse directions removed) | `packages\core\src\generator.ts:78` | yes |
| C56: solutions memo ignores the profanity filter (stale on toggle) | `tools\play\src\main.tsx:60` | yes |
