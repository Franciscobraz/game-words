# M1 Dictionary Pack and Game Rules Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline - decisões de arquitetura abaixo, sem `design.md`
**Status**: Approved
**Approved**: 2026-10-26 - user: "execute cada fase, pare, me mostre o resultado e me pergunte antes de executar a proxima fase"
**Mutations**: 3
**Build**: `npx tsc -b; npx vitest run; npx playwright test`

### Inline design

- **Pacote de entrada (`languages/pt-BR/`):** contém `pack.json`, `extra.txt`, `blocklist.txt` e `profanity.txt` (vazio). O `pack.json` define:
  - `id`, `name`, `alphabet` e `compoundTiles` (`[{ "tile": "Qu", "letters": "qu" }]`);
  - `normalization` (`"strip-diacritics"`) e `minWordLength`;
  - `sources.vero` (repo, commit, dic, aff) e `sources.frequency` (url fixada no commit `525f9b5…`, `top: 50000`).

  O `tools/dict-build/source.json` some e o conteúdo dele vai para o `pack.json`.
- **Saída (`tools/dict-build/dist/<id>/`):** é o `dist/pt-BR/` da spec.
  - `dict.bin`: DAWG de todas as palavras válidas, no formato v1 do M0 sem mudanças.
  - `common.bin`: DAWG das palavras comuns.
  - `profanity.bin`: DAWG dos palavrões, que pode ter zero palavras.
  - `spellings.bin`: ver abaixo.
  - `meta.json`: id, pesos de letra, `minCommonWords` por tamanho e hashes dos arquivos.
  - `stats.json`: contagens, exemplos, tamanhos e tempos.
- **Formato de `spellings.bin`:** linhas ordenadas pela chave normalizada, no formato `chave\tedições`. As edições ficam em notação compacta, posição seguida do caractere (`faca` → `2ç`). Várias grafias são separadas por `|`, e a grafia sem acento também conta quando existe no VERO (`faca` → `|2ç`). Os blocos de 64 linhas usam front coding, e um índice com a primeira chave de cada bloco permite busca binária. O leitor consulta o `ArrayBuffer` direto.
- **Core (`packages/core/src`):**
  - `pack.ts`: `LanguagePack.fromBuffers(...)`, com `isWord`, `isCommon`, `isProfane`, `spellings` e `meta`.
  - `validate.ts`: `validateSubmission(board, path, ctx)`, onde o `ctx` traz soluções, palavras já encontradas, tamanho mínimo, filtro e pacote.
  - `scoring.ts`: `wordPoints` e `scoreRound(found: Map<player, Set<word>>)`, que devolve totais, únicas e em comum.
  - `longest.ts`: `pickLongestWord`.
  - `generator.ts`: passa a receber o pacote e as opções (`minCommonWords`, `filterProfanity`).
- **Limpeza do VERO (`tools/dict-build/src/cleanup.ts`):**
  - Lê a flag `FORBIDDENWORD` do `.aff` e exclui as raízes marcadas com ela.
  - A regra das formas de ênclise e mesóclise sai da investigação no T3. O teste usa uma fixture que reproduz o caso "enfronhamo".
- **Página solo (`tools/play`):** Vite + Preact, servindo `tools/dict-build/dist/pt-BR` como estático. O core roda no navegador, e o Playwright cobre as interações.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/DESIGN.md` §7 (Vitest no core, Playwright para E2E); testes existentes em `packages/core/src/*.test.ts` e `tools/dict-build/src/*.test.ts` (Vitest, fixtures `.dic`/`.aff` escritas à mão).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Core domain (`pack`, `spellings`, `validate`, `scoring`, `longest`, `generator`) | unit | All branches; 1:1 to spec ACs; every listed edge case has a test | `packages/core/src/**/*.test.ts` | `npx vitest run packages/core` |
| Dict build tool (`pack`, `lists`, `cleanup`, `frequency`, `build`, `calibrate`) | integration | Happy path + every edge case + error path, com fixtures e o `unmunch` real | `tools/dict-build/src/**/*.test.ts` | `npx vitest run tools/dict-build` |
| Página solo (`tools/play`) | e2e | Cada AC do PLAY-01 com o gesto que ele nomeia, contra um pacote de fixture | `tools/play/e2e/*.spec.ts` | `npx playwright test` |
| Config, `pack.json`, `NOTICE` | none | - (build gate only, salvo onde um AC exige teste) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `npx vitest run packages/core` |
| Full | After tasks with integration tests | `npx vitest run` |
| E2E | After tasks with e2e tests (Phase 4) | `npx vitest run; npx playwright test` |
| Build | After phase completion or config-only tasks | `npx tsc -b; npx vitest run` (Phases 1-3); `npx tsc -b; npx vitest run; npx playwright test` (Phase 4, depois que o T13 instala o Playwright) |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Pack inputs

```
T1 → T2 → T3 → T4
```

### Phase 2: Core rules

```
T5 → T6 → T7 → T8 → T9 → T10
```

### Phase 3: Pack build

```
T11 → T12
```

### Phase 4: Solo play page

```
T13 → T14 → T15
```

---

## Task Breakdown

#### Phase 1: Pack inputs

### T1: `pack.json` e leitor do pacote

**What**: Criar `languages/pt-BR/pack.json`, os três `.txt` (`profanity.txt` vazio), o `NOTICE` na raiz e `loadPackConfig(dir)`, que valida os campos obrigatórios. O `source.json` migra para o `pack.json` e é removido.
**Where**: `tools/dict-build/src/pack.ts`
**Depends on**: None
**Reuses**: `SourceSpec` de `fetch.ts`
**Requirement**: PACK-01, PROF-01

**Done when**:

- [x] Testes cobrem PACK-01 AC 2, 3 e 5, e PROF-01 AC 7
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 40 + 4 = 44 tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

**Commit**: `feat(dict-build): language pack config`

**Status**: ✅ Complete

---

### T2: Leitura das listas `.txt`

**What**: Implementar `readWordList(path)` (ignora `#` e linhas em branco, preserva a linha de origem) e `applyLists(...)`, que valida o `extra.txt` com os filtros e detecta conflito entre extra e blocklist.
**Where**: `tools/dict-build/src/lists.ts`
**Depends on**: T1
**Reuses**: `classifyForm` do core
**Requirement**: LIST-01

**Done when**:

- [x] Testes cobrem LIST-01 AC 1, 4 e 6
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 47 tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

**Commit**: `feat(dict-build): extra and blocklist word lists`

**Status**: ✅ Complete

---

### T3: Limpeza do VERO

**What**: Investigar quais regras do VERO produzem formas como "enfronhamo" e implementar `cleanupVero(...)`, que exclui as entradas `FORBIDDENWORD` e as formas que só existem como pedaço de ênclise ou mesóclise, contando e exemplificando cada remoção.
**Where**: `tools/dict-build/src/cleanup.ts`
**Depends on**: T2
**Reuses**: `flags.ts` e `unmunch.ts`
**Requirement**: CLEAN-01

**Done when**:

- [x] A regra encontrada está descrita num comentário no topo do arquivo, citando a regra do `.aff`
- [x] Fixture que reproduz o caso "enfronhamo" e uma entrada `FORBIDDENWORD`
- [x] Testes cobrem CLEAN-01 AC 1 e 2
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 49 tests pass (no silent deletions)

**Tests**: integration
**Gate**: full

**Commit**: `feat(dict-build): drop forbidden and enclitic-only vero forms`

**Status**: ✅ Complete

---

### T4: Lista de frequência

**What**: Implementar `loadCommonWords(source, dictionary)`, que baixa a FrequencyWords no commit fixado, normaliza, soma as contagens que colidem, ordena e devolve as palavras do dicionário entre as top 50.000.
**Where**: `tools/dict-build/src/frequency.ts`
**Depends on**: T3
**Reuses**: `fetch.ts`, `classifyForm`
**Requirement**: FREQ-01

**Done when**:

- [x] Testes cobrem FREQ-01 AC 1 a 3, com `fetch` substituído
- [x] Gate check passes: `npx tsc -b; npx vitest run`
- [x] Test count: 52 tests pass (no silent deletions)

**Tests**: integration
**Gate**: build

**Commit**: `feat(dict-build): common words from frequency list`

**Status**: ✅ Complete

---

#### Phase 2: Core rules

### T5: Formato do mapa de grafias

**What**: Implementar `buildSpellings(entries)` → `ArrayBuffer` e `Spellings.fromBuffer(buf).get(word)`, no formato do inline design.
**Where**: `packages/core/src/spellings.ts`
**Depends on**: T4
**Reuses**: nada
**Requirement**: SPELL-01

**Done when**:

- [x] Testes cobrem SPELL-01 AC 1 (ordem e distinção), 2 e 3
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 55 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): compact display spellings map`

**Status**: ✅ Complete

---

### T6: `LanguagePack`

**What**: Implementar `LanguagePack.fromBuffers({ dict, common, profanity, spellings, meta })`, com `isWord`, `isCommon`, `isProfane`, `spellings` e `meta`.
**Where**: `packages/core/src/pack.ts`
**Depends on**: T5
**Reuses**: `Dawg`, `Spellings`
**Requirement**: FREQ-01, PROF-01

**Done when**:

- [x] Testes cobrem FREQ-01 AC 4 e PROF-01 AC 2
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 57 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): language pack loader`

**Status**: ✅ Complete

---

### T7: Validação de envios

**What**: Implementar `validateSubmission(board, path, ctx)`, que devolve a palavra aceita ou o motivo (`invalid-path`, `too-short`, `not-a-word`, `already-found`) e aplica o filtro de palavrões.
**Where**: `packages/core/src/validate.ts`
**Depends on**: T6
**Reuses**: `boardTiles`, `solve`, `LanguagePack`
**Requirement**: SCORE-01, PROF-01

**Done when**:

- [x] Testes cobrem SCORE-01 AC 1 a 5, PROF-01 AC 4 e 5 e os edge cases de caminho vazio/peça única e de comum + palavrão
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 66 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): submission validation`

**Status**: ✅ Complete

---

### T8: Pontuação

**What**: Implementar `wordPoints(word)` e `scoreRound(found)`, com palavras únicas valendo o dobro, palavras em comum listadas e sem desconto por rejeição.
**Where**: `packages/core/src/scoring.ts`
**Depends on**: T7
**Reuses**: nada
**Requirement**: SCORE-01

**Done when**:

- [x] Testes cobrem SCORE-01 AC 6 a 9 e o edge case do "Qu"
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 71 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): round scoring`

**Status**: ✅ Complete

---

### T9: Maior palavra possível

**What**: Implementar `pickLongestWord(solutions, pack, found, filter)`, que escolhe entre as comuns, aplica os desempates e o recurso de quando não há comuns, e informa quem encontrou.
**Where**: `packages/core/src/longest.ts`
**Depends on**: T8
**Reuses**: `LanguagePack`
**Requirement**: LONG-01

**Done when**:

- [x] Testes cobrem LONG-01 AC 1 a 5
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 76 tests pass (no silent deletions)

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): longest word pick`

**Status**: ✅ Complete

---

### T10: Gerador com mínimo de comuns e filtro de palavrões

**What**: Mudar `generateBoard` para receber o pacote e as opções, rejeitar tabuleiros abaixo de `minCommonWords[size]` e, com o filtro ligado, rejeitar palavrões de 4+ letras em linha reta.
**Where**: `packages/core/src/generator.ts`
**Depends on**: T9
**Reuses**: `solve`, `LanguagePack`
**Requirement**: CAL-01, PROF-01

**Done when**:

- [x] Os testes existentes do gerador continuam passando, adaptados só na assinatura, sem enfraquecer nenhuma asserção
- [x] Testes novos cobrem CAL-01 AC 2 e 4 e PROF-01 AC 6
- [x] Gate check passes: `npx tsc -b; npx vitest run`
- [x] Test count: 79 tests pass (no silent deletions)

**Tests**: unit
**Gate**: build

**Commit**: `feat(core): common-word minimum and profanity-safe generator`

**Status**: ✅ Complete

---

#### Phase 3: Pack build

### T11: Pipeline de build do pacote

**What**: Reescrever `buildDictionary` como `buildPack(id)`. O pipeline segue esta ordem: config → VERO (com a limpeza) → `extra`/`blocklist` → dicionário, mapa de grafias, comuns e palavrões → gravação dos arquivos de `dist/<id>/` e do `stats.json`, com saída determinística. O comando é `npm run dict:build -- pt-BR`.
**Where**: `tools/dict-build/src/build.ts`
**Depends on**: T10
**Reuses**: T1 a T6
**Requirement**: PACK-01, LIST-01, CLEAN-01, PROF-01, SPELL-01

**Done when**:

- [x] Testes cobrem PACK-01 AC 1 e 4, LIST-01 AC 2, 3, 5 e 7, CLEAN-01 AC 3, PROF-01 AC 1 e 3 e SPELL-01 AC 4, sobre fixtures
- [x] Os testes do M0 que dependiam do `source.json` e da saída antiga são adaptados sem enfraquecer nenhuma asserção
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 89 tests pass (no silent deletions) - 88 de fato: o teste do C4 ("is byte-identical across runs") já existia no M0 e foi adaptado, então o T11 soma 9 testes novos, não 10

**Tests**: integration
**Gate**: full

**Commit**: `feat(dict-build): build language pack end to end`

**Status**: ✅ Complete

---

### T12: Calibração no build

**What**: Implementar `calibrate(pack)`, que sorteia 1.000 tabuleiros por tamanho com sementes fixas, grava `minCommonWords` (percentil 10) no `meta.json` e min/mediana/máx no `stats.json`, e rodar o build real do pt-BR.
**Where**: `tools/dict-build/src/calibrate.ts`
**Depends on**: T11
**Reuses**: `generateBoard`, `solve`, `LanguagePack`
**Requirement**: CAL-01

**Done when**:

- [x] Testes cobrem CAL-01 AC 1 e 3
- [x] `npm run dict:build -- pt-BR` real gera `tools/dict-build/dist/pt-BR/`
- [x] No pacote real, "esta", "cre", "vamos", "deem", "por", "faca", "enfronhamos" e "cantavamos" são válidas, e "enfronhamo" não é (conferência da limpeza do T3; "va" e "de" saíram da lista por terem menos de 3 letras, o mínimo do jogo)
- [x] Gate check passes: `npx tsc -b; npx vitest run`
- [x] Test count: 90 tests pass (no silent deletions) - 91 previstos; o C4 adaptou um teste do M0 em vez de criar um novo

**Tests**: integration
**Gate**: build

**Status**: ✅ Complete

**Commit**: `feat(dict-build): calibrate board minimums`

---

#### Phase 4: Solo play page

### T13: Base da página solo

**What**: Criar `tools/play` com Vite, Preact e Playwright: `npm run play` em `:5173`, carga do pacote com os estados "Carregando dicionário…" e de erro.
**Where**: `tools/play/src/main.tsx`
**Depends on**: T12
**Reuses**: `LanguagePack`
**Requirement**: PLAY-01

**Done when**:

- [x] Pacote de fixture pequeno para os testes E2E em `tools/play/e2e/fixtures/`
- [x] Testes cobrem PLAY-01 AC 1, 9 e 10
- [x] Gate check passes: `npx vitest run; npx playwright test`
- [x] Test count: 91 vitest + 3 playwright tests pass (no silent deletions) - 90 vitest de fato, a mesma contagem do T12 (o C4 adaptou um teste do M0)

**Tests**: e2e
**Gate**: e2e

**Commit**: `feat(play): solo page shell with pack loading`

**Status**: ✅ Complete

---

### T14: Tabuleiro e envio por arrasto

**What**: Implementar o componente do tabuleiro com novo tabuleiro por tamanho e semente, arrasto por mouse ou toque, envio ao soltar, lista de palavras com grafia e pontos, total e motivo de rejeição.
**Where**: `tools/play/src/Board.tsx`
**Depends on**: T13
**Reuses**: `generateBoard`, `validateSubmission`, `wordPoints`
**Requirement**: PLAY-01

**Done when**:

- [x] Testes cobrem PLAY-01 AC 2 a 5
- [x] Gate check passes: `npx vitest run; npx playwright test`
- [x] Test count: 91 vitest + 7 playwright tests pass (no silent deletions) - 90 vitest de fato, como no T13

**Tests**: e2e
**Gate**: e2e

**Commit**: `feat(play): board with drag-to-submit`

**Status**: ✅ Complete

---

### T15: Soluções, estatísticas e opções

**What**: Implementar o painel "Mostrar soluções" (comuns destacadas, maior palavra), as estatísticas (soluções, comuns, mínimo do `meta.json`) e as opções de tamanho mínimo e filtro, que recalculam tudo.
**Where**: `tools/play/src/Solutions.tsx`
**Depends on**: T14
**Reuses**: `solve`, `pickLongestWord`, `LanguagePack`
**Requirement**: PLAY-01

**Done when**:

- [ ] Testes cobrem PLAY-01 AC 6 a 8
- [ ] Gate check passes: `npx tsc -b; npx vitest run; npx playwright test`
- [ ] Test count: 91 vitest + 10 playwright tests pass (no silent deletions)

**Tests**: e2e
**Gate**: build

**Commit**: `feat(play): solutions panel, stats and options`

---

## Checks

**C1** - `npm run dict:build -- pt-BR` grava `dict.bin`, `common.bin`, `profanity.bin`, `spellings.bin`, `meta.json` e `stats.json` em `dist/<id>/` (PACK-01, AC 1)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "writes every pack file"`

**C2** - `loadPackConfig` lê alfabeto, peças compostas, normalização, tamanho mínimo e as duas fontes fixadas (PACK-01, AC 2)
Proof: `npx vitest run tools/dict-build/src/pack.test.ts -t "reads every pack field"`

**C3** - Um `pack.json` sem `sources.vero.commit` encerra com erro que nomeia o campo (PACK-01, AC 3)
Proof: `npx vitest run tools/dict-build/src/pack.test.ts -t "fails naming a missing field"`

**C4** - Dois builds sobre as mesmas entradas têm o mesmo SHA-256 em todos os arquivos de `dist/<id>/`, exceto os tempos do `stats.json` (PACK-01, AC 4)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "is byte-identical across runs"`

**C5** - O `NOTICE` atribui a FrequencyWords (CC-BY-SA 4.0, Hermit Dave, OpenSubtitles 2018) e o VERO (LGPLv3/MPL) (PACK-01, AC 5)
Proof: `npx vitest run tools/dict-build/src/pack.test.ts -t "NOTICE attributes the data sources"`

**C6** - Linhas com `#` e linhas em branco são ignoradas (LIST-01, AC 1)
Proof: `npx vitest run tools/dict-build/src/lists.test.ts -t "ignores comments and blank lines"`

**C7** - "rolê" no `extra.txt` torna "role" válida no dicionário (LIST-01, AC 2)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "adds extra words to the dictionary"`

**C8** - "rolê" no `extra.txt` vai para o mapa de grafias de "role" (LIST-01, AC 3)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "keeps extra spellings for display"`

**C9** - "ab" no `extra.txt` encerra com erro que traz a palavra, a linha e o motivo `length` (LIST-01, AC 4)
Proof: `npx vitest run tools/dict-build/src/lists.test.ts -t "fails on an extra word that breaks a filter"`

**C10** - Uma palavra na `blocklist.txt` some do dicionário e do mapa de grafias (LIST-01, AC 5)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "removes blocklisted words with their spellings"`

**C11** - A mesma forma normalizada no `extra.txt` e na `blocklist.txt` encerra com erro que traz a palavra e as duas linhas (LIST-01, AC 6)
Proof: `npx vitest run tools/dict-build/src/lists.test.ts -t "fails on a word in both lists"`

**C12** - O `stats.json` registra as palavras acrescentadas e removidas pelas listas (LIST-01, AC 7)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "counts extra and blocklist changes"`

**C13** - Uma entrada com a flag `FORBIDDENWORD` não entra no dicionário (CLEAN-01, AC 1)
Proof: `npx vitest run tools/dict-build/src/cleanup.test.ts -t "drops forbidden words"`

**C14** - Uma forma só de ênclise, como "enfronhamo" na fixture, não entra; "enfronhamos" entra (CLEAN-01, AC 2)
Proof: `npx vitest run tools/dict-build/src/cleanup.test.ts -t "drops enclitic-only forms"`

**C15** - O `stats.json` traz a contagem e até 20 exemplos de cada limpeza (CLEAN-01, AC 3)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "reports each cleanup with examples"`

**C16** - Com um corte de 3, só as 3 formas mais frequentes que estão no dicionário são comuns (FREQ-01, AC 1)
Proof: `npx vitest run tools/dict-build/src/frequency.test.ts -t "marks the top forms as common"`

**C17** - "faca 10" e "faça 5" somam 15 para "faca" antes do ranking (FREQ-01, AC 2)
Proof: `npx vitest run tools/dict-build/src/frequency.test.ts -t "sums colliding forms before ranking"`

**C18** - Formas da lista de frequência fora do dicionário não viram comuns nem ocupam o corte (FREQ-01, AC 3)
Proof: `npx vitest run tools/dict-build/src/frequency.test.ts -t "ignores forms outside the dictionary"`

**C19** - `isCommon` é `true` para as comuns e `false` para as demais (FREQ-01, AC 4)
Proof: `npx vitest run packages/core/src/pack.test.ts -t "isCommon matches the common set"`

**C20** - Uma palavra do `profanity.txt` continua no dicionário e fica marcada como palavrão (PROF-01, AC 1)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "marks profanity without removing it"`

**C21** - `isProfane` é `true` para as marcadas e `false` para as demais (PROF-01, AC 2)
Proof: `npx vitest run packages/core/src/pack.test.ts -t "isProfane matches the profanity set"`

**C22** - Uma palavra do `profanity.txt` fora do dicionário encerra o build com erro que traz a palavra (PROF-01, AC 3)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "fails on profanity outside the dictionary"`

**C23** - Com o filtro ligado, um palavrão formado é rejeitado como `not-a-word` (PROF-01, AC 4)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "rejects profanity while the filter is on"`

**C24** - Com o filtro desligado, o mesmo palavrão é aceito (PROF-01, AC 5)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "accepts profanity while the filter is off"`

**C25** - Com o filtro ligado, nenhum tabuleiro gerado tem palavrão de 4+ letras em linha, coluna ou diagonal, em nenhum sentido (PROF-01, AC 6)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "rejects boards with straight-line profanity"`

**C26** - O `languages/pt-BR/profanity.txt` não tem nenhuma palavra (PROF-01, AC 7)
Proof: `npx vitest run tools/dict-build/src/pack.test.ts -t "ships pt-BR with an empty profanity list"`

**C27** - "faca" com grafias "faca" e "faça" guarda as duas, em ordem alfabética (SPELL-01, AC 1)
Proof: `npx vitest run packages/core/src/spellings.test.ts -t "keeps every distinct spelling sorted"`

**C28** - `spellings("faca")` retorna `["faca", "faça"]` (SPELL-01, AC 2)
Proof: `npx vitest run packages/core/src/spellings.test.ts -t "returns stored spellings"`

**C29** - `spellings("casa")` sem entrada no mapa retorna `["casa"]` (SPELL-01, AC 3)
Proof: `npx vitest run packages/core/src/spellings.test.ts -t "falls back to the word itself"`

**C30** - O `stats.json` registra os bytes e as entradas do mapa de grafias (SPELL-01, AC 4)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "reports spellings size"`

**C31** - Um caminho válido que forma uma solução com o tamanho mínimo é aceito (SCORE-01, AC 1)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "accepts a valid path"`

**C32** - Caminhos com peça repetida, peças não adjacentes ou fora do tabuleiro dão `invalid-path` (SCORE-01, AC 2)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "rejects an invalid path"`

**C33** - Com mínimo 4, uma palavra de 3 letras dá `too-short` (SCORE-01, AC 3)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "rejects a word below the minimum"`

**C34** - Uma sequência fora das soluções dá `not-a-word` (SCORE-01, AC 4)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "rejects a non-word"`

**C35** - Uma palavra repetida pelo mesmo jogador dá `already-found` (SCORE-01, AC 5)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "rejects a word already found"`

**C36** - `wordPoints` vale 1, 2, 3, 4 e 14 para 3, 4, 5, 6 e 16 letras (SCORE-01, AC 6)
Proof: `npx vitest run packages/core/src/scoring.test.ts -t "scores by normalized length"`

**C37** - Uma palavra encontrada só por um jogador vale o dobro para ele (SCORE-01, AC 7)
Proof: `npx vitest run packages/core/src/scoring.test.ts -t "doubles unique words"`

**C38** - Uma palavra de dois jogadores vale os pontos simples para cada um e aparece entre as em comum (SCORE-01, AC 8)
Proof: `npx vitest run packages/core/src/scoring.test.ts -t "scores shared words once each and lists them"`

**C39** - Envios rejeitados não mudam o total (SCORE-01, AC 9)
Proof: `npx vitest run packages/core/src/scoring.test.ts -t "never deducts for rejected submissions"`

**C40** - Com comuns no tabuleiro, a maior palavra sai das comuns, mesmo que exista uma rara maior (LONG-01, AC 1)
Proof: `npx vitest run packages/core/src/longest.test.ts -t "picks the longest common word"`

**C41** - No empate de tamanho, ganha a palavra que algum jogador encontrou (LONG-01, AC 2)
Proof: `npx vitest run packages/core/src/longest.test.ts -t "prefers a word someone found"`

**C42** - Se o empate continuar, ganha a primeira em ordem alfabética (LONG-01, AC 3)
Proof: `npx vitest run packages/core/src/longest.test.ts -t "breaks remaining ties alphabetically"`

**C43** - Sem nenhuma comum, a maior palavra sai de todas as soluções (LONG-01, AC 4)
Proof: `npx vitest run packages/core/src/longest.test.ts -t "falls back to all solutions"`

**C44** - O resultado lista quem encontrou a maior palavra (LONG-01, AC 5)
Proof: `npx vitest run packages/core/src/longest.test.ts -t "names the players who found it"`

**C45** - O `meta.json` traz como mínimo de cada tamanho o percentil 10 das palavras comuns de 1.000 tabuleiros com sementes fixas (CAL-01, AC 1)
Proof: `npx vitest run tools/dict-build/src/calibrate.test.ts -t "stores the 10th percentile as the minimum"`

**C46** - Nenhum tabuleiro gerado fica abaixo do `minCommonWords` do seu tamanho (CAL-01, AC 2)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "meets the common-word minimum"`

**C47** - O `stats.json` registra min, mediana e máx de palavras comuns por tamanho (CAL-01, AC 3)
Proof: `npx vitest run tools/dict-build/src/calibrate.test.ts -t "reports the common-word distribution"`

**C48** - Um mínimo impossível lança erro com "200" tentativas (CAL-01, AC 4)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "throws after 200 attempts"`

**C49** - `npm run play` serve a página em `http://localhost:5173` com o pacote carregado (PLAY-01, AC 1)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "serves the page with the pack loaded"`

**C50** - "Novo tabuleiro" com tamanho e semente mostra o tabuleiro daquela semente (PLAY-01, AC 2)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "shows the board for the chosen seed"`

**C51** - Arrastar por peças adjacentes e soltar envia o caminho (PLAY-01, AC 3)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "submits the dragged path on release"`

**C52** - Um envio aceito entra na lista com grafia e pontos e atualiza o total (PLAY-01, AC 4)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "lists an accepted word with spelling and points"`

**C53** - Um envio rejeitado mostra o motivo (PLAY-01, AC 5)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "shows the rejection reason"`

**C54** - "Mostrar soluções" lista todas, destaca as comuns e indica a maior palavra (PLAY-01, AC 6)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "shows solutions with common words and the longest"`

**C55** - A página mostra o número de soluções, o de comuns e o mínimo do tamanho (PLAY-01, AC 7)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "shows the board stats"`

**C56** - Mudar o tamanho mínimo ou o filtro recalcula soluções e validação (PLAY-01, AC 8)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "recomputes on option change"`

**C57** - Durante a carga aparece "Carregando dicionário…" e o tabuleiro fica desabilitado (PLAY-01, AC 9)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "shows loading and disables the board"`

**C58** - Se o pacote falhar, aparece a mensagem de erro com o comando de build (PLAY-01, AC 10)
Proof: `npx playwright test tools/play/e2e/play.spec.ts -g "shows the load error"`

**C59** - Com o filtro ligado, uma palavra comum que também é palavrão não vale nem conta como comum (edge case)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "treats a profane common word as invalid while filtering"`

**C60** - "queijo", formada com a peça "Qu", vale 4 pontos (6 letras) (edge case)
Proof: `npx vitest run packages/core/src/scoring.test.ts -t "counts both letters of Qu"`

**C61** - Um caminho vazio ou de uma peça dá `invalid-path` (edge case)
Proof: `npx vitest run packages/core/src/validate.test.ts -t "rejects an empty or single-tile path"`

---

## Handoff

**Settled mid-build:** uma fase por vez, com parada e pergunta ao usuário entre fases - user: "execute cada fase, pare, me mostre o resultado e me pergunte antes de executar a proxima fase"
**Dispatched:** batch worker fase 1 (T1-T4) em HEAD 7f41f1a - returned (T1-T4 em f6a8270 após reescrita do histórico); batch worker fase 2 (T5-T10) em HEAD 7c85ae2 - returned (T5-T10 em 973c8c5); batch worker fase 3 (T11-T12) em HEAD ee5b676 - returned (T11 em 9c3c83d; T12 parou na conferência por erro da lista, corrigida pelo orquestrador e commitada em 3abcfe4); batch worker fase 4 (T13-T15)
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ------→ T2 ------→ T3 ------→ T4
Phase 2:  T5 ------→ T6 ------→ T7 ------→ T8 ------→ T9 ------→ T10
Phase 3:  T11 -----→ T12
Phase 4:  T13 -----→ T14 -----→ T15
```
