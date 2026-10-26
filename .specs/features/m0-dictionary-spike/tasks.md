# M0 Dictionary Spike Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline - decisões de arquitetura registradas abaixo, sem `design.md`
**Status**: Approved
**Approved**: 2026-10-26 - user: "execute com os sub agents para nao estourar o contexto dessa aba mas peça para o subagent retornar um resumo do que foi feito"
**Mutations**: 3
**Build**: `npx tsc -b; npx vitest run`

### Inline design

- **Monorepo:** npm workspaces `packages/core`, `tools/dict-build`, `spikes/m0`, com TypeScript em modo `composite` (`tsc -b`) e Vitest na raiz.
- **Formato do dicionário (`packages/core/src/dawg.ts`):** DAWG mínimo, construído pelo algoritmo incremental de Daciuk sobre a lista ordenada.
  - Arestas num `Uint32Array`, cada uma com: letra (5 bits), fim de palavra (1 bit), última aresta do nó (1 bit) e índice do filho (25 bits).
  - O leitor consulta o `ArrayBuffer` direto, sem montar objetos por palavra.
  - Cabeçalho com: magic `BWDG`, versão do formato, número de palavras, número de arestas e os pesos de frequência das 26 letras (para o gerador).
- **Idioma (`packages/core/src/lang/ptBR.ts`):** filtro das formas e normalização, com o motivo do descarte (para as contagens do build).
- **Solver e gerador:** DFS sobre o tabuleiro, podado pelo `hasPrefix`. O gerador usa um PRNG com semente (mulberry32), os pesos de letra do cabeçalho, no máximo 4 cópias por letra, Q só como "Qu" e até 200 tentativas.
- **Build (`tools/dict-build`):**
  - O `.dic`/`.aff` é baixado do raw do GitHub no commit fixado.
  - O `unmunch` roda via `wsl` no Windows e direto no Linux, com a saída lida em streaming.
  - Fluxo: filtro → `Set` de normalizadas → lista ordenada → DAWG.
- **Spike (`spikes/m0`):**
  - Um Worker com um Durable Object (backend SQLite) e o binário servido como static asset (binding `ASSETS`).
  - Rotas `/load`, `/solve?seed=`, `/generate?seed=`, cada uma uma operação.
  - A CPU vem do `wrangler tail --format json` (campo de CPU de cada evento).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/DESIGN.md` §7 (Vitest no `core`, Playwright para E2E); o repositório ainda não tem testes - strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Core domain (`dawg`, `lang`, `solver`, `generator`) | unit | All branches; 1:1 to spec ACs; every listed edge case has a test | `packages/core/src/**/*.test.ts` | `npx vitest run packages/core` |
| Dict build tool (`fetch`, `unmunch`, `build`) | integration | Happy path + every listed edge case + error paths, com fixtures `.dic`/`.aff` pequenos e o `unmunch` real | `tools/dict-build/src/**/*.test.ts` | `npx vitest run tools/dict-build` |
| Spike Worker e scripts de medição | none | - (descartável, D2; provado pelo walk e pelo relatório) | - | build gate only |
| Relatório de resultados | unit | Cada AC de REP-01 checado sobre o arquivo `docs/m0-results.md` | `spikes/m0/src/report.test.ts` | `npx vitest run spikes/m0` |
| Config do monorepo | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | After tasks with unit tests only | `npx vitest run packages/core` |
| Full | After tasks with integration tests | `npx vitest run` |
| Build | After phase completion or config-only tasks | `npx tsc -b; npx vitest run` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order.

### Phase 1: Foundation

```
T1
```

### Phase 2: Core

```
T2 → T3 → T4 → T5
```

### Phase 3: Dictionary build

```
T6 → T7 → T8
```

### Phase 4: Measure and report

```
T9 → T10 → T11 → T12
```

---

## Task Breakdown

#### Phase 1: Foundation

### T1: Scaffold do monorepo

**What**: Criar o `package.json` raiz com npm workspaces, o `tsconfig.base.json`, o `vitest.config.ts` e o `.gitignore` (incluindo `tools/dict-build/dist/`, `node_modules/`, `.wrangler/`).
**Where**: `package.json`
**Depends on**: None
**Reuses**: nada (repositório vazio)
**Requirement**: DICT-03

**Done when**:

- [x] `npm install` conclui sem erro
- [x] `npx tsc -b` e `npx vitest run --passWithNoTests` saem com código 0

**Status**: ✅ Complete

**Tests**: none
**Gate**: build

**Commit**: `chore: scaffold npm workspaces monorepo`

---

#### Phase 2: Core

### T2: Filtro e normalização pt-BR

**What**: Implementar `classifyForm(form)`, que retorna a palavra normalizada ou o motivo do descarte (`uppercase`, `non-letter`, `length`).
**Where**: `packages/core/src/lang/ptBR.ts`
**Depends on**: T1
**Reuses**: `String.prototype.normalize('NFD')`
**Requirement**: DICT-02

**Done when**:

- [x] Testes cobrem DICT-02 AC 3-6
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 4 tests pass (no silent deletions)

**Status**: ✅ Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): pt-BR form filter and normalization`

---

### T3: Formato DAWG (builder e leitor)

**What**: Implementar `buildDawg(sortedWords, letterWeights)` → `ArrayBuffer` e `Dawg.fromBuffer(buf)` com `has` e `hasPrefix`, no formato descrito no inline design.
**Where**: `packages/core/src/dawg.ts`
**Depends on**: T2
**Reuses**: nada
**Requirement**: LOOK-01

**Done when**:

- [x] Testes cobrem LOOK-01 AC 1-4
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 8 tests pass (no silent deletions)

**Status**: ✅ Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): compact DAWG dictionary format`

---

### T4: Solver

**What**: Implementar `solve(board, dawg, minLength)`, que retorna o conjunto de palavras formáveis, com suporte à peça "Qu" e validação do tabuleiro.
**Where**: `packages/core/src/solver.ts`
**Depends on**: T3
**Reuses**: `Dawg` de T3
**Requirement**: SOLV-01

**Done when**:

- [x] Testes cobrem SOLV-01 AC 1-5 e o edge case de peças distintas com a mesma letra
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: 14 tests pass (no silent deletions)

**Status**: ✅ Complete

**Tests**: unit
**Gate**: quick

**Commit**: `feat(core): board solver`

---

### T5: Gerador de tabuleiros

**What**: Implementar `generateBoard(size, seed, dawg)` com PRNG de semente, pesos de letra do cabeçalho, no máximo 4 cópias por letra, Q só como "Qu", mínimos de palavras por tamanho e limite de 200 tentativas.
**Where**: `packages/core/src/generator.ts`
**Depends on**: T4
**Reuses**: `solve` de T4, pesos de `Dawg` de T3
**Requirement**: GEN-01

**Done when**:

- [x] Testes cobrem GEN-01 AC 1-6
- [x] Gate check passes: `npx tsc -b; npx vitest run`
- [x] Test count: 20 tests pass (no silent deletions)

**Status**: ✅ Complete

**Tests**: unit
**Gate**: build

**Commit**: `feat(core): seeded board generator`

---

#### Phase 3: Dictionary build

### T6: Download do VERO no commit fixado

**What**: Implementar `fetchSource(sourceJson, outDir)`, que baixa `pt_BR.dic` e `pt_BR.aff` do commit fixado em `source.json` e falha nomeando o arquivo quando o download dá erro.
**Where**: `tools/dict-build/src/fetch.ts`
**Depends on**: T5
**Reuses**: `fetch` nativo do Node 24
**Requirement**: DICT-01

**Done when**:

- [x] `tools/dict-build/source.json` fixa o commit atual do LibreOffice/dictionaries
- [x] Testes cobrem DICT-01 AC 1 e DICT-03 AC 10 (download), com `fetch` substituído
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 22 tests pass (no silent deletions)

**Status**: ✅ Complete

**Tests**: integration
**Gate**: full

**Commit**: `feat(dict-build): fetch VERO at pinned commit`

---

### T7: Execução do unmunch em streaming

**What**: Implementar `expandForms(dicPath, affPath)` como um async iterable de formas: roda o `unmunch` via `wsl` no Windows ou direto no Linux, decodifica conforme o `SET` do `.aff` e falha nomeando o `unmunch` quando ele não existe.
**Where**: `tools/dict-build/src/unmunch.ts`
**Depends on**: T6
**Reuses**: `node:child_process`, `node:readline`
**Requirement**: DICT-01

**Done when**:

- [x] Fixtures `tools/dict-build/fixtures/mini.dic`/`.aff` (UTF-8) e `latin1.dic`/`.aff` (ISO-8859-1)
- [x] Testes cobrem DICT-01 AC 2, DICT-03 AC 10 (`unmunch` ausente) e o edge case de codificação
- [x] Gate check passes: `npx vitest run`
- [x] Test count: 25 tests pass (no silent deletions)

**Status**: ✅ Complete

**Tests**: integration
**Gate**: full

**Commit**: `feat(dict-build): streaming unmunch expansion`

---

### T8: Pipeline `dict:build`

**What**: Implementar `buildDictionary(opts)` e o script `npm run dict:build`: baixar, expandir, filtrar com contagem por motivo, deduplicar, ordenar, calcular os pesos das letras e gravar o `pt-BR.dict.bin` e o `pt-BR.stats.json`, com amostras de aceitas e descartadas sorteadas por semente.
**Where**: `tools/dict-build/src/build.ts`
**Depends on**: T7
**Reuses**: `classifyForm` (T2), `buildDawg` (T3), `fetchSource` (T6), `expandForms` (T7)
**Requirement**: DICT-02, DICT-03

**Done when**:

- [ ] Testes cobrem DICT-02 AC 7 e DICT-03 AC 8-9 sobre as fixtures
- [ ] `npm run dict:build` real gera os dois arquivos a partir do VERO
- [ ] Gate check passes: `npx tsc -b; npx vitest run`
- [ ] Test count: 28 tests pass (no silent deletions)

**Tests**: integration
**Gate**: build

**Commit**: `feat(dict-build): end-to-end dictionary build`

---

#### Phase 4: Measure and report

### T9: Worker e Durable Object do spike

**What**: Criar o Worker com um Durable Object que carrega o binário pelo binding `ASSETS` e expõe `/load`, `/solve?seed=` e `/generate?seed=`, cada um executando uma única operação.
**Where**: `spikes/m0/src/worker.ts`
**Depends on**: T8
**Reuses**: `Dawg`, `solve`, `generateBoard` do core
**Requirement**: BENCH-01

**Done when**:

- [ ] `wrangler.jsonc` com o DO de backend SQLite e assets apontando para `tools/dict-build/dist`
- [ ] Rodando com `wrangler dev`, as três rotas respondem 200 com JSON
- [ ] Gate check passes: `npx tsc -b; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(spike): Durable Object benchmark worker`

---

### T10: Medição local no Node

**What**: Criar o script `npm run bench:node`, que carrega o binário, registra o heap usado (`process.memoryUsage()`) e os tempos de carga, das 100 resoluções e das 20 gerações de 6x6, e grava `spikes/m0/results/node.json`.
**Where**: `spikes/m0/src/bench-node.ts`
**Depends on**: T9
**Reuses**: core
**Requirement**: BENCH-01

**Done when**:

- [ ] `spikes/m0/results/node.json` gerado com heap, carga, p50/p95 do solver e p50/p95 da geração
- [ ] Gate check passes: `npx tsc -b; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(spike): local Node benchmark`

---

### T11: Medição na Cloudflare e remoção do Worker

**What**: Criar o script `npm run bench:cf`, que publica `bwords-m0-spike`, captura o `wrangler tail --format json`, dispara 1 `/load` a frio, 100 `/solve` e 20 `/generate`, grava `spikes/m0/results/cf.json` com a CPU e o tempo de parede de cada requisição e, por fim, executa `wrangler delete`.
**Where**: `spikes/m0/src/bench-cf.ts`
**Depends on**: T10
**Reuses**: `wrangler` CLI
**Requirement**: BENCH-01

**Done when**:

- [ ] `spikes/m0/results/cf.json` com 121 registros de CPU
- [ ] `wrangler deployments list --name bwords-m0-spike` confirma que o Worker não existe mais
- [ ] Gate check passes: `npx tsc -b; npx vitest run`

**Tests**: none
**Gate**: build

**Commit**: `feat(spike): Cloudflare benchmark run`

---

### T12: Relatório `docs/m0-results.md`

**What**: Criar o script `npm run report`, que lê `stats.json`, `node.json`, `cf.json` e `source.json` e escreve o relatório, além do teste que valida a estrutura do relatório gerado.
**Where**: `spikes/m0/src/report.ts`
**Depends on**: T11
**Reuses**: resultados de T8, T10 e T11
**Requirement**: REP-01

**Done when**:

- [ ] `docs/m0-results.md` gerado
- [ ] Testes cobrem REP-01 AC 1-5
- [ ] Gate check passes: `npx tsc -b; npx vitest run`
- [ ] Test count: 33 tests pass (no silent deletions)

**Tests**: unit
**Gate**: build

**Commit**: `docs: M0 results report`

---

## Checks

**C1** - O download usa a URL do commit fixado em `source.json` (DICT-01, AC 1)
Proof: `npx vitest run tools/dict-build/src/fetch.test.ts -t "downloads from the pinned commit"`

**C2** - O `unmunch` expande a fixture `mini.dic` nas formas esperadas (DICT-01, AC 2)
Proof: `npx vitest run tools/dict-build/src/unmunch.test.ts -t "expands fixture forms"`

**C3** - Uma forma com letra maiúscula é descartada com o motivo `uppercase` (DICT-02, AC 3)
Proof: `npx vitest run packages/core/src/lang/ptBR.test.ts -t "discards uppercase forms"`

**C4** - Uma forma com hífen, apóstrofo, dígito ou ponto é descartada com o motivo `non-letter` (DICT-02, AC 4)
Proof: `npx vitest run packages/core/src/lang/ptBR.test.ts -t "discards non-letter forms"`

**C5** - "ação" vira "acao" e "mãe" vira "mae" (DICT-02, AC 5)
Proof: `npx vitest run packages/core/src/lang/ptBR.test.ts -t "strips diacritics and cedilla"`

**C6** - Formas normalizadas com 2 ou 17 letras são descartadas; 3 e 16 ficam (DICT-02, AC 6)
Proof: `npx vitest run packages/core/src/lang/ptBR.test.ts -t "discards length outside 3-16"`

**C7** - "pôr" e "por" geram uma única entrada no binário (DICT-02, AC 7)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "stores duplicate normalized words once"`

**C8** - O build grava `pt-BR.dict.bin` e `pt-BR.stats.json` com a contagem após cada filtro (DICT-03, AC 8)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "writes bin and stats with per-filter counts"`

**C9** - Dois builds sobre a mesma entrada geram binários com o mesmo SHA-256 (DICT-03, AC 9)
Proof: `npx vitest run tools/dict-build/src/build.test.ts -t "is byte-identical across runs"`

**C10** - Uma falha de download encerra com erro que nomeia o arquivo (DICT-03, AC 10)
Proof: `npx vitest run tools/dict-build/src/fetch.test.ts -t "fails naming the file that did not download"`

**C11** - Sem `unmunch`, a expansão encerra com erro que nomeia o `unmunch` (DICT-03, AC 10)
Proof: `npx vitest run tools/dict-build/src/unmunch.test.ts -t "fails naming unmunch when missing"`

**C12** - `has` retorna `true` para toda palavra gravada (LOOK-01, AC 1)
Proof: `npx vitest run packages/core/src/dawg.test.ts -t "has returns true for every stored word"`

**C13** - `has` retorna `false` para palavras não gravadas, inclusive prefixos de palavras gravadas (LOOK-01, AC 2)
Proof: `npx vitest run packages/core/src/dawg.test.ts -t "has returns false for unknown words"`

**C14** - `hasPrefix` retorna `true` para prefixos gravados e `false` para os demais (LOOK-01, AC 3)
Proof: `npx vitest run packages/core/src/dawg.test.ts -t "hasPrefix matches stored prefixes only"`

**C15** - Um buffer com magic ou versão errados lança erro que nomeia o problema (LOOK-01, AC 4)
Proof: `npx vitest run packages/core/src/dawg.test.ts -t "rejects a buffer with a bad header"`

**C16** - O solver retorna exatamente a lista esperada num 4x4 montado à mão, com diagonais (SOLV-01, AC 1)
Proof: `npx vitest run packages/core/src/solver.test.ts -t "finds exactly the expected words"`

**C17** - Uma palavra que exige reusar a mesma peça não é encontrada (SOLV-01, AC 2)
Proof: `npx vitest run packages/core/src/solver.test.ts -t "never reuses a tile"`

**C18** - A peça "Qu" forma "queijo" a partir das peças QU-E-I-J-O (SOLV-01, AC 3)
Proof: `npx vitest run packages/core/src/solver.test.ts -t "treats Qu as qu"`

**C19** - Com mínimo 4, palavras de 3 letras ficam fora do resultado (SOLV-01, AC 4)
Proof: `npx vitest run packages/core/src/solver.test.ts -t "drops words below the minimum length"`

**C20** - Um tabuleiro 3x3, 4x5 ou com peça fora do alfabeto lança erro (SOLV-01, AC 5)
Proof: `npx vitest run packages/core/src/solver.test.ts -t "rejects invalid boards"`

**C21** - "erros" é encontrada usando duas peças R distintas (SOLV-01, edge case)
Proof: `npx vitest run packages/core/src/solver.test.ts -t "uses distinct tiles with the same letter"`

**C22** - Em 2.000 sorteios, a frequência de cada letra fica dentro de ±20% do peso do cabeçalho (GEN-01, AC 1)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "weights letters by dictionary frequency"`

**C23** - Nenhum tabuleiro gerado tem mais de 4 cópias da mesma letra (GEN-01, AC 2)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "caps copies of a letter at 4"`

**C24** - Nenhum tabuleiro gerado tem uma peça "Q" sozinha (GEN-01, AC 3)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "emits Q only as Qu"`

**C25** - Os tabuleiros gerados atingem 40/80/120 palavras para 4x4/5x5/6x6 (GEN-01, AC 4)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "meets the minimum word count per size"`

**C26** - A mesma semente gera o mesmo tabuleiro (GEN-01, AC 5)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "returns the same board for the same seed"`

**C27** - Um dicionário sem palavras suficientes lança erro com "200" tentativas (GEN-01, AC 6)
Proof: `npx vitest run packages/core/src/generator.test.ts -t "throws after 200 attempts"`

**C28** - A primeira requisição ao DO publicado carrega o binário dos assets e responde com o tempo de carga (BENCH-01, AC 1)
Proof: walk - `spikes/m0/results/cf.json` mostra o registro `/load` com `loadMs` e status 200

**C29** - Cada operação é uma requisição separada: 1 carga, 100 resoluções e 20 gerações (BENCH-01, AC 2)
Proof: walk - `spikes/m0/results/cf.json` tem 121 registros com rota e semente

**C30** - Cada requisição tem o tempo de CPU vindo do `wrangler tail` (BENCH-01, AC 3)
Proof: walk - todos os 121 registros de `cf.json` têm `cpuMs` numérico

**C31** - A medição local registra o heap após carregar o dicionário (BENCH-01, AC 4)
Proof: walk - `spikes/m0/results/node.json` tem `heapUsedMb`

**C32** - Uma rejeição de carga pela Cloudflare vira FALHA do critério de memória (BENCH-01, AC 5)
Proof: `npx vitest run spikes/m0/src/report.test.ts -t "marks memory as FAIL when the load was rejected"`

**C33** - O Worker `bwords-m0-spike` não existe mais após a medição (BENCH-01, AC 6)
Proof: walk - `npx wrangler deployments list --name bwords-m0-spike` responde que o Worker não existe

**C34** - O relatório lista os 5 critérios de D3 com valor, limite e PASSA/FALHA (REP-01, AC 1)
Proof: `npx vitest run spikes/m0/src/report.test.ts -t "lists every D3 criterion with value, limit and verdict"`

**C35** - O relatório traz a contagem após cada filtro do build (REP-01, AC 2)
Proof: `npx vitest run spikes/m0/src/report.test.ts -t "includes per-filter counts"`

**C36** - O relatório traz 50 palavras aceitas e 50 descartadas (REP-01, AC 3)
Proof: `npx vitest run spikes/m0/src/report.test.ts -t "includes 50 accepted and 50 discarded samples"`

**C37** - Cada critério em FALHA tem uma recomendação de plano B (REP-01, AC 4)
Proof: `npx vitest run spikes/m0/src/report.test.ts -t "recommends a plan B for each failed criterion"`

**C38** - O relatório registra o commit do VERO e a remoção do Worker (REP-01, AC 5)
Proof: `npx vitest run spikes/m0/src/report.test.ts -t "records the VERO commit and the worker removal"`

**C39** - O `.aff` com `SET ISO8859-1` é decodificado corretamente (edge case de codificação)
Proof: `npx vitest run tools/dict-build/src/unmunch.test.ts -t "decodes per the aff SET encoding"`

**C40** - A saída do `unmunch` é processada em streaming: o pico de heap do build real fica abaixo de 1 GB (edge case de streaming)
Proof: walk - `pt-BR.stats.json` registra `peakHeapMb` < 1024

---

## Handoff

**Settled mid-build:** execução por subagentes em 2 lotes (fases 1-2, fases 3-4), cada um devolvendo um resumo - user: "execute com os sub agents para nao estourar o contexto dessa aba mas peça para o subagent retornar um resumo do que foi feito"
**Dispatched:** batch worker 1 (fases 1-2, T1-T5) em HEAD 379ae13 - returned (T1-T5 em ca0dab2; desvio: `erasableSyntaxOnly` no tsconfig.base para rodar no Node 24); batch worker 2 (fases 3-4, T6-T12) em HEAD ca0dab2
**Walked:** none

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1
Phase 2:  T2 ------→ T3 ------→ T4 ------→ T5
Phase 3:  T6 ------→ T7 ------→ T8
Phase 4:  T9 ------→ T10 -----→ T11 -----→ T12
```
