# M1 Dictionary Pack verification

**Verdict**: FAIL
**Mutations**: 3 - probed C14, C25, C56
**Proofs**: `proofs.md` at 8366dd6 (HEAD a2f82a8 only adds docs)
**Verifier**: independent sub-agent (author != verifier)

## Mutations injected

| Mutation | Location | Killed |
| --- | --- | --- |
| C14: enclitic infinitive fragments only for -ar (drop -er -> ê and -or -> ô) | `tools/dict-build/src/cleanup.ts:56` | no |
| C25: straight-line profanity scanned in one direction only (reverse directions removed) | `packages/core/src/generator.ts:78` | yes |
| C56: solutions memo ignores the profanity filter (stale on toggle) | `tools/play/src/main.tsx:60` | yes |

## Own examples

- Real pack (`tools/dict-build/dist/pt-BR`): 20 6x6 boards (seeds 1000-1019) all have a common longest word; 200 4x4 boards (seeds 5000-5199) all reach `minCommonWords[4]` = 51; `spellings("role")` = `["role", "rolé", "rolê"]`; "comemo", "vendemo", "fazemo", "compo" are not words while "compoe" and "pode" are - the real build drops the -er/-or fragments today.
- `validateSubmission` with a 2-tile path `Qu` + `e` ("que", 3 letters): accepted with minimum 3, `too-short` with minimum 4 - length is counted in letters, not tiles.
- `scoreRound` on an empty round gives no totals; a lone player gets double points.

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| The enclitic cleanup of -er and -or infinitives ("comê-lo" -> "comê", "compô-lo" -> "compô") can be removed and no test fails (CLEAN-01 AC 2) | mutation `ACCENTED { ar, er, or } -> { ar }` not killed; `fixtures/enclitic.aff` has only `SFX a ar á ar` | add `SFX a er ê er` and `SFX a or ô or` rules and an -er and an -or verb to `enclitic.aff`/`.dic`, and assert in C14 that their fragments are dropped and counted in `report.enclitic` | 3ca2ec3 |
