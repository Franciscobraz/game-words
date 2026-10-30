# M4 TV Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/m4-tv/design.md`
**Status**: In Progress
**Approved**: 2026-10-30 - user: "Aprovo as tasks"
**Amended**: 2026-10-30 - T30 e C106-C108: espera progressiva e limite de tentativas; user: "no t30 bote um limite para tentaivas para que a tv nao fique tentando muito tempo, pode ter um tempo progressivo de espera a cada tentativa"
**Mutations**: 3
**Build**: `npx tsc -b; npm run lint -w @bwords/phone; npm run lint -w @bwords/tv; npx vitest run; npx playwright test; npx playwright test -c packages/phone/playwright.config.ts; npx playwright test -c packages/tv/playwright.config.ts`

### Regras de execução

- **Style guide:** todo código segue `docs/style-guide.md`: legibilidade (§3.1), SOLID (§4), componentes (§5), CSS só com flexbox e margens (§5.1), Signals (AD-015).
- **Limites exatos (L-001):** todo limite tem um teste no valor exato e um logo depois: 10 s do alerta, 60 s da rolagem, 3 e 4 jogadores no resultado, 5 e 6 jogadores na rodada.
- **Um caso por ramo de tabela (L-007):** `applyServerMessage`, `tvScreen` e `closeAction` têm um caso por ramo.
- **Nomes dos testes:** cada teste citado em `## Checks` usa exatamente o nome entre aspas da prova, porque `check_proofs.py` seleciona por `-t` (Vitest) e `-g` (Playwright).
- **Captures:** cada tela com capture é fotografada numa janela de 1920x1080, com os dados de exemplo da capture, em `captures/<capture>.running.png`. `tv-lobby` é tirada em 2x, para bater com os 3840x2160 da capture.
- **Diferenças pequenas:** diferenças como 10x10 px não contam (`context.md`).
- **Testes do M2 e M3:** só mudam os que o critério novo substitui (PROTO-02, PHONE-01, FAST-01), e o commit lista quais. Nenhum teste é enfraquecido.
- **Código em inglês (AD-001):** identificadores, nomes de teste e mensagens de commit em inglês; este arquivo em português.
- **Histórico:** subagentes nunca usam `rebase`, `--amend` em commit já registrado nem `push --force`.
- **Ambiente Windows:** os scripts da skill rodam com `PYTHONUTF8=1` e `PYTHONPATH` apontando para a pasta do `sitecustomize.py` (ver `.specs/STATE.md`).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/style-guide.md` §9, `vitest.config.ts`, `packages/phone/playwright.config.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Regras do `core` | unit | Todos os ramos; 1:1 com os ACs; limites exatos | `packages/core/src/**/*.test.ts` | `npx vitest run packages/core` |
| Regras da TV (`model/`) | unit | Todos os ramos; 1:1 com os ACs; todo edge case; limites exatos | `packages/tv/src/model/*.test.ts` | `npx vitest run packages/tv` |
| Estado da TV (`state/`, `device/`) | unit | Ações, conexão e erros com fakes | `packages/tv/src/{state,device}/*.test.ts` | `npx vitest run packages/tv` |
| Regras do celular (`model/`, `state/`) | unit | Só o que este marco muda | `packages/phone/src/**/*.test.ts` | `npx vitest run packages/phone` |
| Servidor (Worker, DO) | integration | Rotas e fluxo no workerd | `packages/server/test/*.test.ts` | `npx vitest run packages/server` |
| Assets reais | integration | Rotas e 404 com `wrangler dev` | `packages/server/e2e/*.test.ts` | `npx vitest run packages/server/e2e` |
| Telas da TV | e2e | Happy path + cada estado + erros, com Playwright | `packages/tv/e2e/*.spec.ts` | `npx playwright test -c packages/tv/playwright.config.ts` |
| Telas do celular | e2e | Só o que este marco muda | `packages/phone/e2e/*.spec.ts` | `npx playwright test -c packages/phone/playwright.config.ts` |
| Configuração e scripts | none | Build gate | - | Build gate |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tarefas só com testes unitários | `npx vitest run <pacote>` |
| Full | Tarefas com E2E | `npx vitest run <pacote>` e `npx playwright test -c <config do pacote> <arquivo>` |
| Build | Fim de fase ou tarefa só de configuração | `npx tsc -b; npm run lint -w @bwords/phone; npm run lint -w @bwords/tv; npx vitest run; npx playwright test; npx playwright test -c packages/phone/playwright.config.ts; npx playwright test -c packages/tv/playwright.config.ts` |

---

## Execution Plan

Phases run in order, and tasks run in order within a phase.

### Phase 1: Protocolo, servidor e celular

Muda as regras antes de existir a TV, com as provas do M2 e do M3 acompanhando.

```
T1 → T2 → T3 → T4 → T5 → T6
```

### Phase 2: Um endereço só

O Worker passa a servir os clientes.

```
T6 → T7 → T8
```

### Phase 3: Base da TV

O pacote, o estado e a abertura da sala.

```
T8 → T9 → T10 → T11 → T12
```

### Phase 4: Lobby

A primeira tela completa.

```
T12 → T13 → T14 → T15
```

### Phase 5: Contagem e rodada

Do "3" ao "Tempo!".

```
T15 → T16 → T17 → T18 → T19 → T20
```

### Phase 6: Palavras da rodada

A rolagem automática.

```
T20 → T21 → T22 → T23
```

### Phase 7: Resultado

O fim da rodada e da partida.

```
T23 → T24 → T25 → T26 → T27
```

### Phase 8: Fim da sala e conexão

A TV nunca fica presa.

```
T27 → T28 → T29 → T30
```

### Phase 9: Áudio

Os efeitos sintetizados.

```
T30 → T31 → T32 → T33
```

### Phase 10: Fechamento

As provas que cruzam as telas.

```
T33 → T34 → T35 → T36 → T37
```

---

## Task Breakdown

### T1: Shared finders and possible words

**What**: Em `round-results`, cada palavra em comum traz `foundBy`, e a mensagem traz `possibleWords`.
**Where**: `packages/core/src/room/results.ts` (modify)
**Depends on**: None
**Reuses**: `endRound`, `scoreRound`
**Requirement**: PROTO-02

**Done when**:

- [x] C1-C3
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): send finders and possible words in the results`

---

### T2: Match ends with the last round

**What**: A última rodada vai direto para o `podium`, com as vitórias contadas; quem reconecta recebe `round-results` e depois `podium`.
**Where**: `packages/core/src/room/flow.ts` (modify)
**Depends on**: T1
**Reuses**: `awardWins`, `podiumMessage`, `afterWelcome`
**Requirement**: PROTO-02

**Done when**:

- [x] C4-C7
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): end the match with the last round`

---

### T3: Remove fast mode from core

**What**: `fastMode` sai de `Settings`, é recusado com `bad-settings` e ignorado numa sala guardada.
**Where**: `packages/core/src/room/settings.ts` (modify)
**Depends on**: T2
**Reuses**: `validateSettingsPatch`
**Requirement**: FAST-01

**Done when**:

- [x] C8, C9
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(core): remove fast mode`

---

### T4: Remove fast mode from clients

**What**: O controle e o chip somem do celular, e a página de debug perde o campo.
**Where**: `packages/phone/src/components/SettingsPanel.tsx` (modify)
**Depends on**: T3
**Reuses**: `settingsChips` do celular
**Requirement**: FAST-01

**Done when**:

- [x] C10
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `refactor(phone): remove fast mode`

---

### T5: Phone goes straight to the podium

**What**: Na última rodada o celular abre o pódio, sem "VER PÓDIO"; os E2E de `podium`, `results` e `full-match` seguem o critério novo.
**Where**: `packages/phone/src/components/ResultHostActions.tsx` (modify)
**Depends on**: T4
**Reuses**: `screen.ts`, `match-summary.ts`
**Requirement**: PHONE-01

**Done when**:

- [x] C11-C14
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): open the podium after the last round`

---

### T6: Move shared client code to core

**What**: `room-connection`, `clock-sync` e `placesOf` vão para `packages/core/src/client/`, com os testes movidos junto.
**Where**: `packages/core/src/client/room-connection.ts` (create)
**Depends on**: T5
**Reuses**: `packages/phone/src/net/`
**Requirement**: TVROOM-01

**Done when**:

- [x] Testes do celular continuam verdes, mesma contagem
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `refactor(core): share the room connection with the clients`

---

### T7: Client routes

**What**: `clientAsset(pathname)` e o Worker servindo TV e celular, com 404 no resto.
**Where**: `packages/server/src/client-routes.ts` (create)
**Depends on**: T6
**Reuses**: `isRoomCode`
**Requirement**: SERVE-01

**Done when**:

- [x] C15-C19
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): serve the clients from the worker`

---

### T8: Assets build

**What**: `npm run assets:build` monta `packages/server/public/`; o `dev` do servidor copia o pacote antes do `wrangler dev`.
**Where**: `tools/assets-build/src/build.ts` (create)
**Depends on**: T7
**Reuses**: `tools/debug/launch.ts`
**Requirement**: SERVE-01

**Done when**:

- [x] `npm run debug` sobe com o pacote
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: none
**Gate**: build
**Commit**: `build(server): assemble the worker assets`

---

### T9: TV package

**What**: `packages/tv` com Vite (5176), eslint, Signals, fonte, tema e a escala por `rem`.
**Where**: `packages/tv/package.json` (create)
**Depends on**: T8
**Reuses**: `packages/phone` como modelo
**Requirement**: TVUI-01

**Done when**:

- [x] C20, C21
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): create the tv client`

---

### T10: Room view

**What**: `applyServerMessage` e `messages.ts`, com um caso por mensagem.
**Where**: `packages/tv/src/model/room-view.ts` (create)
**Depends on**: T9
**Reuses**: `packages/phone/src/model/room-view.ts`
**Requirement**: TVROOM-01

**Done when**:

- [x] Um caso por mensagem
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): reduce server messages to a room view`

---

### T11: Open the room

**What**: `createRoomStore`, `token-store` e `net/browser`: criar sala, voltar à sala, token recusado e tentar de novo.
**Where**: `packages/tv/src/state/room.ts` (create)
**Depends on**: T10
**Reuses**: `createRoomConnection`
**Requirement**: TVROOM-01

**Done when**:

- [x] C22-C26
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): open or resume the room`

---

### T12: Screen table

**What**: `tvScreen` e `app.tsx`, com uma tela vazia por fase.
**Where**: `packages/tv/src/model/screen.ts` (create)
**Depends on**: T11
**Reuses**: `packages/phone/src/model/screen.ts`
**Requirement**: TVUI-01

**Done when**:

- [x] Um caso por tela
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): choose the screen by phase`

---

### T13: Lobby rows and chips

**What**: `lobbySlots`, `settingsChips` e `changedChip`.
**Where**: `packages/tv/src/model/lobby-rows.ts` (create)
**Depends on**: T12
**Reuses**: `crownedPlayers`
**Requirement**: TVLOBBY-01

**Done when**:

- [x] C27-C31
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): build the lobby rows and chips`

---

### T14: QR code

**What**: `qrMatrix` e `QrCode`, com o "B" no centro.
**Where**: `packages/tv/src/model/qr.ts` (create)
**Depends on**: T13
**Reuses**: `qrcode-generator`
**Requirement**: TVLOBBY-01

**Done when**:

- [x] C32
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): draw the room qr code`

---

### T15: Lobby screen

**What**: `LobbyScreen`, com a foto `captures/tv-lobby.running.png` da capture `.specs/features/m4-tv/captures/tv-lobby.png`.
**Where**: `packages/tv/src/screens/LobbyScreen.tsx` (create)
**Depends on**: T14
**Reuses**: `BrandHeader`, `PlayerCircle`
**Requirement**: TVLOBBY-01

**Done when**:

- [x] C33-C37
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): show the lobby`

---

### T16: Clock

**What**: `formatClock`, `isAlert` e `countdownNumber`.
**Where**: `packages/tv/src/model/clock.ts` (create)
**Depends on**: T15
**Reuses**: `serverNow`
**Requirement**: TVPLAY-01

**Done when**:

- [x] C38-C40
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): format the round clock`

---

### T17: Round columns

**What**: `roundColumns`, sem espectadores, com 5 linhas à esquerda.
**Where**: `packages/tv/src/model/round-columns.ts` (create)
**Depends on**: T16
**Reuses**: `counts`
**Requirement**: TVPLAY-01

**Done when**:

- [x] C41-C44
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): split the round players in two columns`

---

### T18: Countdown screen

**What**: `CountdownScreen`, sem letras do tabuleiro.
**Where**: `packages/tv/src/screens/CountdownScreen.tsx` (create)
**Depends on**: T17
**Reuses**: `countdownNumber`
**Requirement**: TVPLAY-01

**Done when**:

- [x] C45
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): show the countdown`

---

### T19: Round screen

**What**: `RoundScreen` e `BoardGrid`, com a foto `captures/tv-round.running.png` da capture `.specs/features/m4-tv/captures/tv-round.png`.
**Where**: `packages/tv/src/screens/RoundScreen.tsx` (create)
**Depends on**: T18
**Reuses**: `roundColumns`
**Requirement**: TVPLAY-01

**Done when**:

- [x] C46-C48
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): show the round`

---

### T20: Time up

**What**: `TimeUpOverlay`: "0:00", tabuleiro esmaecido e "Tempo!" por 2 s.
**Where**: `packages/tv/src/components/TimeUpOverlay.tsx` (create)
**Depends on**: T19
**Reuses**: `RoundScreen`
**Requirement**: TVPLAY-01

**Done when**:

- [x] C49
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): mark the end of the round`

---

### T21: Reveal plan

**What**: `scrollDurationMs` e `revealStage`, com relógio falso.
**Where**: `packages/tv/src/model/reveal.ts` (create)
**Depends on**: T20
**Reuses**: -
**Requirement**: TVWORDS-01

**Done when**:

- [x] C50-C54
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): plan the stages after the round`

---

### T22: Word rows

**What**: `wordRows`: títulos, ordem, grafias e quem achou.
**Where**: `packages/tv/src/model/word-rows.ts` (create)
**Depends on**: T21
**Reuses**: `round-results`
**Requirement**: TVWORDS-01

**Done when**:

- [x] C55-C58
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): order the found words`

---

### T23: Words screen

**What**: `WordsScreen`, com a foto `captures/tv-words.running.png` da capture `.specs/features/m4-tv/captures/tv-words.png`.
**Where**: `packages/tv/src/screens/WordsScreen.tsx` (create)
**Depends on**: T22
**Reuses**: `PlayerCircle`
**Requirement**: TVWORDS-01

**Done when**:

- [x] C59-C64
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): scroll the found words`

---

### T24: Standings

**What**: `standings`: até 3 no topo e os outros abaixo, com posições e empate.
**Where**: `packages/tv/src/model/standings.ts` (create)
**Depends on**: T23
**Reuses**: `placesOf`
**Requirement**: TVRES-01

**Done when**:

- [x] C65-C67
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): rank the players for the result`

---

### T25: Result header

**What**: `resultHeader`: título, rodapé, confete e empate.
**Where**: `packages/tv/src/model/result-header.ts` (create)
**Depends on**: T24
**Reuses**: `round-results.last`
**Requirement**: TVRES-01

**Done when**:

- [x] C68-C70
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): choose the result title and footer`

---

### T26: Lit tiles

**What**: `litTiles`: uma peça a cada 400 ms, na ordem da palavra.
**Where**: `packages/tv/src/model/lit-tiles.ts` (create)
**Depends on**: T25
**Reuses**: `longest.path`
**Requirement**: TVRES-01

**Done when**:

- [x] C71
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): light the longest word tile by tile`

---

### T27: Result screen

**What**: `ResultScreen`, com a foto `captures/tv-round-result.running.png` da capture `.specs/features/m4-tv/captures/tv-round-result.png`.
**Where**: `packages/tv/src/screens/ResultScreen.tsx` (create)
**Depends on**: T26
**Reuses**: `BoardGrid`, `QrCode`
**Requirement**: TVRES-01

**Done when**:

- [x] C72-C78
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): show the result`

---

### T28: Room end rules

**What**: `closeAction` por motivo e sua ligação ao store.
**Where**: `packages/tv/src/state/room.ts` (modify)
**Depends on**: T27
**Reuses**: `createRoomStore`
**Requirement**: TVEXIT-01

**Done when**:

- [x] C79-C82
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): decide what happens when the room ends`

---

### T29: Exit screens

**What**: `ExpiredScreen` e `ReplacedScreen`.
**Where**: `packages/tv/src/screens/ExpiredScreen.tsx` (create)
**Depends on**: T28
**Reuses**: `BrandHeader`
**Requirement**: TVEXIT-01

**Done when**:

- [x] C83
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): show the expired and replaced screens`

---

### T30: Connection banner

**What**: `ConnectionBanner`: "Reconectando…", "Sem conexão" e a volta, com espera progressiva e limite de 10 min (`model/reconnect.ts`).
**Where**: `packages/tv/src/components/ConnectionBanner.tsx` (create)
**Depends on**: T29
**Reuses**: `ConnectionStatus`
**Requirement**: TVEXIT-01

**Done when**:

- [x] C84-C86, C103, C106-C108
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): show the connection state`

---

### T31: Audio cues

**What**: `cuesBetween`: início, 10 s, apito e rolagem.
**Where**: `packages/tv/src/model/audio-cues.ts` (create)
**Depends on**: T30
**Reuses**: `revealStage`
**Requirement**: TVAUDIO-01

**Done when**:

- [x] C87, C88
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): decide which sound plays`

---

### T32: Audio device

**What**: `createAudio`, com volume, mudo, bloqueio e navegador sem Web Audio.
**Where**: `packages/tv/src/device/audio.ts` (create)
**Depends on**: T31
**Reuses**: bipe de `packages/phone/src/device/`
**Requirement**: TVAUDIO-01

**Done when**:

- [x] C89-C91
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): synthesize the sounds`

---

### T33: Audio notice

**What**: `AudioNotice` no lobby e a liberação na primeira tecla ou clique.
**Where**: `packages/tv/src/components/AudioNotice.tsx` (create)
**Depends on**: T32
**Reuses**: `createAudio`
**Requirement**: TVAUDIO-01

**Done when**:

- [x] C92
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): ask to unlock the sound`

---

### T34: Layout audit

**What**: `e2e/layout.spec.ts` com todas as telas de 1280x720 a 1920x1080, os edge cases e a auditoria do CSS.
**Where**: `packages/tv/e2e/layout.spec.ts` (create)
**Depends on**: T33
**Reuses**: `packages/phone/e2e/layout.spec.ts`
**Requirement**: TVUI-01

**Done when**:

- [x] C93-C103
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `test(tv): check every screen at every size`

---

### T35: Full match

**What**: Partida de 2 rodadas com a TV e 3 celulares reais, contra o Worker servindo os dois clientes.
**Where**: `packages/tv/e2e/full-match.spec.ts` (create)
**Depends on**: T34
**Reuses**: `packages/phone/e2e/phones.ts`
**Requirement**: TVRES-01

**Done when**:

- [x] C104
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `test(tv): play a whole match through the worker`

---

### T36: Uncaptured pictures

**What**: Fotos a 1920x1080 das telas sem capture em `captures/uncaptured/`, para o user aprovar.
**Where**: `packages/tv/e2e/uncaptured.picture.ts` (create)
**Depends on**: T35
**Reuses**: `packages/phone/e2e/uncaptured.picture.ts`
**Requirement**: TVUI-01

**Done when**:

- [x] Fotos em `captures/uncaptured/`
- [ ] C105: falta a aprovação do user
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `test(tv): take the pictures of the screens without a capture`

---

### T37: Update project docs

**What**: `docs/DESIGN.md`, `docs/screens.md` e `CLAUDE.md` seguem AD-019 a AD-022 e a porta 5176.
**Where**: `docs/DESIGN.md` (modify)
**Depends on**: T36
**Reuses**: -
**Requirement**: TVUI-01

**Done when**:

- [x] Documentos sem fast mode nem as quatro etapas
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: none
**Gate**: build
**Commit**: `docs: record the tv decisions`

---

## Checks

Os testes Vitest ficam ao lado do módulo; os E2E da TV em `packages/tv/e2e/*.spec.ts`.

**C1** - Cada palavra em comum de `round-results` traz os jogadores que a acharam (PROTO-02, AC 1)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "lists who found each shared word"`

**C2** - `round-results` traz o total de soluções da rodada, com o mínimo e o filtro da sala (PROTO-02, AC 2)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "counts the possible words with the room minimum and filter"`

**C3** - Nenhuma mensagem anterior ao fim da rodada traz `foundBy` ou `possibleWords` (PROTO-02, AC 3)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "sends finders and possible words only in the results"`

**C4** - A última rodada termina em `podium`, com `round-results` antes de `podium`, sem `next` (PROTO-02, AC 4)
Proof: `npx vitest run packages/core/src/room/flow.test.ts -t "ends the match when the last round ends"`

**C5** - Quem se conecta no `podium` recebe `round-results` e depois `podium` (PROTO-02, AC 5)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends the last results and the podium after the welcome"`

**C6** - `next` no `podium` recebe `wrong-phase` (PROTO-02, AC 6)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "refuses next on the podium"`

**C7** - A vitória conta quando a última rodada termina, e numa partida com 0 pontos ninguém vence (PROTO-02, AC 7)
Proof: `npx vitest run packages/core/src/room/flow.test.ts -t "counts the wins when the last round ends"`

**C8** - `fastMode` num `settings` recebe `bad-settings` (FAST-01, AC 1)
Proof: `npx vitest run packages/core/src/room/settings.test.ts -t "refuses fast mode as an unknown setting"`

**C9** - Uma sala guardada com `fastMode` carrega sem o campo (FAST-01, AC 4)
Proof: `npx vitest run packages/core/src/room/settings.test.ts -t "drops fast mode from stored settings"`

**C10** - O lobby do anfitrião não tem o controle nem o chip de fast mode (FAST-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "has no fast mode control"`

**C11** - Ao fim da última rodada, o celular mostra o pódio com o resumo somando essa rodada (PHONE-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "opens the podium when the last round ends"`

**C12** - O celular não tem "VER PÓDIO" em nenhuma rodada (PHONE-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "never offers to see the podium"`

**C13** - Com mais rodadas, o resultado aparece com "PRÓXIMA RODADA" (PHONE-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "next round button names the next round"`

**C14** - "JOGAR DE NOVO" e "Voltar ao Lobby" no pódio mandam `play-again` e `back-to-lobby` (PHONE-01, AC 4)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "host buttons send play again and back to lobby"`

**C15** - `GET /tv` responde com a TV (SERVE-01, AC 1)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "serves the tv at /tv"`

**C16** - `GET /` e `GET /KBXT` respondem com o celular (SERVE-01, AC 2)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "serves the phone at the root and at a room code"`

**C17** - Os JS, CSS e fontes dos dois clientes respondem 200 (SERVE-01, AC 3)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "serves the client files"`

**C18** - `GET /pt-BR/dict.bin` e os outros arquivos do pacote respondem 404 (SERVE-01, AC 4)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "never serves the language pack"`

**C19** - `POST /api/rooms` e o WebSocket seguem como no M2 (SERVE-01, AC 5)
Proof: `npx vitest run packages/server/test/worker.test.ts -t "keeps the room api routes"`

**C20** - A TV embute a fonte e não pede nada a outro domínio (TVUI-01, AC 6)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "loads nothing from another origin"`

**C21** - A raiz escala: 16 px em 1920x1080 e cerca de 10,67 px em 1280x720 (TVUI-01, AC 1)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "scales the root font with the screen"`

**C22** - Sem token, a TV cria a sala e mostra o lobby dela (TVROOM-01, AC 1)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "creates a room when there is no token"`

**C23** - Com token válido, a TV volta à sala, na fase atual (TVROOM-01, AC 2)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "resumes the room of a saved token"`

**C24** - Com `bad-token` ou `room-not-found`, a TV apaga o token e cria outra sala (TVROOM-01, AC 3)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "creates a new room when the token is refused"`

**C25** - O token só vai no `hello`, nunca na URL (TVROOM-01, AC 4)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "sends the token only in the hello"`

**C26** - Se a criação falha, aparece "Não foi possível abrir a sala" e há nova tentativa a cada 5 s (TVROOM-01, AC 5)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "retries every 5 seconds when the room cannot be created"`

**C27** - `lobbySlots` traz os jogadores e o contador "N / 10" (TVLOBBY-01, AC 4)
Proof: `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "lists the players with the count"`

**C28** - Jogador desconectado vem esmaecido, com "DESCONECTADO" (TVLOBBY-01, AC 5)
Proof: `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "marks a disconnected player"`

**C29** - O anfitrião tem a etiqueta, e a coroa vai para quem mais venceu, todos no empate (TVLOBBY-01, AC 6)
Proof: `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "tags the host and crowns the leaders"`

**C30** - As vagas completam 10, de 0 a 10 jogadores (TVLOBBY-01, AC 7)
Proof: `npx vitest run packages/tv/src/model/lobby-rows.test.ts -t "fills the free slots up to ten"`

**C31** - `changedChip` aponta o chip da configuração alterada (TVLOBBY-01, AC 8)
Proof: `npx vitest run packages/tv/src/model/settings-chips.test.ts -t "finds the chip of the changed setting"`

**C32** - Um leitor de QR lê `<origem>/KBXT` na foto do lobby, com o "B" no centro (TVLOBBY-01, AC 2)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "the qr code reads the room address"`

**C33** - O lobby é a tela em `captures/tv-lobby.png`, ao abrir a TV (TVLOBBY-01, AC 1)
Proof: browser captures/tv-lobby.running.png

**C34** - O lobby mostra o código e "ou acesse <endereço> e digite o código", com o endereço real (TVLOBBY-01, AC 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the code and the real address"`

**C35** - Quando o anfitrião muda uma configuração, o chip mostra o valor novo e pulsa (TVLOBBY-01, AC 8)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "mirrors a settings change"`

**C36** - O rodapé diz "Aguardando <anfitrião> iniciar a partida…" (TVLOBBY-01, AC 9)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "waits for the host in the footer"`

**C37** - Sem jogadores: "Ninguém entrou ainda", "0 / 10", 10 vagas e "O primeiro a entrar vira anfitrião(ã)" (TVLOBBY-01, AC 10)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the empty lobby"`

**C38** - `formatClock` dá "M:SS": 1:44, 0:10, 0:00 (TVPLAY-01, AC 3)
Proof: `npx vitest run packages/tv/src/model/clock.test.ts -t "formats the clock as minutes and seconds"`

**C39** - `isAlert` é verdadeiro com 10 s e falso com 10,001 s (TVPLAY-01, AC 4)
Proof: `npx vitest run packages/tv/src/model/clock.test.ts -t "alerts from ten seconds down"`

**C40** - `countdownNumber` dá 3, 2 e 1 antes do `startsAt` (TVPLAY-01, AC 1)
Proof: `npx vitest run packages/tv/src/model/clock.test.ts -t "counts down to the start"`

**C41** - "1 palavra" no singular e "N palavras" no plural (TVPLAY-01, AC 6)
Proof: `npx vitest run packages/tv/src/model/round-columns.test.ts -t "says word in the singular for one"`

**C42** - A lista da rodada não tem espectadores (TVPLAY-01, AC 7)
Proof: `npx vitest run packages/tv/src/model/round-columns.test.ts -t "leaves the spectators out"`

**C43** - 5 jogadores ficam na esquerda, e o 6º vai para a direita (TVPLAY-01, AC 9)
Proof: `npx vitest run packages/tv/src/model/round-columns.test.ts -t "moves the sixth player to the right column"`

**C44** - Jogador desconectado na rodada vem esmaecido, com "DESCONECTADO" (TVPLAY-01, AC 8)
Proof: `npx vitest run packages/tv/src/model/round-columns.test.ts -t "marks a disconnected player"`

**C45** - Antes do `startsAt`, a TV mostra "RODADA N DE M" e o número, sem nenhuma letra do tabuleiro (TVPLAY-01, AC 1)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "hides the board during the countdown"`

**C46** - A partir do `startsAt`, a TV mostra a tela em `captures/tv-round.png` (TVPLAY-01, AC 2)
Proof: browser captures/tv-round.running.png

**C47** - Uma mensagem `counts` atualiza o número de cada jogador, sem nenhuma palavra na tela (TVPLAY-01, AC 5)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "updates the word counts without the words"`

**C48** - Tabuleiros 5x5 e 6x6 ficam no mesmo quadrado (TVPLAY-01, AC 11)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "fits larger boards in the same square"`

**C49** - No `endsAt`: "0:00", tabuleiro esmaecido e "Tempo!", por 2 s (TVPLAY-01, AC 10)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/round.spec.ts -g "marks the end of the round for two seconds"`

**C50** - `revealStage` dá "time-up" até 2 s depois do `endsAt` e "words" no instante seguinte (TVWORDS-01, AC 1)
Proof: `npx vitest run packages/tv/src/model/reveal.test.ts -t "starts the words two seconds after the end"`

**C51** - `scrollDurationMs` usa 2 palavras por segundo: 10 palavras dão 5 s (TVWORDS-01, AC 6)
Proof: `npx vitest run packages/tv/src/model/reveal.test.ts -t "scrolls two words per second"`

**C52** - A rolagem para em 60 s: 120 palavras dão 60 s, e 121 ou 500 também (TVWORDS-01, AC 7)
Proof: `npx vitest run packages/tv/src/model/reveal.test.ts -t "never scrolls for more than sixty seconds"`

**C53** - `revealStage` dá "hold" por 5 s depois da rolagem e "result" no instante seguinte (TVWORDS-01, AC 8)
Proof: `npx vitest run packages/tv/src/model/reveal.test.ts -t "holds for five seconds after the last word"`

**C54** - Com 0 palavras, a rolagem dura 0 e o resultado vem 5 s depois (TVWORDS-01, AC 9)
Proof: `npx vitest run packages/tv/src/model/reveal.test.ts -t "waits five seconds when no word was found"`

**C55** - `wordRows` traz as palavras em comum e depois as únicas, com os títulos (TVWORDS-01, AC 3)
Proof: `npx vitest run packages/tv/src/model/word-rows.test.ts -t "lists shared words before unique words"`

**C56** - Cada grupo vai da menor para a maior e, no mesmo tamanho, em ordem alfabética (TVWORDS-01, AC 4)
Proof: `npx vitest run packages/tv/src/model/word-rows.test.ts -t "orders each group by length and then by letter"`

**C57** - Cada linha traz a palavra, as grafias, quem achou e os pontos (TVWORDS-01, AC 5)
Proof: `npx vitest run packages/tv/src/model/word-rows.test.ts -t "fills each row with spellings finders and points"`

**C58** - Um jogador removido continua nas palavras dele (Edge Cases)
Proof: `npx vitest run packages/tv/src/model/word-rows.test.ts -t "keeps the words of a kicked player"`

**C59** - A página de palavras é a tela em `captures/tv-words.png`, depois de "Tempo!" (TVWORDS-01, AC 1)
Proof: browser captures/tv-words.running.png

**C60** - A faixa do total de possíveis e de encontradas não sai do lugar durante a rolagem (TVWORDS-01, AC 2)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "keeps the totals in place while scrolling"`

**C61** - A lista rola sozinha, e a última palavra aparece inteira ao fim da duração (TVWORDS-01, AC 6)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "scrolls until the last word is in view"`

**C62** - Sem palavras, aparece "Nenhuma palavra encontrada" (TVWORDS-01, AC 9)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "says when no word was found"`

**C63** - `next`, `play-again` ou `back-to-lobby` interrompem a rolagem (TVWORDS-01, AC 10)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "follows the host during the scroll"`

**C64** - Recarregar a TV recomeça a rolagem (TVWORDS-01, AC 11)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "restarts the scroll after a reload"`

**C65** - `standings` traz até 3 no topo, com posições e pontos (TVRES-01, AC 2)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "puts up to three players on top"`

**C66** - Com 3 jogadores não há lista, e com 4 o 4º está nela (TVRES-01, AC 3)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "lists the others from the fourth player"`

**C67** - Empates repartem a posição, e quem entrou atrasado vai por último (TVRES-01, AC 3)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "shares places on a tie and keeps late players last"`

**C68** - Com mais rodadas: "Resultado · Rodada N de M" e "Aguardando <anfitrião> avançar…" (TVRES-01, AC 8)
Proof: `npx vitest run packages/tv/src/model/result-header.test.ts -t "shows the round between rounds"`

**C69** - Na última: "<vencedor> venceu!", confete e "Aguardando <anfitrião>: jogar de novo ou voltar ao lobby" (TVRES-01, AC 9)
Proof: `npx vitest run packages/tv/src/model/result-header.test.ts -t "shows the winner after the last round"`

**C70** - Empate na última rodada: "Empate!" (TVRES-01, AC 10)
Proof: `npx vitest run packages/tv/src/model/result-header.test.ts -t "shows a tie after the last round"`

**C71** - `litTiles` acende 1 peça em 0 ms, 2 em 400 ms e todas ao fim, na ordem do caminho (TVRES-01, AC 5)
Proof: `npx vitest run packages/tv/src/model/lit-tiles.test.ts -t "lights one tile every 400 ms in path order"`

**C72** - O resultado é a tela em `captures/tv-round-result.png`, depois da página de palavras (TVRES-01, AC 1)
Proof: browser captures/tv-round-result.running.png

**C73** - Desconectado aparece com "(desconectado)" (TVRES-01, AC 4)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "marks a disconnected player"`

**C74** - O cartão traz "A maior palavra do tabuleiro", a palavra, as grafias e quem achou (TVRES-01, AC 6)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows who found the longest word"`

**C75** - Sem ninguém: "Ninguém encontrou", com a palavra marcada (TVRES-01, AC 6)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "says when nobody found the longest word"`

**C76** - Sem palavra mais longa, não há peças acesas nem cartão (TVRES-01, AC 7)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "hides the card when the board has no longest word"`

**C77** - O QR pequeno lê `<origem>/KBXT` (TVRES-01, AC 11)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "the small qr code reads the room address"`

**C78** - `next`, `play-again` e `back-to-lobby` levam à contagem ou ao lobby (TVRES-01, AC 12)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "follows the host out of the result"`

**C79** - `closed-by-host` apaga o token e abre sala nova (TVEXIT-01, AC 1)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "opens a new room when the host closes it"`

**C80** - `idle` e `tv-gone` apagam o token e não criam sala (TVEXIT-01, AC 2)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "waits on the expired screen without creating a room"`

**C81** - Tecla ou clique em "Sala expirada" abrem sala nova (TVEXIT-01, AC 3)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "opens a new room when asked on the expired screen"`

**C82** - `replaced` para de reconectar (TVEXIT-01, AC 4)
Proof: `npx vitest run packages/tv/src/state/room.test.ts -t "stops reconnecting when replaced"`

**C83** - "Sala expirada" e a tela de outra aba mostram os textos do spec (TVEXIT-01, AC 2)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/exit.spec.ts -g "shows the expired and replaced screens"`

**C84** - Com o socket cortado, a tela fica e aparece "Reconectando…" (TVEXIT-01, AC 5)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "keeps the screen with the reconnecting banner"`

**C85** - Depois de 30 s aparece "Sem conexão", e a TV segue tentando (TVEXIT-01, AC 6)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "shows no connection after thirty seconds"`

**C86** - Quando a conexão volta, a faixa some e o estado é o atual (TVEXIT-01, AC 7)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "removes the banner when the connection returns"`

**C87** - `cuesBetween` toca início, 10 s, apito e rolagem, cada um uma vez (TVAUDIO-01, AC 1)
Proof: `npx vitest run packages/tv/src/model/audio-cues.test.ts -t "plays each cue once"`

**C88** - "Tempo!" toca o apito (TVAUDIO-01, AC 6)
Proof: `npx vitest run packages/tv/src/model/audio-cues.test.ts -t "whistles when the time is up"`

**C89** - Os efeitos usam o volume da sala e nada toca no mudo (TVAUDIO-01, AC 2)
Proof: `npx vitest run packages/tv/src/device/audio.test.ts -t "follows the room volume and mute"`

**C90** - `isBlocked` reflete o contexto suspenso, e `unlock` o retoma (TVAUDIO-01, AC 4)
Proof: `npx vitest run packages/tv/src/device/audio.test.ts -t "unlocks a suspended context"`

**C91** - Sem Web Audio, nada toca e nada lança erro (TVAUDIO-01, AC 5)
Proof: `npx vitest run packages/tv/src/device/audio.test.ts -t "does nothing without web audio"`

**C92** - Com o som bloqueado, o lobby mostra o aviso, que some na primeira tecla (TVAUDIO-01, AC 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "asks to unlock the sound"`

**C93** - Toda tela cabe de 1280x720 a 1920x1080, sem rolagem e sem texto cortado (TVUI-01, AC 1)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "fits every screen from 720p to 1080p"`

**C94** - O CSS não usa Grid nem `gap` (TVUI-01, AC 2)
Proof: `npx vitest run packages/tv/src/styles/audit.test.ts -t "uses only flexbox and margins"`

**C95** - As animações usam só `transform` e `opacity` (TVUI-01, AC 3)
Proof: `npx vitest run packages/tv/src/styles/audit.test.ts -t "animates only transform and opacity"`

**C96** - Nenhuma cor literal fora de `@bwords/theme`, exceto a do jogador (TVUI-01, AC 4)
Proof: `npx vitest run packages/tv/src/styles/audit.test.ts -t "has no literal colors"`

**C97** - Todo texto sai da tabela de strings, na forma neutra (TVUI-01, AC 5)
Proof: `npx vitest run packages/tv/src/strings/pt-BR.test.ts -t "has a neutral text for every code"`

**C98** - Nenhuma tela tem os textos de enfeite do Stitch nem o chip de fast mode (TVUI-01, AC 7; FAST-01, AC 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "has none of the decorative texts"`

**C99** - Apelido de 12 caracteres aparece inteiro em toda tela (Edge Cases)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "shows a twelve letter nickname whole"`

**C100** - 10 jogadores cabem em toda tela (Edge Cases)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "fits ten players on every screen"`

**C101** - Com 1 jogador, só o cartão do 1º no resultado (Edge Cases)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "shows a single card for one player"`

**C102** - Muitas grafias não empurram os círculos para fora (Edge Cases)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/layout.spec.ts -g "keeps the circles in place with many spellings"`

**C103** - Reconectar na contagem ou na rodada mostra o tempo certo (Edge Cases)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "shows the right time after reconnecting"`

**C104** - Uma partida de 2 rodadas com a TV e 3 celulares vai de `/tv` a "JOGAR DE NOVO", pelo Worker (TVRES-01, AC 12)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/full-match.spec.ts -g "plays a whole match through the worker"`

**C105** - As fotos de lobby vazio, contagem, Tempo!, reconectando, sem conexão, sala expirada e outra aba foram aprovadas pelo user (TVUI-01, AC 7)
Proof: walk - cada foto de `captures/uncaptured/` mostrada ao user, com a resposta dele em `**Settled mid-build:**`; defaults da fase 1 aceitos (pódio do celular abre com `results.last`, `foundBy` em ordem de entrada, limpeza do que só o fast mode usava, debug sem as palavras da última rodada) e histórico mantido com os commits intermediários vermelhos; user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults da fase 1 e sigo para as fases 2 e 3?"); defaults das fases 2 e 3 aceitos (`/kbxt` em minúsculas, tela `open-failed`, token em `bwords.tv.room`, `assets:build` só gera o pacote se faltar, `/assets/` só com nomes simples, `open-room.spec.ts` a mais); user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults e sigo para as fases 4 e 5 (lobby e rodada)?"); defaults das fases 4 e 5 aceitos (vitórias no lobby, chips, ordem de entrada na rodada, "Ninguém entrou ainda" à direita, contagem sem logo, "Tempo!" em dourado) e o QR do resultado maior que o da rodada, para ser legível (C77); user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults e sigo para as fases 6 e 7 (palavras e resultado)?"); o teste de "Tempo!" (C49) ganha uma tolerância só no teste, e o jogo continua trocando de tela em 2 s exatos; user: "coloque uma tolerancia só para o teste. e eu autorizo seguir"; o E2E de "Tempo!" confere só o comportamento, e o limite exato fica no teste unitário; user: "Sim, simplificar"


**C106** - A espera entre tentativas é 0,5 s, 1 s, 2 s, 4 s, 8 s, 16 s, 32 s e depois sempre 60 s (TVEXIT-01, AC 8)
Proof: `npx vitest run packages/tv/src/model/reconnect.test.ts -t "waits longer after each attempt up to one minute"`

**C107** - Com 10 min sem reconectar a TV para de tentar, e com 9 min 59 s ainda tenta (TVEXIT-01, AC 9)
Proof: `npx vitest run packages/tv/src/model/reconnect.test.ts -t "stops trying after ten minutes"`

**C108** - Depois do limite, a tela pede "OK", e uma tecla recomeça as tentativas (TVEXIT-01, AC 9, 10)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "tries again after giving up"`

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** execução com subagentes, um batch por vez, com parada entre eles (preferência do user no M3, repetida na apresentação das tarefas); user: "Aprovo as tasks"; defaults das fases 6 e 7 aceitos (lista anda só o que não cabe, "Ana e Beto encontraram!", todos com 0 dão "Empate!", coroa do cartão só com pontos, atrasado pode ocupar cartão, sem anfitrião o rodapé some, removido mantém o círculo); user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults e sigo para as fases 8 e 9 (fim da sala, conexão e áudio)?"); defaults das fases 8 e 9 aprovados em nome do user, conforme `auto-approved.md`, e fase 10 iniciada sem parada; user: "Eu vou precisar sair, pode aprovar os defaults das fases 8 e 9 automaticamente, gerar uma anotação do que foi aprovado, e iniciar a fase 10 automaticamente, quando voltar vejo se tudo terminou."
**Dispatched:** batch worker fase 1 (T1-T6) a partir de 5440218 - returned (T1 0fda5dc, T2 7c15cd2, T3 6d72757, T4 dc71406, T5 07f7142, T6 59539e6; vitest 749, phone e2e 79, tsc e lint verdes, conferidos pelo orquestrador em 59539e6). Nos commits intermediários, o gate quick deixou tsc vermelho em 6d72757 e o full-match do celular vermelho de 7c15cd2 até 07f7142; a partir da fase 2, todo commit passa pelo gate do CLAUDE.md. Defaults a confirmar: com `results.last` o celular já escolhe `podium`, com o pódio vazio por um instante; `foundBy` em ordem de entrada na sala; saíram `BoltIcon`, a prop `hint` do `Toggle` e `.toggle__hint`; `HashFrame` subiu para o core; `tools/debug` não mostra as palavras da última rodada. Para a T11: `createRoomConnection` precisa de uma opção para `hello` com `role: tv`, e `bad-token` chega como `error` antes do fechamento do socket; batch worker fases 2 e 3 (T7-T12) a partir de 59539e6 + este registro - returned (T7 44b5499, T8 6d8c749, T9 b51c62d, T10 13a54cb, T11 ce44dd1, T12 3880fd0; vitest 846, tv e2e 5, phone e2e 79, play e2e 10, tsc e lint verdes, conferidos pelo orquestrador em 3880fd0 pelo exit code). O binding responde 307 em `/tv/index.html`, então `clientAsset` devolve as pastas `/tv/` e `/phone/`. Defaults a confirmar: `/kbxt` em minúsculas abre o celular; `/assets/` aceita só nomes simples; `assets:build` gera o pacote só se faltar; token em `bwords.tv.room`; tela `open-failed` nova; `e2e/open-room.spec.ts` a mais. Para a T30: `goOffline` para de tentar, e TVEXIT-01 AC 6 pede continuar. E2E: conferir as portas 8787 e 9229 livres antes de rodar; batch worker fases 4 e 5 (T13-T20) a partir de 3880fd0 + este registro - returned (T13 123007a, T14 09cf7b7, T15 2db15ca, T16 e9aa4f2, T17 682dd96, T18 156ac24, T19 2b818e2, T20 316f127; vitest 883, tv e2e 23, tsc e lint verdes, conferidos pelo orquestrador em 316f127; phone e2e 79 e play e2e 10 pelo worker). Fotos `tv-lobby` e `tv-round`. Defaults a confirmar: "0 vitórias" sem status; espectador desconectado como DESCONECTADO; chip "Tempo 1:30"; "Palavrões liberados"; rodada em ordem de entrada; "Ninguém entrou ainda" à direita do título; contagem sem logo, número laranja; "Tempo!" em dourado com tabuleiro a 25%. Para a T21: `app.tsx` passa `stage = null`, então no servidor real "Tempo!" ainda não dura 2 s. Para a T27: QR pequeno de 44 px quase não é legível, e C77 exige leitura; batch worker fases 6 e 7 (T21-T27) a partir de 316f127 + este registro - returned (T21 95e9f44, T22 682bdca, 865bc4b, T23 bce11e5, T24 52ff304, T25 da340f9, T26 0ce085e, T27 1d6735f; vitest 927, tv e2e 48, tsc e lint verdes, conferidos pelo orquestrador em 1d6735f; phone e2e 79 e play e2e 10 pelo worker). Fotos `tv-words` e `tv-round-result`. QR do resultado com caixa de 5rem, lido pelo jsqr de 1280x720 a 1920x1080, ainda sem prova com câmera. Defaults a confirmar: a lista percorre só o que não cabe, então uma lista curta fica parada durante a duração; "Ana e Beto encontraram!"; todos com 0 dão "Empate!"; coroa do cartão só com pontos; atrasado pode ocupar cartão; sem anfitrião o rodapé some; removido mantém o círculo. "Tempo!" no servidor real fica para a T35; batch worker fases 8 e 9 (T28-T33) a partir de 1d6735f + este registro - returned (T28 7aa84e8, T29 88ca02d, T30 95d2430, T31 e563c91, T32 56b3e6f, T33 973ae05; vitest 996, tv e2e 71, phone e2e 79, tsc e lint verdes, conferidos pelo orquestrador em 973ae05; play e2e 10 pelo worker); batch worker fase 10 (T34-T37) a partir de 973ae05 + este registro - returned (T34 df6bc16, T35 f363478, T36 669f01a, T37 4ff0278; vitest 1009, tv e2e 78, phone e2e 79, play e2e 10, tsc e lint verdes pelo worker). C105 aberto, à espera das 12 fotos com o user. Correção da T34: apelido de 12 W quebrava cartões e lista. Instabilidade medida: Vite recusa módulo no Windows com 8 workers, resolvida com `workers: 4` no config da TV; walker (implement.md passo 9) a partir de 4ff0278 + este registro
**Walked:** walker a partir de 4ff0278, contra a pilha real, sem tocar em código nem em testes. Como chegar: `npm run assets:build` (precisa de `npm run dict:build` feito uma vez), `npm run dev -w @bwords/server` (wrangler dev em 8787, serve TV e celular); TV em `http://localhost:8787/tv` num contexto Playwright de 1920x1080 (o token fica em `localStorage` `bwords.tv.room`); celulares em contextos de 390x844 com toque em `http://localhost:8787/<CÓDIGO>` (digitar o apelido em "Seu Apelido" e tocar em ENTRAR; o 1º vira anfitrião); as palavras foram jogadas com gestos reais de mouse sobre o `group` "Tabuleiro", escolhidas com `boardSolutions` e `findPath` do core a partir do `round-start` que a TV recebe; o socket da TV foi cortado com `page.routeWebSocket` (fechar o socket da página e recusar as conexões novas por 4 s, depois liberar). Rodada de 30 s é o mínimo: anfitrião toca em "Diminuir Tempo da Rodada" até "0:30" e em "Aumentar Rodadas" até 2. Estados: lobby vazio = abrir `/tv`; lobby com 2 e 3 jogadores = entrar com 2 e 3 contextos; contagem, rodada, "Tempo!", palavras e resultado = INICIAR PARTIDA e esperar (a TV segue sozinha: "Tempo!" 2 s, rolagem, 5 s, resultado); resultado entre rodadas = esperar a rodada 1 de 2; pódio com vencedor e confete = tocar em "PRÓXIMA RODADA (2 DE 2)" e esperar a rodada 2; "JOGAR DE NOVO", "Voltar ao Lobby" e "ENCERRAR SALA" ficam no pódio do celular do anfitrião, e "Voltar ao lobby" e "Encerrar sala" também no menu "Menu do(a) anfitrião(ã)" (com confirmação). Resultado por história. 1 Abrir a sala: ok, `/tv` cria sala, recarregar mantém o mesmo código, token só no `localStorage` e em nenhuma URL; lobby vazio mostra "Ninguém entrou ainda", "0 / 10" e as 10 vagas. 2 Lobby: ok, com 2 e 3 celulares a contagem e as linhas sobem, "ANFITRIÃO(Ã)" na Ana, 7 vagas livres com 3, rodapé "Aguardando Ana iniciar a partida…"; os chips espelham rodadas, tempo, grade 5x5, mín. 4 letras e "Palavrões liberados" e o chip alterado pulsa; o QR lido pelo jsqr é `http://localhost:8787/<CÓDIGO>` e o texto diz "ou acesse localhost:8787 e digite o código". 3 Contagem e rodada: ok, contagem "RODADA 1 DE 2" e o número sem tabuleiro, rodada com relógio 0:30, cartões em ordem de entrada, "10 palavras" depois "17 palavras" (os contadores chegam no máximo 1 por segundo, COUNTS_INTERVAL_MS) e "1 palavra", nenhuma palavra da rodada na tela nem nos frames recebidos pela TV, "Tempo!" com 0:00 por 2014 ms. 4 Palavras: ok, "Palavras em comum" e "Palavras Únicas · PONTOS EM DOBRO", ordem por tamanho e alfabética, grafias reais, círculos A e B na comum, totais "141 palavras possíveis / 18 palavras encontradas", rolagem até o fim em cerca de 7,5 s e resultado cerca de 5,9 s depois; recarregar a TV durante a rolagem recomeça em `words-screen` e segue até o resultado. 5 Resultado: ok, "Resultado · Rodada 1 de 2", cartões 1º Ana 37, 2º Caio 2, 3º Beto 1, 5 de 5 peças acesas de ACIDO, "Ana encontrou!", sem lista do 4º em diante, QR lido, celulares dos outros em "Aguardando Ana avançar…"; PRÓXIMA RODADA abre "RODADA 2 DE 2". Última rodada: ok, os celulares abrem o pódio direto ao fim da rodada (sem "VER PÓDIO"), enquanto a TV ainda está em "Tempo!" e nas palavras, com o resumo somando as duas rodadas (Ana 46 pts, 1 vitória); a TV mostra "Ana venceu!", confete e "Aguardando Ana: jogar de novo ou voltar ao lobby"; JOGAR DE NOVO leva TV e celulares à contagem da rodada 1 de 2, com 1 vitória da Ana. Voltar ao lobby (do menu na rodada e do pódio): ok, a TV mostra o lobby com as vitórias (Ana 2). Partida de 1 rodada: ok, celular no pódio direto. Corte do socket da TV na rodada: ok, faixa "Reconectando…" com a rodada e o tabuleiro na tela e o relógio andando (0:27 para 0:23), a faixa sai quando a conexão volta. Encerrar sala: ok, a TV abre sala nova sozinha (código muda, "0 / 10"), o celular do Beto mostra "Ana encerrou a sala". Outra aba: ok, a 1ª aba mostra "A TV foi aberta em outra aba". Aviso de som: ok, "Aperte OK no controle para liberar o som" some na 1ª tecla. 8 Sem fast mode: ok, nem o lobby do anfitrião nem os chips da TV têm a opção. 9 Um endereço só: ok, `/tv` 200, `/` e `/<CÓDIGO>` 200, `/pt-BR/dict.bin` e `/pt-BR/meta.json` 404. Nenhum erro de console na TV. Sem PROBLEMA; observações sem critério: ao recarregar durante a rolagem o DOM passa por `result-screen`, `round-screen` e `time-up` por cerca de 100 ms antes de `words-screen` (visto por MutationObserver, sem foto), e a faixa "Sem conexão" (30 s) e o limite de 10 min não foram caminhados, só os testes os cobrem. As 12 fotos de C105 não foram tiradas aqui. O servidor e os contextos foram fechados; as portas 8787, 9229, 5175 e 5176 ficaram livres.

---

## Phase Execution Map

```
Phase 1:  T1 --→ T2 --→ T3 --→ T4 --→ T5 --→ T6
Phase 2:  T7 --→ T8
Phase 3:  T9 --→ T10 --→ T11 --→ T12
Phase 4:  T13 --→ T14 --→ T15
Phase 5:  T16 --→ T17 --→ T18 --→ T19 --→ T20
Phase 6:  T21 --→ T22 --→ T23
Phase 7:  T24 --→ T25 --→ T26 --→ T27
Phase 8:  T28 --→ T29 --→ T30
Phase 9:  T31 --→ T32 --→ T33
Phase 10:  T34 --→ T35 --→ T36 --→ T37
```

Execução estritamente sequencial. Cada fase é um batch de subagente (com fases pequenas juntas até cerca de 7 tarefas), e o orquestrador para entre os batches para mostrar o resultado e perguntar antes de seguir.
