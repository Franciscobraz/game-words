# M2 Room Server Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/m2-room-server/design.md`
**Status**: Approved
**Approved**: 2026-10-27 - user: "aprovo as tasks do M2, execute uma fase por vez com subagentes e pare entre as fases"
**Mutations**: 3
**Build**: `npx tsc -b; npx vitest run; npx playwright test`

### Regras de execução (aprendidas no M1)

- **Limites exatos (L-001):** todo limite inclusivo da spec tem um teste com o valor exatamente no limite e um logo depois: apelido com 2 e 12 caracteres (aceitos) e com 1 e 13 (recusados); 4.096 e 4.097 bytes; envio em `endsAt + 300 ms` e em `+ 301 ms`; o 10º e o 11º caminho numa janela de 1 s; anfitrião offline por 29.999 ms e 30.000 ms; CIEDE2000 de 19,99 e 20; contraste de 2,99:1 e 3:1; tempo da rodada 30/180 e 0/210; rodadas 1/5 e 0/6; volume 0/100 e -1/101.
- **Um caso por ramo de tabela (L-007):** toda tabela de despacho (comando → handler, comando de anfitrião → `not-host`, fase → comandos válidos, erro → código) tem um caso de teste para cada linha, não um exemplo.
- **Histórico:** um erro de código ou de docs se corrige com outro commit; subagentes nunca usam `rebase`, `--amend` em commit já registrado ou `push --force`. A única exceção é remover dados sensíveis commitados, feita pelo user (como no M1). Depois de uma reescrita, o orquestrador atualiza no Handoff os hashes antigos → novos, e o `check_proofs.py` roda de novo no `HEAD` novo.
- **Nomes dos testes:** cada teste citado em `## Checks` usa exatamente o nome entre aspas da prova, porque `check_proofs.py` seleciona pelo `-t`.
- **Código em inglês (AD-001):** identificadores, mensagens, códigos e nomes de teste em inglês. O texto de `tasks.md` e dos commits de docs segue em português, com os termos técnicos em inglês.
- **Ambiente Windows:** os scripts da skill rodam com `PYTHONUTF8=1` e `PYTHONPATH` apontando para a pasta do `sitecustomize.py` (ver `.specs/STATE.md`).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/DESIGN.md` §7 (Vitest no core, Playwright para E2E); `vitest.config.ts`; testes existentes em `packages/core/src/*.test.ts` (Vitest, fixtures em memória). Sem `AGENTS.md`/`CONTRIBUTING.md`: strong defaults aplicados.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Core room rules (`packages/core/src/room/*`, `path.ts`) | unit | All branches; 1:1 to spec ACs; every edge case; limites exatos (L-001); um caso por ramo de tabela (L-007) | `packages/core/src/**/*.test.ts` | `npx vitest run packages/core` |
| Server adapter (`packages/server/src/*`) | integration (workerd) | Happy path + edge + error de cada AC de ROOM, RECON, PERSIST e EXP que depende do runtime; uma partida completa | `packages/server/test/*.test.ts` | `npx vitest run packages/server` |
| Config (`wrangler.jsonc`, `package.json`, `tsconfig`, `vitest.config.ts`) | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tasks com testes unit no core (Phases 1-3) | `npx vitest run packages/core` |
| Full | Tasks do servidor (Phase 4) | `npx vitest run` |
| Build | Fim de cada fase | `npx tsc -b; npx vitest run; npx playwright test` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order. Cada fase é um batch de subagente e termina com parada para o usuário.

### Phase 1: Room primitives

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Lobby rules

```
T7 → T8 → T9 → T10 → T11
```

### Phase 3: Round rules

```
T12 → T13 → T14 → T15 → T16 → T17 → T18
```

### Phase 4: Durable Object server

```
T19 → T20 → T21 → T22 → T23 → T24 → T25 → T26
```

---

## Task Breakdown

#### Phase 1: Room primitives

### T1: Room codes

**What**: `ROOM_CODE_ALPHABET`, `randomRoomCode(rand)`, `isRoomCode(s)` e `createWithFreeCode(tryCreate, rand)`, que sorteia de novo enquanto `tryCreate` recusa.
**Where**: `packages/core/src/room/codes.ts`
**Depends on**: None
**Reuses**: `mulberry32` de `generator.ts` nos testes
**Requirement**: ROOM-01

**Done when**:

- [x] Testes cobrem ROOM-01 AC 2 e o alfabeto sem `I` e `O` (C2, C80)
- [x] `packages/core/src/index.ts` exporta `room/codes.ts`
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): room codes`

---

### T2: Nickname rules

**What**: `cleanNickname(s)` (trim, NFC, 2-12 code points, sem caracteres de controle) e `nicknameKey(s)` (NFD, sem diacríticos, minúsculas).
**Where**: `packages/core/src/room/nickname.ts`
**Depends on**: T1
**Reuses**: nada
**Requirement**: JOIN-01

**Done when**:

- [x] Testes de limite exato: 2 e 12 aceitos, 1 e 13 recusados, contados depois do trim
- [x] "João" e "joao" têm a mesma chave
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): nickname rules`

---

### T3: Color rules and palette

**What**: `TV_BACKGROUND`, `parseHex`, `contrastRatio` (WCAG 2.x), `ciede2000`, `checkColor(color, others)` e `PALETTE` com 10 cores.
**Where**: `packages/core/src/room/colors.ts`
**Depends on**: T2
**Reuses**: nada; fórmulas de referência citadas no `design.md`
**Requirement**: JOIN-01

**Done when**:

- [x] `ciede2000` confere os pares de teste publicados por Sharma et al. (2005) com erro < 0,0001
- [x] Limites exatos: contraste 2,99:1 recusado e 3:1 aceito; CIEDE2000 19,99 recusado e 20 aceito
- [x] C17 passa
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): color legibility and similarity`

---

### T4: Salted hash prefixes

**What**: `HASH_PREFIX_BYTES = 6`, `hashPrefix(salt, word)` e `hashPrefixes(salt, words)` com Web Crypto: primeiros 6 bytes de SHA-256(salt ‖ UTF-8 da palavra).
**Where**: `packages/core/src/room/hashes.ts`
**Depends on**: T3
**Reuses**: nada
**Requirement**: ROUND-01

**Done when**:

- [x] Vetor fixo: salt e palavra conhecidos dão um prefixo conferido com `node:crypto` no teste
- [x] O mesmo salt e palavra sempre dão o mesmo prefixo; salts diferentes dão prefixos diferentes
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): salted hash prefixes`

---

### T5: Path finder

**What**: `findPath(board, word)`: o caminho de peças (índices row-major) que forma a palavra nas 8 direções, sem repetir peça e respeitando "Qu", ou `null`.
**Where**: `packages/core/src/path.ts`
**Depends on**: T4
**Reuses**: `boardTiles` de `solver.ts`
**Requirement**: RES-01

**Done when**:

- [x] Todo caminho devolvido passa em `validateSubmission` com a mesma palavra
- [x] Palavra com "Qu", palavra que exige diagonal e palavra ausente (`null`) têm casos próprios
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): path finder`

---

### T6: Protocol

**What**: Tipos `ClientMessage`, `ServerMessage`, `ErrorCode`, `SubmitReject`, `CloseReason`; as listas `CLIENT_MESSAGE_TYPES`, `SERVER_MESSAGE_TYPES`, `ERROR_CODES`, `SUBMIT_REJECTS`, `CLOSE_REASONS`; `parseClientMessage(raw)` com limite de 4.096 bytes antes do `JSON.parse`; `encodeHashFrame`/`decodeHashFrame`.
**Where**: `packages/core/src/room/protocol.ts`
**Depends on**: T5
**Reuses**: `RejectReason` de `validate.ts`
**Requirement**: PROTO-01

**Done when**:

- [ ] Um caso de recusa para cada tipo de mensagem com um campo fora do formato (L-007)
- [ ] Limite exato: 4.096 bytes aceito, 4.097 recusado
- [ ] `decodeHashFrame(encodeHashFrame(...))` devolve o mesmo `roundId` e os mesmos prefixos
- [ ] C70-C72 e C74 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): room protocol`

---

#### Phase 2: Lobby rules

### T7: Room state and settings

**What**: `RoomState`, `Settings`, `Player`, `RoundMeta`, `createRoom(code, tvToken, now, cfg)` com os padrões e `validateSettingsPatch(patch)`.
**Where**: `packages/core/src/room/state.ts`
**Depends on**: T6
**Reuses**: tipos de `protocol.ts`
**Requirement**: CFG-01

**Done when**:

- [ ] Limites exatos de cada opção (L-001), um caso por opção (L-007)
- [ ] C31, C33, C35 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): room state and settings`

---

### T8: Step dispatcher and connections

**What**: `step(state, input, now, deps)` com o despacho por tipo de mensagem e fase; `hello` de TV e de jogador (tokens, substituição de conexão), `disconnect`, `time` e a visão do estado por papel (a TV não recebe tokens nem hashes; o celular não recebe palavras da rodada).
**Where**: `packages/core/src/room/machine.ts`
**Depends on**: T7
**Reuses**: `parseClientMessage` (T6)
**Requirement**: ROOM-01, RECON-01, ROUND-01, PROTO-01

**Done when**:

- [ ] Um caso por linha da tabela fase → comandos válidos, com `wrong-phase` para cada comando fora da fase (L-007)
- [ ] C3-C5, C47, C59-C62, C73, C77, C79 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): room dispatcher and connections`

---

### T9: Join

**What**: Handler de `join`: apelido, cor, limite de 10, espectador fora do lobby, token e aviso a todos.
**Where**: `packages/core/src/room/join.ts`
**Depends on**: T8
**Reuses**: `cleanNickname`, `nicknameKey` (T2), `checkColor` (T3)
**Requirement**: JOIN-01

**Done when**:

- [ ] O 10º jogador entra e o 11º recebe `room-full` (L-001)
- [ ] C6-C12, C14 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): join rules`

---

### T10: Host commands

**What**: Primeiro jogador como anfitrião, `transfer-host`, `kick` (remove pontos e palavras, invalida o token, fecha com `kicked`) e `not-host` para todo comando de anfitrião de quem não é.
**Where**: `packages/core/src/room/host.ts`
**Depends on**: T9
**Reuses**: `join.ts` (T9) nos testes
**Requirement**: HOST-01

**Done when**:

- [ ] Um caso de `not-host` para cada um dos 7 comandos de anfitrião (L-007)
- [ ] C18-C21, C25-C27 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): host commands`

---

### T11: Settings command

**What**: Handler de `settings`: aplica no lobby e manda a todos; `wrong-phase` fora do lobby; `bad-settings` sem mudar nada.
**Where**: `packages/core/src/room/settings.ts`
**Depends on**: T10
**Reuses**: `validateSettingsPatch` (T7)
**Requirement**: CFG-01

**Done when**:

- [ ] C32, C34 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): settings command`

---

#### Phase 3: Round rules

### T12: Round preparation

**What**: `prepareRound(pack, settings, seed, salt): Promise<PreparedRound>`: tabuleiro, soluções filtradas, prefixos de hash e o caminho de cada palavra sob demanda.
**Where**: `packages/core/src/room/prepare.ts`
**Depends on**: T11
**Reuses**: `generateBoard`, `boardSolutions`, `hashPrefixes` (T4)
**Requirement**: ROUND-01, RES-01

**Done when**:

- [ ] Com o filtro ligado, nenhum palavrão entra nas soluções nem nos prefixos
- [ ] Os prefixos são `hashPrefixes(salt, soluções)`, na mesma ordem
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): round preparation`

---

### T13: Round start

**What**: Handler de `start` e início de rodada: espectadores viram jogadores, `round-start` para todos, salt e frame de hashes só para celulares, `startsAt = now + 3000`, `endsAt = startsAt + seconds × 1000`.
**Where**: `packages/core/src/room/round.ts`
**Depends on**: T12
**Reuses**: `PreparedRound` (T12), `encodeHashFrame` (T6)
**Requirement**: ROUND-01, JOIN-01

**Done when**:

- [ ] C13, C36, C37 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): round start`

---

### T14: Submissions

**What**: Handler de `submit`: valida cada caminho em ordem com `validateSubmission` sobre as soluções guardadas (`filterProfanity: false`, porque já vêm filtradas), janela `[startsAt, endsAt + 300]`, espectador, rate limit de 10 caminhos por janela de 1 s e uma única resposta.
**Where**: `packages/core/src/room/submit.ts`
**Depends on**: T13
**Reuses**: `validateSubmission`
**Requirement**: ROUND-01

**Done when**:

- [ ] Limites exatos da janela e do rate limit (L-001)
- [ ] Um palavrão filtrado continua recusado com as soluções guardadas
- [ ] C38-C41, C76 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): submissions`

---

### T15: TV counts

**What**: Throttle das contagens para a TV: no máximo 1 envio por 1.000 ms, só quando mudou, com deadline de flush.
**Where**: `packages/core/src/room/counts.ts`
**Depends on**: T14
**Reuses**: `submit.ts` (T14) nos testes
**Requirement**: ROUND-01

**Done when**:

- [ ] Limite exato: aceito em 999 ms não sai; em 1.000 ms sai
- [ ] C42 passa
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): throttled tv counts`

---

### T16: Round end and results

**What**: Fim da rodada: contagens finais para a TV, depois `round-results` com palavras em comum, únicas por jogador (do menor para o maior placar acumulado), pontos, placar, grafias, maior palavra com caminho e quem achou; efeito `prepare-next` quando ainda há rodadas.
**Where**: `packages/core/src/room/results.ts`
**Depends on**: T15
**Reuses**: `scoreRound`, `pickLongestWord`, `findPath` (T5), `LanguagePack.spellings`
**Requirement**: ROUND-01, RES-01

**Done when**:

- [ ] C28, C43-C46, C75, C78, C82 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): round results`

---

### T17: Match flow

**What**: Handlers de `next` (próxima contagem ou pódio), `play-again` e `close-room`, com `wrong-phase` fora da fase.
**Where**: `packages/core/src/room/flow.ts`
**Depends on**: T16
**Reuses**: `round.ts` (T13)
**Requirement**: RES-01

**Done when**:

- [ ] C49-C53 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): match flow`

---

### T18: Deadlines

**What**: `nextDeadline(state)` e o input `alarm`: fim da rodada, troca de anfitrião em 30 s, flush da TV, ociosidade e TV ausente, com `0` desligando a regra.
**Where**: `packages/core/src/room/deadlines.ts`
**Depends on**: T17
**Reuses**: `counts.ts` (T15), `results.ts` (T16)
**Requirement**: HOST-01, RECON-01, EXP-01

**Done when**:

- [ ] Limites exatos: 29.999 ms e 30.000 ms do anfitrião; um minuto antes e no minuto exato de cada expiração
- [ ] C22-C24, C63, C67-C69 passam
- [ ] Gate check passes: `npx vitest run packages/core`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): room deadlines`

---

#### Phase 4: Durable Object server

### T19: Server workspace and test harness

**What**: Workspace `@bwords/server` com `wrangler.jsonc` (DO `ROOM` SQLite, `ASSETS`, vars de expiração, `compatibility_date` ≥ 2026-04-07 suportada pelo wrangler 4.153), `tsconfig`, projeto Vitest com `@cloudflare/vitest-plugin` e o pacote de fixture dos testes. O teste "hello" prova que um DO de teste carrega o pacote de fixture.
**Where**: `packages/server/test/fixture-pack.ts`
**Depends on**: T18
**Reuses**: `spikes/m0/wrangler.jsonc`, `buildDawg`, `buildSpellings`
**Requirement**: PERSIST-01

**Done when**:

- [ ] O pacote de fixture gera tabuleiros 4x4 com ≥ 40 palavras (o `MIN_WORDS` do `generateBoard` vale mesmo com `minCommonWords` vazio)
- [ ] Como o pacote chega ao DO nos testes (ASSETS da config do plugin ou `Fetcher` em memória) fica registrado em `## Handoff` → Settled mid-build
- [ ] `vitest.config.ts` da raiz tem os projetos `core` (Node, sem `packages/server`) e `server` (workerd); `tsconfig.json` da raiz referencia o servidor
- [ ] Gate check passes: `npx vitest run`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: full
**Commit**: `build(server): workspace and workers test harness`

---

### T20: Config

**What**: `readConfig(env)`: `ROOM_IDLE_TIMEOUT_MIN` (30) e `TV_DISCONNECT_TIMEOUT_MIN` (10), padrão para valores que não são inteiros ≥ 0.
**Where**: `packages/server/src/config.ts`
**Depends on**: T19
**Reuses**: nada
**Requirement**: EXP-01

**Done when**:

- [ ] Um caso por entrada inválida: vazio, negativo, decimal, texto (L-007)
- [ ] C64, C65 passam
- [ ] Gate check passes: `npx vitest run`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): expiry config`

---

### T21: Pack loader

**What**: `loadPack(assets, id)`: busca os arquivos de `<id>/` no `ASSETS`, monta o `LanguagePack` e guarda em cache por isolate.
**Where**: `packages/server/src/pack-loader.ts`
**Depends on**: T20
**Reuses**: `LanguagePack.fromBuffers`, padrão do `spikes/m0/src/worker.ts`
**Requirement**: ROUND-01

**Done when**:

- [ ] Duas chamadas fazem uma busca só; uma resposta 404 rejeita com o nome do arquivo
- [ ] `spellings.bin` só é buscado na primeira vez que alguém pede grafias
- [ ] Gate check passes: `npx vitest run`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): language pack loader`

---

### T22: Worker routes

**What**: `POST /api/rooms` (código livre via `createWithFreeCode` e `stub.create()`), `GET /api/rooms/:code/ws` (upgrade para o DO de `idFromName`), 404 no resto; código mal formado ou sem sala → `error room-not-found` e `close`.
**Where**: `packages/server/src/worker.ts`
**Depends on**: T21
**Reuses**: `createWithFreeCode`, `isRoomCode` (T1)
**Requirement**: ROOM-01, JOIN-01

**Done when**:

- [ ] C1, C15 passam
- [ ] Gate check passes: `npx vitest run`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): worker routes`

---

### T23: RoomDO connection loop

**What**: `RoomDO`: `create()`, `fetch` com `acceptWebSocket`, `webSocketMessage`/`Close`/`Error` → `step()`, execução de `send`/`sendHashes`/`close` por tags e attachment, auto-response `ping`/`pong`, relógio substituível.
**Where**: `packages/server/src/room-do.ts`
**Depends on**: T22
**Reuses**: `step` (T8), `prepareRound` (T12), `loadPack` (T21)
**Requirement**: RECON-01, ROOM-01

**Done when**:

- [ ] Uma TV e dois celulares entram, jogam um envio e recebem as respostas por WebSocket real
- [ ] C58 passa
- [ ] Gate check passes: `npx vitest run`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): room durable object`

---

### T24: Persistence and hibernation

**What**: Chaves `room`, `round:solutions`, `round:next`, `found:<playerId>` gravadas só quando mudam; constructor com `blockConcurrencyWhile` que reconstrói tudo; sockets e attachments que sobrevivem à hibernation.
**Where**: `packages/server/src/storage.ts`
**Depends on**: T23
**Reuses**: `evictDurableObject` nos testes
**Requirement**: PERSIST-01

**Done when**:

- [ ] C54-C56 passam
- [ ] Gate check passes: `npx vitest run`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): room persistence`

---

### T25: Alarms and room closing

**What**: `setAlarm(nextDeadline)` depois de cada input, `alarm()` → `step()`, e o fechamento da sala (aviso, `close`, `deleteAll`, `deleteAlarm`).
**Where**: `packages/server/src/alarms.ts`
**Depends on**: T24
**Reuses**: `nextDeadline` (T18), `runDurableObjectAlarm` nos testes
**Requirement**: PERSIST-01, ROUND-01, EXP-01

**Done when**:

- [ ] C48, C57, C66 passam
- [ ] Gate check passes: `npx vitest run`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): alarms and room closing`

---

### T26: Full match

**What**: Teste de integração de uma partida de 2 rodadas com uma TV e 3 celulares, do lobby ao "jogar de novo", e a varredura de todas as mensagens enviadas aos celulares atrás de palavras da rodada.
**Where**: `packages/server/test/match.test.ts`
**Depends on**: T25
**Reuses**: `findPath`, `boardSolutions`, `fixture-pack.ts` (T19)
**Requirement**: PROTO-01, RES-01

**Done when**:

- [ ] C16, C81 passam
- [ ] Gate check passes: `npx tsc -b; npx vitest run; npx playwright test`
- [ ] Test count: anterior + novos, nenhum removido

**Tests**: integration
**Gate**: build
**Commit**: `test(server): full match over websockets`

---

## Checks

**C1** - `POST /api/rooms` cria uma sala no lobby e responde com um código de 4 letras de `ABCDEFGHJKLMNPQRSTUVWXYZ` e um token de TV (ROOM-01, AC 1)
Proof: `npx vitest run packages/server/test/worker.test.ts -t "creates a room with a 4-letter code and a TV token"`

**C2** - Quando o código sorteado já tem sala ativa, outro é sorteado até achar um livre (ROOM-01, AC 2)
Proof: `npx vitest run packages/core/src/room/codes.test.ts -t "draws again until a code is free"`

**C3** - A TV com o token da sala recebe o estado completo na fase atual (ROOM-01, AC 3)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends the full state to a TV with the room token"`

**C4** - Uma TV com token errado recebe `bad-token` e é fechada (ROOM-01, AC 4)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "rejects a TV with a wrong token"`

**C5** - Uma nova TV com o token da sala fecha a conexão antiga e fica (ROOM-01, AC 5)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "a new TV connection replaces the old one"`

**C6** - Um `join` válido registra o jogador, devolve o token e avisa todas as conexões (JOIN-01, AC 1)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "registers a player, returns a token and announces the join"`

**C7** - Apelido com 1 ou 13 caracteres depois do trim dá `bad-nickname`; com 2 e 12 entra (JOIN-01, AC 2)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "accepts 2 to 12 characters after trimming"`

**C8** - "joao" recebe `nickname-taken` quando "João" já está na sala (JOIN-01, AC 3)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "rejects a nickname equal ignoring case and accents"`

**C9** - Cor fora de `#RRGGBB` dá `bad-color` (JOIN-01, AC 4)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "rejects a color that is not #RRGGBB"`

**C10** - Cor com contraste < 3:1 sobre `#121417` dá `color-illegible` (JOIN-01, AC 5)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "rejects a color below 3:1 on the TV background"`

**C11** - Cor a CIEDE2000 < 20 de outro jogador dá `color-too-similar` (JOIN-01, AC 6)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "rejects a color closer than 20 to another player"`

**C12** - O 11º jogador, conectados ou não, recebe `room-full` (JOIN-01, AC 7)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "rejects the 11th player with room-full"`

**C13** - Na próxima contagem, todos os espectadores viram jogadores (JOIN-01, AC 10)
Proof: `npx vitest run packages/core/src/room/round.test.ts -t "turns spectators into players at the next countdown"`

**C14** - Quem entra na contagem, na rodada ou no resultado vira espectador com 0 pontos (JOIN-01, AC 9)
Proof: `npx vitest run packages/core/src/room/join.test.ts -t "joins as a spectator during countdown, round and results"`

**C15** - Um código sem sala ativa recebe `room-not-found` e a conexão fecha (JOIN-01, AC 8)
Proof: `npx vitest run packages/server/test/worker.test.ts -t "answers room-not-found for a code without a room"`

**C17** - A paleta tem 10 cores, cada uma com contraste ≥ 3:1 sobre `#121417` e CIEDE2000 ≥ 20 de todas as outras (JOIN-01, AC 11)
Proof: `npx vitest run packages/core/src/room/colors.test.ts -t "palette has 10 legible colors at least 20 apart"`

**C18** - O primeiro jogador vira anfitrião (HOST-01, AC 1)
Proof: `npx vitest run packages/core/src/room/host.test.ts -t "makes the first player the host"`

**C19** - Por joins, transferências, expulsões e trocas, a sala sempre tem exatamente um anfitrião (HOST-01, AC 2)
Proof: `npx vitest run packages/core/src/room/host.test.ts -t "keeps exactly one host through every change"`

**C20** - `transfer-host` para um jogador conectado o torna anfitrião e avisa todos (HOST-01, AC 3)
Proof: `npx vitest run packages/core/src/room/host.test.ts -t "transfers the host role and announces it"`

**C21** - Cada um dos 7 comandos de anfitrião vindo de outro jogador dá `not-host` sem mudar o estado (HOST-01, AC 4)
Proof: `npx vitest run packages/core/src/room/host.test.ts -t "rejects every host command from a non-host"`

**C22** - Anfitrião offline por 30.000 ms passa o papel ao próximo conectado na ordem de entrada; em 29.999 ms não (HOST-01, AC 5)
Proof: `npx vitest run packages/core/src/room/deadlines.test.ts -t "hands the host role over after 30 s offline"`

**C23** - Sem ninguém conectado nos 30 s, o papel vai para o primeiro que reconectar (HOST-01, AC 6)
Proof: `npx vitest run packages/core/src/room/deadlines.test.ts -t "gives the host role to the first player who reconnects"`

**C24** - O anfitrião que reconecta antes de 30 s continua anfitrião (HOST-01, AC 7)
Proof: `npx vitest run packages/core/src/room/deadlines.test.ts -t "keeps a host who reconnects within 30 s"`

**C25** - `kick` remove o jogador, os pontos e as palavras, invalida o token e fecha com `kicked` (HOST-01, AC 8)
Proof: `npx vitest run packages/core/src/room/host.test.ts -t "kick removes the player and closes with kicked"`

**C26** - O expulso que entra de novo é um jogador novo com 0 pontos (HOST-01, AC 9)
Proof: `npx vitest run packages/core/src/room/host.test.ts -t "a kicked player joins again as a new player"`

**C27** - O anfitrião que tenta se expulsar recebe `bad-target` (HOST-01, AC 10)
Proof: `npx vitest run packages/core/src/room/host.test.ts -t "rejects a host kicking themself"`

**C31** - Uma sala nova tem 4x4, 120 s, 1 rodada, mínimo 3, filtro ligado, fast mode desligado, pt-BR e som ligado (CFG-01, AC 1)
Proof: `npx vitest run packages/core/src/room/state.test.ts -t "creates rooms with the default settings"`

**C32** - No lobby, uma mudança válida é guardada e enviada a todas as conexões (CFG-01, AC 2)
Proof: `npx vitest run packages/core/src/room/settings.test.ts -t "applies a valid change in the lobby and broadcasts it"`

**C33** - Cada opção fora do permitido dá `bad-settings` sem mudar nada, com os limites exatos (CFG-01, AC 3)
Proof: `npx vitest run packages/core/src/room/state.test.ts -t "rejects out-of-range settings"`

**C34** - Mudar configuração fora do lobby dá `wrong-phase` (CFG-01, AC 4)
Proof: `npx vitest run packages/core/src/room/settings.test.ts -t "rejects settings changes outside the lobby"`

**C35** - Volume aceita inteiros de 0 a 100 e mudo só booleano; o resto dá `bad-settings` (CFG-01, AC 5)
Proof: `npx vitest run packages/core/src/room/state.test.ts -t "accepts volume 0-100 and a boolean mute only"`

**C36** - `start` manda a todos o tabuleiro, `startsAt = now + 3000` e `endsAt = startsAt + seconds × 1000` (ROUND-01, AC 1)
Proof: `npx vitest run packages/core/src/room/round.test.ts -t "start sends the board and the round timestamps"`

**C37** - Cada celular recebe um salt novo e os prefixos de 6 bytes de todas as soluções; a TV não recebe nenhum dos dois, e nenhuma palavra vai em texto (ROUND-01, AC 2)
Proof: `npx vitest run packages/core/src/room/round.test.ts -t "phones get the salt and hash prefixes, never words"`

**C38** - Uma mensagem com vários caminhos recebe uma única resposta com o resultado de cada um, na ordem (ROUND-01, AC 3)
Proof: `npx vitest run packages/core/src/room/submit.test.ts -t "validates a batch in order and answers once"`

**C39** - Caminho antes de `startsAt` ou depois de `endsAt + 300 ms` dá `round-closed`; em `endsAt + 300 ms` vale (ROUND-01, AC 4)
Proof: `npx vitest run packages/core/src/room/submit.test.ts -t "accepts paths only between startsAt and endsAt + 300 ms"`

**C40** - Caminho de espectador dá `spectator` (ROUND-01, AC 5)
Proof: `npx vitest run packages/core/src/room/submit.test.ts -t "rejects paths from spectators"`

**C41** - O 11º caminho numa janela de 1 s, somando mensagens, dá `rate-limited` sem validar; o 10º vale (ROUND-01, AC 6)
Proof: `npx vitest run packages/core/src/room/submit.test.ts -t "rate-limits beyond 10 paths per second"`

**C42** - A TV recebe as contagens no máximo uma vez por 1.000 ms e só quando mudaram, sem palavras (ROUND-01, AC 7)
Proof: `npx vitest run packages/core/src/room/counts.test.ts -t "sends tv counts at most once per second when changed"`

**C43** - No fim da rodada a TV recebe as contagens finais antes do resultado (ROUND-01, AC 10)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "sends the final counts before the results"`

**C44** - O resultado traz as palavras em comum da menor para a maior, as únicas por jogador do menor para o maior placar acumulado, os pontos da rodada e o placar (RES-01, AC 1)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "orders shared words and players as specified"`

**C45** - Cada palavra traz as grafias reais, sem nada quando a única grafia é a forma normalizada (RES-01, AC 2)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "attaches real spellings only when they differ"`

**C46** - O resultado traz a maior palavra, o caminho dela e quem a achou (RES-01, AC 3)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "includes the longest word with its path and finders"`

**C47** - Um `time` com o timestamp do cliente recebe esse timestamp e o do servidor (ROUND-01, AC 9)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "answers a clock sync with both timestamps"`

**C48** - A rodada termina em `endsAt + 300 ms` pelo alarm, sem nenhum socket aberto (ROUND-01, AC 8)
Proof: `npx vitest run packages/server/test/alarms.test.ts -t "ends the round on the alarm with no socket open"`

**C28** - Quando o resultado começa e ainda há rodadas, o servidor pede o próximo tabuleiro (efeito `prepare-next`) antes de qualquer `next`; na última rodada, não pede (RES-01, AC 4)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "prepares the next board when rounds remain"`

**C49** - `next` no resultado começa a contagem da próxima rodada com o tabuleiro já preparado (RES-01, AC 5)
Proof: `npx vitest run packages/core/src/room/flow.test.ts -t "next starts the countdown with the prepared board"`

**C50** - `next` depois da última rodada manda o pódio do maior para o menor placar (RES-01, AC 6)
Proof: `npx vitest run packages/core/src/room/flow.test.ts -t "next after the last round sends the podium"`

**C51** - `play-again` volta ao lobby com os mesmos jogadores, cores, configurações e anfitrião, e placares zerados (RES-01, AC 7)
Proof: `npx vitest run packages/core/src/room/flow.test.ts -t "play-again returns to the lobby with zeroed scores"`

**C52** - `close-room` fecha a sala com `closed-by-host` (RES-01, AC 8)
Proof: `npx vitest run packages/core/src/room/flow.test.ts -t "close-room closes with closed-by-host"`

**C53** - `next`, `play-again` e `start` fora da fase dão `wrong-phase` (RES-01, AC 9)
Proof: `npx vitest run packages/core/src/room/flow.test.ts -t "rejects flow commands outside their phase"`

**C54** - Depois de uma resposta ao cliente, o estado que ela anuncia já está no storage (PERSIST-01, AC 1)
Proof: `npx vitest run packages/server/test/persistence.test.ts -t "stores the state before the client sees it"`

**C55** - Depois de `evictDurableObject` no meio da rodada, o DO reconstrói fase, configurações, jogadores, tokens, anfitrião, tabuleiro, palavras e placares (PERSIST-01, AC 2)
Proof: `npx vitest run packages/server/test/persistence.test.ts -t "rebuilds a room mid-round after eviction"`

**C56** - Com a eviction em modo `hibernate`, os sockets continuam abertos e o próximo envio funciona (PERSIST-01, AC 3)
Proof: `npx vitest run packages/server/test/persistence.test.ts -t "keeps sockets open across hibernation"`

**C57** - Fim da rodada, troca de anfitrião e expiração estão agendados no alarm do DO, sem timers em memória (PERSIST-01, AC 4)
Proof: `npx vitest run packages/server/test/alarms.test.ts -t "schedules every deadline on the durable object alarm"`

**C58** - `ping` recebe `pong` pela auto-response (RECON-01, AC 6)
Proof: `npx vitest run packages/server/test/room-do.test.ts -t "answers ping with pong through the auto-response"`

**C59** - Um celular com token válido recebe o estado completo, as palavras dele na rodada, o salt e os hashes (RECON-01, AC 1)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends the full state to a returning player"`

**C60** - Token de jogador desconhecido dá `bad-token` e fecha (RECON-01, AC 2)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "rejects an unknown player token"`

**C61** - Ao fechar, o jogador fica desconectado, todos são avisados, e pontos e palavras ficam (RECON-01, AC 3)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "marks a closed player disconnected and keeps their data"`

**C62** - Uma nova conexão com o mesmo token de jogador fecha a antiga com `replaced` (RECON-01, AC 4)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "a new player connection replaces the old one"`

**C63** - Com a TV desconectada, a rodada e o timer seguem sem pausa (RECON-01, AC 5)
Proof: `npx vitest run packages/core/src/room/deadlines.test.ts -t "keeps the round running while the TV is gone"`

**C64** - `readConfig` lê os dois tempos das vars, com padrões 30 e 10 (EXP-01, AC 1)
Proof: `npx vitest run packages/server/test/config.test.ts -t "reads both timeouts with defaults 30 and 10"`

**C67** - Sem ação de jogador ou anfitrião por `ROOM_IDLE_TIMEOUT_MIN`, a sala fecha com `idle`; clock sync não conta como ação (EXP-01, AC 2)
Proof: `npx vitest run packages/core/src/room/deadlines.test.ts -t "closes an idle room"`

**C68** - Sem TV por `TV_DISCONNECT_TIMEOUT_MIN`, a sala fecha com `tv-gone` (EXP-01, AC 3)
Proof: `npx vitest run packages/core/src/room/deadlines.test.ts -t "closes a room whose TV is gone"`

**C69** - Com uma variável em `0`, a regra correspondente nunca fecha a sala (EXP-01, AC 4)
Proof: `npx vitest run packages/core/src/room/deadlines.test.ts -t "never closes when a timeout is 0"`

**C66** - Ao fechar, a sala avisa e fecha todos os sockets, apaga o storage e libera o código (EXP-01, AC 5)
Proof: `npx vitest run packages/server/test/alarms.test.ts -t "closing notifies, closes sockets, wipes storage and frees the code"`

**C65** - Variável que não é inteiro ≥ 0 usa o padrão (EXP-01, AC 6)
Proof: `npx vitest run packages/server/test/config.test.ts -t "falls back to the default for invalid values"`

**C70** - O `core` exporta as listas de tipos de mensagem, códigos de erro e motivos exatamente como a spec (PROTO-01, AC 1)
Proof: `npx vitest run packages/core/src/room/protocol.test.ts -t "exports every message type, error code and reason"`

**C71** - JSON inválido, tipo desconhecido ou campo fora do formato dá `bad-message` sem mudar o estado (PROTO-01, AC 2)
Proof: `npx vitest run packages/core/src/room/protocol.test.ts -t "rejects malformed messages"`

**C72** - Mensagem de 4.097 bytes é recusada antes do parse; de 4.096 é lida (PROTO-01, AC 4)
Proof: `npx vitest run packages/core/src/room/protocol.test.ts -t "rejects messages over 4096 bytes before parsing"`

**C73** - Comando fora da fase dá `wrong-phase` sem mudar o estado (PROTO-01, AC 3)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "rejects every command outside its phase"`

**C74** - Todo tipo de mensagem, código e motivo é um termo em inglês em kebab-case da lista da spec (PROTO-01, AC 6)
Proof: `npx vitest run packages/core/src/room/protocol.test.ts -t "uses only the English protocol names"`

**C16** - Nenhuma mensagem a um celular antes do resultado contém palavra da rodada, exceto a aceita no próprio envio (PROTO-01, AC 5)
Proof: `npx vitest run packages/server/test/match.test.ts -t "never sends round words to phones before the results"`

**C75** - Uma palavra achada por dois jogadores vale para os dois e aparece em comum (edge case)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "a word found by two players is shared"`

**C76** - Uma palavra que o jogador já achou dá `already-found` (edge case)
Proof: `npx vitest run packages/core/src/room/submit.test.ts -t "rejects a word the player already found"`

**C77** - O servidor nunca manda texto de exibição: erros e fechamentos levam só códigos (PROTO-01, AC 7)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends codes, never display text"`

**C78** - Um jogador expulso no meio da rodada fica fora do resultado dela (edge case)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "leaves a player kicked mid-round out of the results"`

**C79** - Um jogador que desconecta no lobby continua na lista como desconectado (edge case)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "keeps a disconnected lobby player listed"`

**C80** - Os códigos sorteados só usam letras de `ABCDEFGHJKLMNPQRSTUVWXYZ` (ROOM-01, AC 1)
Proof: `npx vitest run packages/core/src/room/codes.test.ts -t "draws codes only from the unambiguous alphabet"`

**C81** - Uma TV e 3 celulares jogam uma partida de 2 rodadas do lobby ao "jogar de novo" (Success Criteria)
Proof: `npx vitest run packages/server/test/match.test.ts -t "plays a 2-round match with a TV and 3 phones"`

**C82** - Sem soluções no tabuleiro, o resultado vem sem maior palavra (edge case)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "has no longest word when the board has no solution"`

**C83** - Com todos desconectados, a rodada termina no alarm normalmente (edge case)
Proof: `npx vitest run packages/server/test/alarms.test.ts -t "ends the round on the alarm with no socket open"`

---

## Handoff

**Settled mid-build:** uma fase por vez, cada uma num subagente, com parada e pergunta ao user entre fases - user: "aprovo as tasks do M2, execute uma fase por vez com subagentes e pare entre as fases"
**Dispatched:** batch worker fase 1 (T1-T6) em HEAD fc23ee9
**Walked:** N/A - o M2 não tem tela; a partida completa é provada por C81

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4

Phase 1:  T1 ---→ T2 ---→ T3 ---→ T4 ---→ T5 ---→ T6
Phase 2:  T7 ---→ T8 ---→ T9 ---→ T10 --→ T11
Phase 3:  T12 --→ T13 --→ T14 --→ T15 --→ T16 --→ T17 --→ T18
Phase 4:  T19 --→ T20 --→ T21 --→ T22 --→ T23 --→ T24 --→ T25 --→ T26
```

Cada fase é um batch de subagente (6, 5, 7 e 8 tarefas). Os batches rodam em sequência e o orquestrador para entre eles para mostrar o resultado e perguntar, como no M1.
