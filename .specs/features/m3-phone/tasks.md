# M3 Phone Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/m3-phone/design.md`
**Status**: Approved
**Approved**: 2026-10-29 - user: "Aprovo as tasks"
**Amended**: 2026-10-29 - T43-T44 entram no começo da Phase 3 para corrigir os achados da fase 2; user: "Aceito, seguir"
**Mutations**: 3
**Build**: `npx tsc -b; npm run lint -w @bwords/phone; npx vitest run; npx playwright test; npx playwright test -c packages/phone/playwright.config.ts`

### Regras de execução

- **Style guide:** todo código segue `docs/style-guide.md` (o `CLAUDE.md` o carrega): legibilidade (§3.1), SOLID (§4), componentes (§5), CSS (§5.1), Signals (AD-015).
- **Limites exatos (L-001):** todo limite tem um teste no valor exato e um logo depois: apelido com 12 e 13 caracteres no contador; tempo 30/180 s e os botões no limite; rodadas 1/5; envio imediato com 3.000 ms restantes e com 500 ms de espera com 3.001 ms; alerta do timer em 10.000 ms e 10.001 ms; toque a 35% do lado da peça (dentro) e logo fora; feedback some em 500 ms; "Sem conexão" em 30.000 ms e não em 29.999 ms; 10 caminhos por janela de 1 s e o 11º esperando.
- **Um caso por ramo de tabela (L-007):** `applyServerMessage` tem um caso por tipo de mensagem; `screenFor` um caso por tela; `errorKey` e `closeKey` um caso por código.
- **Nomes dos testes:** cada teste citado em `## Checks` usa exatamente o nome entre aspas da prova, porque `check_proofs.py` seleciona por `-t` (Vitest) e `-g` (Playwright).
- **Captures:** cada tela com capture é fotografada a 390 px de largura (2x), no estado que a capture desenha, em `captures/<capture>.running.png`, com os dados de exemplo das captures (Ana, Beto, Caio, Duda; sala KBXT quando o teste controla o código, ou o código real da sala).
- **Responsividade (AD-016):** as fotos das captures são tiradas a 390 px, mas nenhuma tela pode depender dessa largura. Todo container é fluido; os testes de layout passam por 320, 360, 390, 430 e 480 px de largura e 568 e 932 px de altura.
- **Telas sem capture** (reconexão, preferências, confirmações, variantes de participante e espectador) usam os mesmos componentes e tokens das telas com capture.
- **Código em inglês (AD-001):** identificadores, nomes de teste e mensagens de commit em inglês; o texto deste arquivo em português.
- **Histórico:** subagentes nunca usam `rebase`, `--amend` em commit já registrado nem `push --force`.
- **Ambiente Windows:** os scripts da skill rodam com `PYTHONUTF8=1` e `PYTHONPATH` apontando para a pasta do `sitecustomize.py` (ver `.specs/STATE.md`).

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `docs/style-guide.md` §9 (Vitest para o puro, Playwright para navegador, fakes em vez de mocks, L-001, L-007); `docs/DESIGN.md` §7; `vitest.config.ts` (o projeto `core` já inclui `packages/*/src/**/*.test.ts`); testes existentes em `packages/core/src/room/*.test.ts` e `tools/play/e2e/*.spec.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Regras do cliente (`model/`) | unit | Todos os ramos; 1:1 com os ACs; todo edge case; limites exatos (L-001); um caso por ramo de tabela (L-007) | `packages/phone/src/model/*.test.ts` | `npx vitest run packages/phone` |
| Estado e rede (`state/`, `net/`) | unit, com fakes (socket, relógio, storage, device) | Cada ação e cada transição de conexão; ACs de RECON, PREF e PLAY que vivem no estado | `packages/phone/src/{state,net}/*.test.ts` | `npx vitest run packages/phone` |
| Estilos (`styles/`) | unit (varredura estática do CSS) | Sem grid, `gap`, `blur`, `backdrop-filter`; animações só de `transform`/`opacity`; cores só por variáveis | `packages/phone/src/styles/*.test.ts` | `npx vitest run packages/phone` |
| Telas, componentes, `app.tsx`, `device/` | e2e (Playwright, servidor real) + foto contra a capture | Todo AC de tela: caminho feliz + erro + variantes de papel (anfitrião, participante, espectador) | `packages/phone/e2e/*.spec.ts` | `npx playwright test -c packages/phone/playwright.config.ts` |
| Config (`package.json`, `vite.config.ts`, `tsconfig`, `eslint.config.js`, `index.html`, `tokens.css`) | none | - (build gate only) | - | build gate only |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tasks de `model/`, `state/`, `net/`, `styles/` | `npx vitest run packages/phone` |
| Full | Tasks de telas e E2E | `npx vitest run packages/phone; npx playwright test -c packages/phone/playwright.config.ts` |
| Build | Fim de cada fase e tasks só de config | `npx tsc -b; npm run lint -w @bwords/phone; npx vitest run; npx playwright test; npx playwright test -c packages/phone/playwright.config.ts` |

---

## Execution Plan

Phases are ordered and run sequentially - each phase completes before the next begins, and tasks within a phase execute in order. Cada fase é um batch de subagente e termina com parada para o usuário.

### Phase 1: Workspace, rede e estado da sala

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 2: Entrada e lobby do participante

```
T9 → T10 → T11 → T12 → T13 → T14
```

### Phase 3: Lobby do anfitrião e saída da sala

```
T43 → T44 → T15 → T16 → T17 → T18 → T19
```

### Phase 4: Regras da rodada

```
T20 → T21 → T22 → T23 → T24 → T25 → T26
```

### Phase 5: Telas da rodada

```
T27 → T28 → T29 → T30
```

### Phase 6: Resultado e pódio

```
T31 → T32 → T33 → T34 → T35
```

### Phase 7: Preferências, reconexão e acabamento

```
T36 → T37 → T38 → T39 → T40 → T41 → T42
```

---

## Task Breakdown

#### Phase 1: Workspace, rede e estado da sala

### T1: Phone workspace

**What**: Workspace `@bwords/phone`: dependências (`preact`, `@preact/signals`, `@fontsource/nunito-sans`, `vite`, `@preact/preset-vite`, `eslint` 9, `eslint-config-preact`, `typescript-eslint`, `@playwright/test`), `vite.config.ts` (porta 5175, proxy `/api` → 8787), `tsconfig.json`, `eslint.config.js` (preset do Preact com o parser do `typescript-eslint` nos `.ts`/`.tsx`), `index.html`, `src/main.tsx` mínimo, `src/styles/tokens.css` e scripts `dev` e `lint`.
**Where**: `packages/phone/package.json`
**Depends on**: None
**Reuses**: `tools/debug/vite.config.ts`, `tools/debug/tsconfig.json`
**Requirement**: UI-01

**Done when**:

- [x] `npm run lint -w @bwords/phone` passa num `.tsx` com hooks, e falha num `useEffect` com dependência faltando (prova de que o parser TS e as regras de hooks estão ativos; o arquivo de prova é apagado depois)
- [x] `tsconfig.json` da raiz referencia `packages/phone`; `npx tsc -b` passa
- [x] `npm run dev -w @bwords/phone` serve `index.html` em `/` e em `/KBXT`
- [x] Gate check passes: build

**Tests**: none
**Gate**: build
**Commit**: `build(phone): workspace with vite, signals and eslint-config-preact`

---

### T2: Strings and message keys

**What**: `strings/pt-BR.ts` com todas as frases do spec e `model/messages.ts` com `errorKey(code)` e `closeKey(reason)`.
**Where**: `packages/phone/src/model/messages.ts`
**Depends on**: T1
**Reuses**: `ERROR_CODES`, `CLOSE_REASONS` (`@bwords/core`)
**Requirement**: UI-01, EXIT-01

**Done when**:

- [x] Um caso por `ErrorCode` e por `CloseReason` (L-007)
- [x] C107, C96 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): pt-BR strings and message keys`

---

### T3: Room view reducer

**What**: `model/room-view.ts`: `RoomView`, `INITIAL_VIEW` e `applyServerMessage(view, msg)` para todo `ServerMessage`, mais o quadro de hashes da rodada.
**Where**: `packages/phone/src/model/room-view.ts`
**Depends on**: T2
**Reuses**: tipos do protocolo, `decodeHashFrame`; o padrão de `tools/debug/src/socket.ts` (sem a parte de UI)
**Requirement**: ENTRY-01, RECON-01

**Done when**:

- [x] Um caso por tipo de mensagem (L-007); `welcome` reconstrói a visão do zero e recupera `found`
- [x] C115, C116 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): room view reducer`

---

### T4: Clock sync

**What**: `net/clock-sync.ts`: amostras de `time` e o offset da amostra de menor ida e volta.
**Where**: `packages/phone/src/net/clock-sync.ts`
**Depends on**: T3
**Reuses**: mensagem `time` do protocolo
**Requirement**: COUNT-01

**Done when**:

- [x] C44 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): server clock sync`

---

### T5: Room connection

**What**: `net/room-connection.ts`: `hello` com ou sem token, quadro binário, reconexão com espera crescente, `offline` em 30 s, `retry`, sem reconexão depois de `closed`.
**Where**: `packages/phone/src/net/room-connection.ts`
**Depends on**: T4
**Reuses**: `decodeHashFrame`, o `wsUrl` de `tools/debug/src/socket.ts`
**Requirement**: RECON-01, EXIT-01

**Done when**:

- [x] Testes com WebSocket falso e relógio injetado; 29.999 ms ainda reconectando, 30.000 ms `offline` (L-001)
- [x] C102, C105, C99 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): room connection with reconnect`

---

### T6: Phone store and room actions

**What**: `state/store.ts` (`createPhoneStore(deps)` e o contexto `useStore`) e `state/room.ts`: signals `room` e `connection`, token por sala no storage, e as ações `openRoom`, `join`, `changeSettings`, `start`, `next`, `transferHost`, `kick`, `playAgain`, `backToLobby`, `closeRoom`.
**Where**: `packages/phone/src/state/room.ts`
**Depends on**: T5
**Reuses**: `cleanNickname` (`@bwords/core`), `applyServerMessage` (T3)
**Requirement**: ENTRY-01, JOIN-01

**Done when**:

- [x] Cada ação manda a mensagem certa por um `RoomConnection` falso (um caso por ação, L-007)
- [x] C7, C12 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): store and room actions`

---

### T7: Room code input rules

**What**: `model/room-code.ts`: `parseRoomPath(pathname)` e `typeCodeLetter(code, index, letter)` (maiúscula, só `ROOM_CODE_ALPHABET`).
**Where**: `packages/phone/src/model/room-code.ts`
**Depends on**: T6
**Reuses**: `ROOM_CODE_ALPHABET`, `ROOM_CODE_LENGTH`, `isRoomCode`
**Requirement**: ENTRY-01

**Done when**:

- [x] `/kbxt`, `/KBXT`, `/`, `/KBX`, `/KBXTA` e `/KBIO` (letras fora do alfabeto) cobertos
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): room code rules`

---

### T8: Screen selection

**What**: `model/screen.ts`: `screenFor(view, connection, now)` escolhe a tela pela fase, pelo papel, pelo `closeReason` e pelo relógio do servidor (contagem até `startsAt`).
**Where**: `packages/phone/src/model/screen.ts`
**Depends on**: T7
**Reuses**: `RoomView` (T3)
**Requirement**: COUNT-01, SPEC-01, EXIT-01

**Done when**:

- [x] Um caso por `Screen` (L-007); `startsAt - 1` é contagem e `startsAt` é tabuleiro (L-001)
- [x] C43 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): screen selection`

---

#### Phase 2: Entrada e lobby do participante

### T9: App shell and E2E harness

**What**: `app.tsx` (tabela `Screen → tela`, `TopBar`, `RoomTag`, `icons.tsx`), `main.tsx` com o store real, e o harness E2E: `playwright.config.ts` (viewport 390×844, `hasTouch`, `webServer` com `wrangler dev` e o Vite do celular) e `e2e/tv.ts` (cria a sala e mantém o socket da TV).
**Where**: `packages/phone/e2e/tv.ts`
**Depends on**: T8
**Reuses**: `POST /api/rooms`, `tools/debug/vite.config.ts`
**Requirement**: ENTRY-01, UI-01

**Done when**:

- [x] O teste "opens the join screen for a room path" abre `/<código>` de uma sala criada pelo helper e vê "Seu Apelido"
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): app shell and e2e harness`

---

### T10: Code entry screen

**What**: `screens/CodeEntryScreen.tsx`: quatro caixas, teclado do sistema em maiúsculas, "CONTINUAR" e "Sala não encontrada".
**Where**: `packages/phone/src/screens/CodeEntryScreen.tsx`
**Depends on**: T9
**Reuses**: `typeCodeLetter` (T7), `PrimaryButton`
**Requirement**: ENTRY-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-code.png`, foto em `phone-code.running.png`
- [x] C2, C3, C4, C5 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): code entry screen`

---

### T11: Color slots

**What**: `model/colors.ts`: `colorSlots(PALETTE, players, myId)` (livre, minha, bloqueada com dono, personalizada) e `closestColorOwner(color, players)`.
**Where**: `packages/phone/src/model/colors.ts`
**Depends on**: T10
**Reuses**: `PALETTE`, `ciede2000`
**Requirement**: JOIN-01

**Done when**:

- [x] C9, C10 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): color slots`

---

### T12: Join screen

**What**: `screens/JoinScreen.tsx` com `ColorPicker`, `PlayerAvatar`, `Chip` e as mensagens de erro de entrada.
**Where**: `packages/phone/src/screens/JoinScreen.tsx`
**Depends on**: T11
**Reuses**: `colorSlots`, `closestColorOwner` (T11), `NICKNAME_MAX`, `errorKey` (T2)
**Requirement**: ENTRY-01, JOIN-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-join.png`, foto em `phone-join.running.png`
- [x] C1, C6, C8, C11, C13, C14, C15, C16, C17, C18 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): join screen`

---

### T13: Player lists

**What**: `model/players.ts`: `lobbyRows`, `quickScoreboard`, `podiumRows` e `myPlacement` (ordem, coroa, etiquetas "ANFITRIÃO(Ã)", "VOCÊ", "DESCONECTADO", "ESPECTADOR(A)", espectadores por último).
**Where**: `packages/phone/src/model/players.ts`
**Depends on**: T12
**Reuses**: `crownedPlayers`
**Requirement**: LOBBY-01, RES-01, POD-01

**Done when**:

- [x] Empate no placar e na coroa cobertos
- [x] C20, C21, C22, C23, C70, C77, C82 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): player list rules`

---

### T14: Participant lobby screen

**What**: `screens/LobbyScreen.tsx` com `PlayerRow`, cartão "Você", chips das regras e "Aguardando <anfitrião> iniciar a partida".
**Where**: `packages/phone/src/screens/LobbyScreen.tsx`
**Depends on**: T13
**Reuses**: `lobbyRows` (T13), `PlayerAvatar`, `Chip`
**Requirement**: LOBBY-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-lobby.png`, foto em `phone-lobby.running.png`
- [x] C19, C24, C25 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): participant lobby`

---

#### Phase 3: Lobby do anfitrião e saída da sala

### T43: Stop reconnecting after room-not-found

**What**: A conexão para de reconectar quando o servidor responde `room-not-found`; a tela de código só tenta de novo quando o jogador usa "CONTINUAR".
**Where**: `packages/phone/src/net/room-connection.ts` (modify)
**Depends on**: T14
**Reuses**: `createRoomConnection` (T5), ação `openRoom` (T6)
**Requirement**: ENTRY-01, RECON-01

**Done when**:

- [x] C123 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `fix(phone): stop reconnecting after room-not-found`

---

### T44: Host name in the join screen waiting line

**What**: Na tela de entrada, "Aguardando <anfitrião> iniciar a partida…" com o nome do anfitrião na cor de ação e as reticências, como em `phone-join.png`; nova foto `phone-join.running.png`.
**Where**: `packages/phone/src/screens/JoinScreen.tsx` (modify)
**Depends on**: T43
**Reuses**: `WaitingDots`, `strings/pt-BR.ts`
**Requirement**: JOIN-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-join.png` nesse trecho, foto refeita em `phone-join.running.png`
- [x] C1 continua passando
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `fix(phone): host name in the join screen waiting line`

---

### T15: Settings steps

**What**: `model/settings.ts`: `stepSeconds`, `stepRounds`, `canStep` e `formatSeconds` ("2:00").
**Where**: `packages/phone/src/model/settings.ts`
**Depends on**: T44
**Reuses**: `Settings` (`@bwords/core`)
**Requirement**: HOST-01

**Done when**:

- [x] 30/180 s e 1/5 rodadas no limite e fora dele (L-001)
- [x] C28, C29, C30 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): settings steps`

---

### T16: Host lobby screen

**What**: `screens/HostLobbyScreen.tsx` com `Segmented`, `Stepper`, `Toggle`, `VolumeSlider`, o seletor de dicionário e "INICIAR PARTIDA".
**Where**: `packages/phone/src/screens/HostLobbyScreen.tsx`
**Depends on**: T15
**Reuses**: `stepSeconds`, `stepRounds` (T15), `lobbyRows` (T13), `PlayerRow`
**Requirement**: HOST-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-host-lobby.png`, foto em `phone-host-lobby.running.png`
- [x] C26, C27, C31, C32, C33, C34, C39 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): host lobby`

---

### T17: Player actions sheet

**What**: `screens/PlayerActionsSheet.tsx` com `Sheet` e `ConfirmDialog`: "Tornar anfitrião", "Remover da sala" com confirmação e "Cancelar"; troca de lobby quando o anfitrião muda.
**Where**: `packages/phone/src/screens/PlayerActionsSheet.tsx`
**Depends on**: T16
**Reuses**: ações `transferHost`, `kick` (T6)
**Requirement**: HOST-01

**Done when**:

- [x] Folha igual a `.specs/features/m3-phone/captures/phone-host-actions.png` (só a folha; fundo é o lobby atual), foto em `phone-host-actions.running.png`
- [x] C35, C36, C37, C38, C41 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): player actions sheet`

---

### T18: Exit screens

**What**: `screens/ExitScreens.tsx`: removido, sala encerrada (pelo anfitrião, por inatividade, sem TV) e "aberta em outra aba", com "ENTRAR EM OUTRA SALA".
**Where**: `packages/phone/src/screens/ExitScreens.tsx`
**Depends on**: T17
**Reuses**: `closeKey` (T2)
**Requirement**: EXIT-01

**Done when**:

- [x] Telas iguais a `.specs/features/m3-phone/captures/phone-kicked.png` e `phone-room-closed.png`, fotos em `phone-kicked.running.png` e `phone-room-closed.running.png`
- [x] C95, C97, C98 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): exit screens`

---

### T19: Host menu with close room

**What**: Menu (⋮) do `TopBar` para o anfitrião, com "Encerrar sala" e confirmação.
**Where**: `packages/phone/src/components/HostMenu.tsx`
**Depends on**: T18
**Reuses**: `ConfirmDialog` (T17), ação `closeRoom` (T6)
**Requirement**: HOST-01

**Done when**:

- [x] C40 passa
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): host menu`

---

#### Phase 4: Regras da rodada

### T20: Swipe path

**What**: `model/path.ts`: `isNeighbor`, `extendPath` (acrescenta vizinho, volta na penúltima, ignora o resto) e `wordOfPath` ("Qu" = q-u).
**Where**: `packages/phone/src/model/path.ts`
**Depends on**: T19
**Reuses**: `boardTiles`, `Board`
**Requirement**: PLAY-01

**Done when**:

- [x] As 8 direções, cantos e bordas em 4x4 e 6x6
- [x] C46, C48, C49, C50 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): swipe path rules`

---

### T21: Tile hit test

**What**: `model/hit-test.ts`: `tileAtPoint(point, boardRect, size, hitRatio)` com o círculo central de raio 35% do lado.
**Where**: `packages/phone/src/model/hit-test.ts`
**Depends on**: T20
**Reuses**: -
**Requirement**: PLAY-01

**Done when**:

- [x] Ponto a 35% do centro (dentro) e logo além (fora) (L-001)
- [x] C47 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): tile hit test`

---

### T22: Word judge

**What**: `model/judge.ts`: `judgeWord(word, ctx)` na ordem muito curta → já encontrada → hash, com os pontos do `core`.
**Where**: `packages/phone/src/model/judge.ts`
**Depends on**: T21
**Reuses**: `hashPrefix`, `wordPoints`
**Requirement**: PLAY-01

**Done when**:

- [x] Hashes de teste gerados com `hashPrefixes` e um salt fixo
- [x] C52, C53, C54 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): local word judge`

---

### T23: Submit queue

**What**: `model/submit-queue.ts`: `submitDelay(now, endsAt)` e `takeBatch(pending, sentInWindow)`.
**Where**: `packages/phone/src/model/submit-queue.ts`
**Depends on**: T22
**Reuses**: `RATE_LIMIT_PATHS`, `RATE_WINDOW_MS`
**Requirement**: PLAY-01

**Done when**:

- [x] 3.000 ms e 3.001 ms restantes; 10º e 11º caminho na janela (L-001)
- [x] C57 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): submit batching`

---

### T24: Found words reconciliation

**What**: `model/found.ts`: `addFound`, `reconcileFound(found, results)` e `foundTotals` ("N pal · N pts").
**Where**: `packages/phone/src/model/found.ts`
**Depends on**: T23
**Reuses**: `SubmitResult`
**Requirement**: PLAY-01

**Done when**:

- [x] C58 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): found words reconciliation`

---

### T25: Round clock

**What**: `model/clock.ts`: `formatClock`, `countdownNumber` e `isAlert`.
**Where**: `packages/phone/src/model/clock.ts`
**Depends on**: T24
**Reuses**: -
**Requirement**: PLAY-01, COUNT-01

**Done when**:

- [x] 10.000 ms e 10.001 ms (L-001); 0 e negativos viram "00:00"
- [x] C59, C60 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): round clock`

---

### T26: Round state

**What**: `state/round.ts`: `path`, `feedback`, `pendingPaths`, `extendPathTo`, `releasePath`, feedback por 500 ms, timer de envio, vibração e som pelas dependências de `device/`.
**Where**: `packages/phone/src/state/round.ts`
**Depends on**: T25
**Reuses**: T20-T25, ação `send` (T6)
**Requirement**: PLAY-01

**Done when**:

- [x] Testes com relógio, device e conexão falsos
- [x] C55, C56, C63, C64, C110, C112 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): round state`

---

#### Phase 5: Telas da rodada

### T27: Countdown screen

**What**: `screens/CountdownScreen.tsx`: "RODADA N DE M", "SALA <código>", número gigante e "Prepare o dedo!".
**Where**: `packages/phone/src/screens/CountdownScreen.tsx`
**Depends on**: T26
**Reuses**: `countdownNumber` (T25)
**Requirement**: COUNT-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-countdown.png`, foto em `phone-countdown.running.png`
- [x] C42 passa
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): countdown screen`

---

### T28: Board screen

**What**: `screens/BoardScreen.tsx` com `BoardGrid` (peças + linha SVG), `Tile`, `WordRack`, `FeedbackPill`, `FoundWords`, pointer events e "Tempo!".
**Where**: `packages/phone/src/screens/BoardScreen.tsx`
**Depends on**: T27
**Reuses**: `tileAtPoint` (T21), `round` state (T26), `formatClock` (T25)
**Requirement**: PLAY-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-board.png` e feedbacks como `phone-feedbacks.png`, fotos em `phone-board.running.png` e `phone-feedbacks.running.png`
- [x] O `BoardGrid` mede o espaço livre (`ResizeObserver`) e usa o maior quadrado que cabe
- [x] C45, C51, C61, C62, C65, C111, C119 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): board screen with swipe`

---

### T29: Host menu during the match

**What**: "Voltar ao lobby" no menu (⋮) durante a contagem e a rodada, com confirmação.
**Where**: `packages/phone/src/components/HostMenu.tsx` (modify)
**Depends on**: T28
**Reuses**: `ConfirmDialog` (T17), ação `backToLobby` (T6)
**Requirement**: HOSTPLAY-01

**Done when**:

- [x] C66, C67 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): back to lobby during the match`

---

### T30: Spectator screen

**What**: `screens/SpectatorScreen.tsx`: tabuleiro esmaecido e travado, faixa, timer com barra e "JOGADORES NA SALA" sem contagem.
**Where**: `packages/phone/src/screens/SpectatorScreen.tsx`
**Depends on**: T29
**Reuses**: `BoardGrid` (T28), `PlayerRow`
**Requirement**: SPEC-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-spectator.png`, foto em `phone-spectator.running.png`
- [x] C68, C69 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): spectator screen`

---

#### Phase 6: Resultado e pódio

### T31: Round result rules

**What**: `model/results.ts`: `myRoundSummary` (pontos, total, posição) e `myWordRows` ("ÚNICA ×2", "em comum", grafias, "base +N").
**Where**: `packages/phone/src/model/results.ts`
**Depends on**: T30
**Reuses**: `RoundResultsMessage`, `ResultWord`
**Requirement**: RES-01

**Done when**:

- [x] C71, C72, C73, C74 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): round result rules`

---

### T32: Match summary

**What**: `model/match-summary.ts`: `addRound(history, words)` e `matchSummary(history)` (total de palavras e maior palavra com grafias, pontos e letras).
**Where**: `packages/phone/src/model/match-summary.ts`
**Depends on**: T31
**Reuses**: `myWordRows` (T31)
**Requirement**: POD-01

**Done when**:

- [x] Empate de tamanho na maior palavra coberto (fica a primeira em ordem alfabética, como no DESIGN §4.3)
- [x] C83, C84 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): match summary`

---

### T33: Match history state

**What**: `state/match.ts`: `matchHistory` cresce a cada `round-results` e zera na contagem da rodada 0.
**Where**: `packages/phone/src/state/match.ts`
**Depends on**: T32
**Reuses**: `addRound` (T32)
**Requirement**: POD-01

**Done when**:

- [x] C85 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): match history`

---

### T34: Round result screen

**What**: `screens/RoundResultScreen.tsx`: cartões, palavras, "PLACAR RÁPIDO DA MESA" e as variantes de anfitrião, participante e espectador.
**Where**: `packages/phone/src/screens/RoundResultScreen.tsx`
**Depends on**: T33
**Reuses**: `myRoundSummary`, `myWordRows` (T31), `quickScoreboard` (T13)
**Requirement**: RES-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-round-result.jpg`, foto em `phone-round-result.running.png`
- [x] C70a, C75, C76, C78, C79 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): round result screen`

---

### T35: Podium screen

**What**: `screens/PodiumScreen.tsx` com `Confetti`, destaque pessoal, "SEU RENDIMENTO", "MAIOR PALAVRA ENCONTRADA", classificação e as variantes de papel.
**Where**: `packages/phone/src/screens/PodiumScreen.tsx`
**Depends on**: T34
**Reuses**: `podiumRows`, `myPlacement` (T13), `matchSummary` (T32)
**Requirement**: POD-01

**Done when**:

- [x] Tela igual a `.specs/features/m3-phone/captures/phone-podium.jpg`, foto em `phone-podium.running.png`
- [x] C80, C81, C86, C87, C88, C89, C90, C91 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): podium screen`

---

#### Phase 7: Preferências, reconexão e acabamento

### T36: Preferences and wake lock state

**What**: `state/prefs.ts`: `prefs` no storage e a regra da Wake Lock (pede no lobby e na rodada, solta no resto, pede de novo ao ficar visível).
**Where**: `packages/phone/src/state/prefs.ts`
**Depends on**: T35
**Reuses**: dependências `device` do store (T6)
**Requirement**: PREF-01

**Done when**:

- [x] Storage que lança exceção não quebra o store
- [x] C109, C106 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): preferences and wake lock rules`

---

### T37: Device adapters and preferences sheet

**What**: `device/` (wake lock, vibrate, bipe com Web Audio, storage) e `components/PrefsSheet.tsx` aberta pelo ícone de pessoa.
**Where**: `packages/phone/src/components/PrefsSheet.tsx`
**Depends on**: T36
**Reuses**: `Sheet`, `Toggle`
**Requirement**: PREF-01

**Done when**:

- [x] C108, C104 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): device adapters and preferences`

---

### T38: Reconnect banner

**What**: `components/ReconnectBanner.tsx`: "Reconectando…", "Conectado" por 1 s, "Sem conexão" + "Tentar de novo", e o tabuleiro travado durante a reconexão.
**Where**: `packages/phone/src/components/ReconnectBanner.tsx`
**Depends on**: T37
**Reuses**: signal `connection` (T6), `retry` (T5)
**Requirement**: RECON-01

**Done when**:

- [x] C100, C101 passam
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): reconnect banner`

---

### T39: Style audit

**What**: `styles/styles.test.ts`: varre o CSS do pacote atrás de `display: grid`, `gap`, `blur`, `backdrop-filter`, transições e animações de outras propriedades, cores literais (todo CSS do pacote usa as variáveis de `@bwords/theme`) e larguras ou alturas em px acima de 64 px.
**Where**: `packages/phone/src/styles/styles.test.ts`
**Depends on**: T38
**Reuses**: -
**Requirement**: UI-01

**Done when**:

- [x] O teste falha num CSS de exemplo com cada violação (casos de prova no próprio teste)
- [x] C113, C114, C103, C120 passam
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `test(phone): style audit`

---

### T40: Responsive layout checks

**What**: `e2e/layout.spec.ts`: cada tela em 320, 360, 390, 430 e 480 px de largura (e 568 e 932 px de altura) sem rolagem horizontal nem texto cortado, topo só com etiqueta, preferências e menu do anfitrião, botões com 48 px ou mais.
**Where**: `packages/phone/e2e/layout.spec.ts`
**Depends on**: T39
**Reuses**: harness (T9)
**Requirement**: UI-01

**Done when**:

- [x] C92, C93, C94, C122 passam; C121 fica para o sub-agente de telas na verificação
- [x] Gate check passes: full
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: full
**Commit**: `test(phone): responsive layout from 320 to 480 px`

---

### T41: Full match

**What**: `e2e/full-match.spec.ts`: TV pelo helper e 3 celulares jogam 2 rodadas, do lobby ao "JOGAR DE NOVO".
**Where**: `packages/phone/e2e/full-match.spec.ts`
**Depends on**: T40
**Reuses**: harness (T9)
**Requirement**: PLAY-01, RES-01, POD-01

**Done when**:

- [x] C117 passa
- [x] Gate check passes: build
- [x] Test count: anterior + novos, nenhum removido

**Tests**: e2e
**Gate**: build
**Commit**: `test(phone): full match with three phones`

---

### T42: Photos of screens without capture

**What**: Fotos a 390 px das telas sem capture (reconexão, sem conexão, preferências, as três confirmações, resultado e pódio de participante e de espectador, "Tempo!", sala encerrada por inatividade, outra aba), salvas em `captures/uncaptured/` e mostradas ao user. As aprovadas viram captures para os próximos marcos.
**Where**: `.specs/features/m3-phone/captures/uncaptured/`
**Depends on**: T41
**Reuses**: harness (T9)
**Requirement**: UI-01

**Done when**:

- [x] Uma foto por tela ou estado da lista
- [x] O user respondeu sobre cada foto, com as palavras dele em `## Handoff` → Settled mid-build
- [x] C118 passa

**Tests**: none
**Gate**: build
**Commit**: `docs(phone): photos of screens without capture`

---

### T45: Former spectator plays the next round

**What**: Na contagem da rodada seguinte o servidor manda a lista de jogadores a todos, antes do `round-start`, e o celular de quem era espectador abre o tabuleiro (achado do walk).
**Where**: `packages/core/src/room/round.ts` (modify)
**Depends on**: T42
**Reuses**: `playersMessage` (core)
**Requirement**: SPEC-01

**Done when**:

- [x] C124 passa
- [x] Gate check passes: `npx vitest run packages/core`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `fix(core): announce players when a round starts`

---

### T46: Singular rounds chip

**What**: O chip das regras diz "1 Rodada" no singular (achado do walk).
**Where**: `packages/phone/src/strings/pt-BR.ts` (modify)
**Depends on**: T45
**Reuses**: padrão de plural de `playerCount`
**Requirement**: LOBBY-01

**Done when**:

- [x] C125 passa
- [x] Gate check passes: `npx vitest run packages/phone`
- [x] Test count: anterior + novos, nenhum removido

**Tests**: unit
**Gate**: quick
**Commit**: `fix(phone): singular rounds chip`

---

## Checks

Os testes Vitest ficam em `packages/phone/src/**`; os E2E em `packages/phone/e2e/*.spec.ts`, rodados com `npx playwright test -c packages/phone/playwright.config.ts`.

**C1** - `/<código>` de uma sala ativa mostra a tela de entrada de `phone-join.png` (ENTRY-01, AC 1)
Proof: browser captures/phone-join.running.png

**C2** - `/` mostra "Entrar numa sala" de `phone-code.png`, com quatro caixas e "CONTINUAR" (ENTRY-01, AC 2)
Proof: browser captures/phone-code.running.png

**C3** - Digitar "k" na primeira caixa mostra "K" e passa o foco para a segunda (ENTRY-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "uppercases a typed letter and moves to the next box"`

**C4** - "CONTINUAR" com as quatro letras de uma sala ativa abre a tela de entrada dela (ENTRY-01, AC 4)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "continue with four letters opens the join screen"`

**C5** - Um código sem sala mostra "Sala não encontrada" embaixo das caixas (ENTRY-01, AC 5)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "shows room not found for an unknown code"`

**C6** - Com um token guardado, recarregar `/<código>` durante o lobby vai direto ao lobby, sem a tela de entrada (ENTRY-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "returns straight to the current phase with a saved token"`

**C7** - `bad-token` apaga o token da sala no storage e a tela vira a de entrada (ENTRY-01, AC 7)
Proof: `npx vitest run packages/phone/src/state/room.test.ts -t "drops the saved token on bad-token and shows the join screen"`

**C8** - O contador mostra "4/12" para "Beto" e "12/12" para 12 caracteres (JOIN-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "counts nickname characters as N/12"`

**C9** - O seletor tem as 10 cores do `PALETTE` na ordem e uma 11ª opção "Personalizada" (JOIN-01, AC 2)
Proof: `npx vitest run packages/phone/src/model/colors.test.ts -t "lists the ten palette colors and a custom slot"`

**C10** - Uma cor do `PALETTE` usada por outro jogador vira slot bloqueado com o apelido do dono (JOIN-01, AC 3)
Proof: `npx vitest run packages/phone/src/model/colors.test.ts -t "locks a color owned by another player with the owner's name"`

**C11** - Escolher uma cor e digitar o apelido atualiza a prévia "Como você aparecerá na TV" com a cor, a inicial e o apelido (JOIN-01, AC 4)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "updates the TV preview with the chosen color and nickname"`

**C12** - `join` sai com o apelido sem espaços nas pontas ("  Beto  " → "Beto") e a cor escolhida (JOIN-01, AC 5)
Proof: `npx vitest run packages/phone/src/state/room.test.ts -t "sends join with the trimmed nickname and the color"`

**C13** - Um apelido de 1 caractere mostra "O apelido precisa ter de 2 a 12 caracteres" (JOIN-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "shows the nickname length error"`

**C14** - Um apelido igual ao de outro jogador, sem contar maiúsculas e acentos, mostra "Esse apelido já está em uso" (JOIN-01, AC 7)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "shows nickname already in use"`

**C15** - Uma cor personalizada parecida com a de Ana mostra "Muito parecida com a cor de Ana" e o seletor continua aberto (JOIN-01, AC 8)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "names the player with the too-similar color"`

**C16** - Uma cor personalizada escura demais mostra "Essa cor fica difícil de ver na TV" e o seletor continua aberto (JOIN-01, AC 9)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "says the color is hard to see on the TV"`

**C17** - O 11º celular a entrar vê "Essa sala está cheia (10 jogadores)" (JOIN-01, AC 10)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "says the room is full at ten players"`

**C18** - Depois do `joined`, o token fica no storage da sala e a tela vira o lobby (JOIN-01, AC 11)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/join.spec.ts -g "saves the token and shows the lobby after joined"`

**C19** - O lobby do participante é o de `phone-lobby.png` (LOBBY-01, AC 1)
Proof: browser captures/phone-lobby.running.png

**C20** - A coroa vai ao lado do apelido de todos com o maior número de vitórias, e de ninguém com 0 (LOBBY-01, AC 2)
Proof: `npx vitest run packages/phone/src/model/players.test.ts -t "crowns the players with the most wins and nobody at zero"`

**C21** - O anfitrião tem a etiqueta "ANFITRIÃO(Ã)" e o próprio jogador "VOCÊ" (LOBBY-01, AC 3)
Proof: `npx vitest run packages/phone/src/model/players.test.ts -t "tags the host and the player themselves"`

**C22** - Jogador desconectado fica esmaecido com "DESCONECTADO" (LOBBY-01, AC 4)
Proof: `npx vitest run packages/phone/src/model/players.test.ts -t "dims disconnected players"`

**C23** - Espectador tem a etiqueta "ESPECTADOR(A)" (LOBBY-01, AC 5)
Proof: `npx vitest run packages/phone/src/model/players.test.ts -t "tags spectators"`

**C24** - O anfitrião muda o tabuleiro para 5x5 e o celular do participante mostra "Tabuleiro 5x5" (LOBBY-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/lobby.spec.ts -g "updates the rule chips when the host changes a setting"`

**C25** - Um jogador novo entra e a lista, "N na sala" e "Aguardando <anfitrião>" se atualizam (LOBBY-01, AC 7)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/lobby.spec.ts -g "updates the list, the count and the host name on players"`

**C26** - O lobby do anfitrião é o de `phone-host-lobby.png`, com "VOCÊ É O(A) ANFITRIÃO(Ã)" (HOST-01, AC 1)
Proof: browser captures/phone-host-lobby.running.png

**C27** - Escolher 6×6 manda `settings` com `size: 6` (HOST-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "sends the chosen board size"`

**C28** - + e − mudam o tempo em 30 s entre 30 s e 180 s, mostrado como "M:SS" (HOST-01, AC 3)
Proof: `npx vitest run packages/phone/src/model/settings.test.ts -t "steps the round time by 30 seconds between 30 and 180"`

**C29** - − fica desabilitado em 30 s e + em 180 s (HOST-01, AC 4)
Proof: `npx vitest run packages/phone/src/model/settings.test.ts -t "disables minus at 30 seconds and plus at 180 seconds"`

**C30** - + e − mudam as rodadas em 1 entre 1 e 5 (HOST-01, AC 5)
Proof: `npx vitest run packages/phone/src/model/settings.test.ts -t "steps rounds by one between 1 and 5"`

**C31** - Escolher 4 em "MÍN. LETRAS" manda `minLength: 4` (HOST-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "sends the minimum word length"`

**C32** - Os interruptores mandam `filterProfanity` e `fastMode` invertidos (HOST-01, AC 7)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "toggles the profanity filter and fast mode"`

**C33** - Soltar o controle de volume manda o volume (0-100) e o botão de mudo manda `muted` (HOST-01, AC 8)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "sends the volume on release and the mute toggle"`

**C34** - O seletor "Dicionário" tem só "Português (BR)" (HOST-01, AC 9)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "offers Portugues \(BR\) as the only dictionary"`

**C35** - Tocar Beto abre a folha de `phone-host-actions.png` (HOST-01, AC 10)
Proof: browser captures/phone-host-actions.running.png

**C36** - "Tornar anfitrião" manda `transfer-host` com o id de Beto e fecha a folha (HOST-01, AC 11)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "transfers the host and closes the sheet"`

**C37** - "Remover da sala" mostra "Remover Beto? Ele perde os pontos." e só manda `kick` depois de confirmar (HOST-01, AC 12)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "kicks only after the confirmation"`

**C38** - "Cancelar" fecha a folha sem mandar nada (HOST-01, AC 13)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "cancel closes the sheet without sending"`

**C39** - "INICIAR PARTIDA" manda `start` e todos os celulares vão para a contagem (HOST-01, AC 14)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "start sends start"`

**C40** - "Encerrar sala" no menu (⋮) só manda `close-room` depois de confirmar (HOST-01, AC 15)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "closes the room only after the confirmation"`

**C41** - Depois de `transfer-host`, o antigo anfitrião vê o lobby do participante e o novo vê o lobby do anfitrião (HOST-01, AC 16)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-actions.spec.ts -g "swaps lobbies when the host changes"`

**C42** - `round-start` mostra a contagem de `phone-countdown.png` (COUNT-01, AC 1)
Proof: browser captures/phone-countdown.running.png

**C43** - Antes de `startsAt` no relógio do servidor a tela é a contagem, sem letras; em `startsAt` vira o tabuleiro (COUNT-01, AC 2)
Proof: `npx vitest run packages/phone/src/model/screen.test.ts -t "keeps the countdown screen until startsAt on the server clock"`

**C44** - O offset do relógio vem da amostra de `time` com a menor ida e volta (COUNT-01, AC 3)
Proof: `npx vitest run packages/phone/src/net/clock-sync.test.ts -t "keeps the offset of the lowest round trip"`

**C45** - A rodada aberta mostra o tabuleiro de `phone-board.png` (PLAY-01, AC 1)
Proof: browser captures/phone-board.running.png

**C46** - Uma peça vizinha em qualquer das 8 direções entra no caminho (PLAY-01, AC 2)
Proof: `npx vitest run packages/phone/src/model/path.test.ts -t "extends the path with a neighbor in any of the eight directions"`

**C47** - O toque só conta dentro do círculo central de raio 35% do lado da peça (PLAY-01, AC 2)
Proof: `npx vitest run packages/phone/src/model/hit-test.test.ts -t "counts a touch only inside the central circle"`

**C48** - Voltar à penúltima peça tira a última do caminho (PLAY-01, AC 3)
Proof: `npx vitest run packages/phone/src/model/path.test.ts -t "drops the last tile when the finger returns to the one before"`

**C49** - Peças não vizinhas ou já no caminho são ignoradas (PLAY-01, AC 4)
Proof: `npx vitest run packages/phone/src/model/path.test.ts -t "ignores tiles that are not neighbors or already used"`

**C50** - A palavra de um caminho que passa por "Qu" sai com as letras q-u (PLAY-01, AC 5)
Proof: `npx vitest run packages/phone/src/model/path.test.ts -t "builds the word with Qu as q and u"`

**C51** - O feedback aparece em menos de 100 ms depois de soltar o dedo (PLAY-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "shows the feedback within 100 ms of release"`

**C52** - Hash que bate e palavra nova: "VÁLIDA (+N PTS)" com os pontos de `wordPoints` (PLAY-01, AC 7)
Proof: `npx vitest run packages/phone/src/model/judge.test.ts -t "judges a matching hash as valid with the core points"`

**C53** - Palavra já na lista: "JÁ ENCONTRADA" (PLAY-01, AC 8)
Proof: `npx vitest run packages/phone/src/model/judge.test.ts -t "judges a word already in the list as already found"`

**C54** - Hash que não bate: "INVÁLIDA" (PLAY-01, AC 9)
Proof: `npx vitest run packages/phone/src/model/judge.test.ts -t "judges a non-matching hash as invalid"`

**C55** - Caminho menor que o mínimo: "MUITO CURTA" e nada vai para a fila de envio (PLAY-01, AC 10)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "shows too short and queues nothing below the minimum"`

**C56** - O feedback some 500 ms depois de aparecer (PLAY-01, AC 11)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "clears the feedback after 500 ms"`

**C57** - O envio espera 500 ms com mais de 3.000 ms restantes e sai na hora com 3.000 ms ou menos (PLAY-01, AC 12)
Proof: `npx vitest run packages/phone/src/model/submit-queue.test.ts -t "waits 500 ms or sends at once in the last 3 seconds"`

**C58** - Uma palavra recusada no `submit-result` sai da lista e os pontos dela são descontados (PLAY-01, AC 13)
Proof: `npx vitest run packages/phone/src/model/found.test.ts -t "removes a refused word and its points"`

**C59** - O timer mostra o tempo até `endsAt` como "MM:SS" ("01:47") (PLAY-01, AC 14)
Proof: `npx vitest run packages/phone/src/model/clock.test.ts -t "formats the remaining time as MM:SS"`

**C60** - O timer entra em alerta com 10.000 ms ou menos restantes (PLAY-01, AC 15)
Proof: `npx vitest run packages/phone/src/model/clock.test.ts -t "turns the timer to alert at 10 seconds left"`

**C61** - Deslizar pelo tabuleiro não rola a página nem dá zoom (PLAY-01, AC 16)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "does not scroll or zoom while swiping"`

**C62** - "PALAVRAS ENCONTRADAS" mostra "N no total" e a palavra mais recente primeiro (PLAY-01, AC 17)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "lists found words newest first with the total"`

**C63** - Com "Vibrar" ligado, uma palavra válida vibra 50 ms; desligado, não vibra (PLAY-01, AC 18)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "vibrates 50 ms on a valid word when the preference is on"`

**C64** - Com "Som ao acertar" ligado, uma palavra válida toca o som; desligado, não toca (PLAY-01, AC 19)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "plays the hit sound on a valid word when the preference is on"`

**C65** - Depois de `endsAt` o tabuleiro trava e mostra "Tempo!" até o resultado (PLAY-01, AC 20)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "locks the board and shows Tempo after endsAt"`

**C66** - O anfitrião tem o menu (⋮) com "Voltar ao lobby" na contagem e na rodada; o participante não (HOSTPLAY-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-match.spec.ts -g "shows the host menu during the countdown and the round"`

**C67** - "Voltar ao lobby" mostra "Cancelar a rodada? O placar será zerado." e só manda `back-to-lobby` depois de confirmar (HOSTPLAY-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-match.spec.ts -g "goes back to the lobby only after the confirmation"`

**C68** - O espectador vê a tela de `phone-spectator.png` (SPEC-01, AC 1)
Proof: browser captures/phone-spectator.running.png

**C69** - O espectador vê o timer com a barra e "JOGADORES NA SALA" sem contagem de palavras (SPEC-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/spectator.spec.ts -g "shows the timer and the players without word counts"`

**C70** - O "PLACAR RÁPIDO DA MESA" vai do maior para o menor placar, com espectadores por último e "Esp." (RES-01, AC 6)
Proof: `npx vitest run packages/phone/src/model/players.test.ts -t "orders the quick scoreboard and puts spectators last"`

**C70a** - O anfitrião vê o resultado de `phone-round-result.jpg` (RES-01, AC 1)
Proof: browser captures/phone-round-result.running.png

**C71** - O resumo traz os pontos da rodada, o total e a posição ("Você está em 2º lugar") (RES-01, AC 2)
Proof: `npx vitest run packages/phone/src/model/results.test.ts -t "summarizes round points, total and position"`

**C72** - Uma palavra com grafias do servidor aparece "CORACOES (corações)"; sem grafias, só a palavra (RES-01, AC 3)
Proof: `npx vitest run packages/phone/src/model/results.test.ts -t "shows spellings in parentheses when the server sends them"`

**C73** - Palavra só do jogador: "ÚNICA ×2 (+N pts)", pontos dobrados e "base +N" (RES-01, AC 4)
Proof: `npx vitest run packages/phone/src/model/results.test.ts -t "marks unique words with double points and the base"`

**C74** - Palavra compartilhada: "em comum" e os pontos simples (RES-01, AC 5)
Proof: `npx vitest run packages/phone/src/model/results.test.ts -t "marks shared words as em comum"`

**C75** - O botão é "PRÓXIMA RODADA (2 DE 3)" no meio da partida e "VER PÓDIO" na última; os dois mandam `next` (RES-01, AC 7)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "next round button names the round and the last one shows the podium"`

**C76** - "Voltar ao Lobby" no resultado mostra "Cancelar a partida? O placar será zerado." e só manda `back-to-lobby` depois de confirmar (RES-01, AC 8)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "goes back to the lobby from the results only after the confirmation"`

**C77** - `myPlacement` acha a posição, os pontos totais e as vitórias do jogador no pódio, com empate dividindo a posição (POD-01, AC 2)
Proof: `npx vitest run packages/phone/src/model/players.test.ts -t "finds the player's place, total and session wins"`

**C78** - O participante vê "Aguardando <anfitrião> avançar…" no lugar dos botões (RES-01, AC 9)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "non-host waits for the host to advance"`

**C79** - O espectador vê "Você joga na próxima rodada!" no lugar dos pontos e das palavras (RES-01, AC 10)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "spectator sees the next round message"`

**C80** - O anfitrião vê o pódio de `phone-podium.jpg` (POD-01, AC 1)
Proof: browser captures/phone-podium.running.png

**C81** - O confete aparece só para quem ficou em 1º (POD-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "shows confetti only for first place"`

**C82** - A classificação segue a ordem do `podium`, com espectadores por último com "Espectador(a)" e 0 pontos (POD-01, AC 7)
Proof: `npx vitest run packages/phone/src/model/players.test.ts -t "orders the podium and puts spectators last with zero"`

**C83** - "SEU RENDIMENTO" soma as palavras do jogador em todas as rodadas da partida (POD-01, AC 4)
Proof: `npx vitest run packages/phone/src/model/match-summary.test.ts -t "counts the player's words across rounds"`

**C84** - "MAIOR PALAVRA ENCONTRADA" traz a maior palavra sem acento, as grafias, os pontos e o número de letras (POD-01, AC 5)
Proof: `npx vitest run packages/phone/src/model/match-summary.test.ts -t "keeps the longest word with spellings, points and length"`

**C85** - Depois de recarregar no meio da partida, o resumo conta só as rodadas vistas depois (POD-01, AC 6)
Proof: `npx vitest run packages/phone/src/state/match.test.ts -t "counts only the rounds seen after a reload"`

**C86** - A classificação inteira rola acima dos botões fixos e o último jogador fica visível (POD-01, AC 8)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "scrolls the whole ranking above the fixed buttons"`

**C87** - "JOGAR DE NOVO" manda `play-again` (POD-01, AC 9)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "play again sends play-again"`

**C88** - "Voltar ao Lobby" no pódio manda `back-to-lobby` (POD-01, AC 10)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "back to lobby from the podium sends back-to-lobby"`

**C89** - "ENCERRAR SALA" no pódio só manda `close-room` depois de confirmar (POD-01, AC 11)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "closes the room from the podium only after the confirmation"`

**C90** - O participante vê "Aguardando <anfitrião> decidir…" no lugar dos botões (POD-01, AC 12)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "non-host waits for the host to decide"`

**C91** - Quem foi espectador a partida toda vê só a classificação e "Você joga na próxima partida" (POD-01, AC 13)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "a spectator of the whole match sees only the ranking"`

**C92** - Toda tela em 320, 360, 390, 430 e 480 px de largura mostra todo o conteúdo sem rolagem horizontal e sem texto cortado (UI-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "fits every width from 320 to 480 pixels without horizontal scroll"`

**C93** - O topo mostra só "SALA <código>", o ícone de preferências e, para o anfitrião, o menu (⋮) (UI-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "shows only the room tag, preferences and the host menu on top"`

**C94** - Todo botão tem pelo menos 48 px de altura (UI-01, AC 7)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "keeps every button at least 48 px tall"`

**C95** - `kicked` mostra a tela de `phone-kicked.png` (EXIT-01, AC 1)
Proof: browser captures/phone-kicked.running.png

**C96** - `idle` e `tv-gone` levam ao texto "A sala foi encerrada" (EXIT-01, AC 3)
Proof: `npx vitest run packages/phone/src/model/messages.test.ts -t "maps idle and tv-gone to the room closed text"`

**C97** - `closed-by-host` mostra a tela de `phone-room-closed.png`, com o nome do anfitrião (EXIT-01, AC 2)
Proof: browser captures/phone-room-closed.running.png

**C98** - "ENTRAR EM OUTRA SALA" abre a tela de digitar o código (EXIT-01, AC 5)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/exit.spec.ts -g "enter another room opens the code screen"`

**C99** - Depois de `closed` com `replaced`, a conexão não tenta reconectar (EXIT-01, AC 4)
Proof: `npx vitest run packages/phone/src/net/room-connection.test.ts -t "does not reconnect after replaced"`

**C100** - Durante a reconexão a tela atual continua e o tabuleiro fica esmaecido e travado (RECON-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/reconnect.spec.ts -g "keeps the screen and locks the board while reconnecting"`

**C101** - Ao reconectar, as palavras da rodada voltam e a faixa "Conectado" aparece por 1 s (RECON-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/reconnect.spec.ts -g "restores found words and flashes Conectado"`

**C102** - Uma queda sem `closed` mostra "Reconectando…" e reabre o socket com o token (RECON-01, AC 1)
Proof: `npx vitest run packages/phone/src/net/room-connection.test.ts -t "reconnects with the token after an unexpected close"`

**C103** - O CSS do pacote não usa `blur`, `backdrop-filter`, nem transição ou animação fora de `transform` e `opacity` (UI-01, AC 4)
Proof: `npx vitest run packages/phone/src/styles/styles.test.ts -t "animates only transform and opacity, with no blur"`

**C104** - Sem `navigator.vibrate`, a opção "Vibrar" não aparece (PREF-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/prefs.spec.ts -g "hides Vibrar without navigator.vibrate"`

**C105** - Depois de 30.000 ms sem reconectar, o status vira `offline`; com 29.999 ms ainda é `reconnecting` (RECON-01, AC 4)
Proof: `npx vitest run packages/phone/src/net/room-connection.test.ts -t "goes offline after 30 seconds without reconnecting"`

**C106** - A Wake Lock é pedida no lobby e na rodada, solta nas outras fases e pedida de novo ao voltar a ficar visível (PREF-01, AC 4)
Proof: `npx vitest run packages/phone/src/state/prefs.test.ts -t "holds the wake lock in the lobby and the round and asks again when visible"`

**C107** - Todo `ErrorCode` e todo `CloseReason` têm texto na tabela pt-BR (UI-01, AC 5)
Proof: `npx vitest run packages/phone/src/model/messages.test.ts -t "has a string for every error code and close reason"`

**C108** - O ícone de pessoa abre as preferências com "Vibrar" e "Som ao acertar" desligados e "Fechar" (PREF-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/prefs.spec.ts -g "opens the preferences with both switches off"`

**C109** - Uma preferência ligada continua ligada depois de recarregar (PREF-01, AC 2)
Proof: `npx vitest run packages/phone/src/state/prefs.test.ts -t "keeps preferences across reloads"`

**C110** - Soltar o dedo com uma peça só não mostra feedback nem envia nada (Edge Cases, PLAY-01)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "ignores a release with a single tile"`

**C111** - Tirar o dedo do tabuleiro durante o deslize conta como soltar (Edge Cases, PLAY-01)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "leaving the board releases the path"`

**C112** - Envios ainda no debounce são descartados quando chega `round-results` (Edge Cases, PLAY-01)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "drops pending paths when the results arrive"`

**C113** - O CSS do pacote não usa `display: grid` nem `gap` (UI-01, AC 3)
Proof: `npx vitest run packages/phone/src/styles/styles.test.ts -t "uses no CSS grid and no gap"`

**C114** - O CSS do celular não tem cor literal; usa só as variáveis de `@bwords/theme` (UI-01, AC 2, AD-017)
Proof: `npx vitest run packages/phone/src/styles/styles.test.ts -t "uses only theme variables for colors"`

**C115** - `error` com `wrong-phase` ou `not-host` não muda a visão (Edge Cases, ENTRY-01)
Proof: `npx vitest run packages/phone/src/model/room-view.test.ts -t "ignores wrong-phase and not-host errors"`

**C116** - Vários `settings` seguidos deixam a visão com o último (Edge Cases, HOST-01)
Proof: `npx vitest run packages/phone/src/model/room-view.test.ts -t "keeps the last settings from the server"`

**C117** - Uma TV e 3 celulares jogam 2 rodadas, do lobby ao "JOGAR DE NOVO" (Success Criteria, PLAY-01, RES-01, POD-01)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/full-match.spec.ts -g "plays a two-round match with three phones until play again"`

**C119** - Com a rodada aberta, o tabuleiro inteiro cabe na tela sem rolagem em 320×568, 390×844 e 480×932, sempre quadrado (UI-01, AC 9)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "fits the whole board on screens from 320x568 to 480x932"`

**C120** - O CSS não usa largura ou altura em px acima de 64 px; containers usam unidades relativas (UI-01, AC 8)
Proof: `npx vitest run packages/phone/src/styles/styles.test.ts -t "sizes containers only with relative units"`

**C121** - Nas larguras fora de 390 px, cada tela com capture mantém a composição e a ordem da capture (UI-01, AC 10)
Proof: walk - o sub-agente de telas abre cada tela com capture a 320 e 480 px e compara composição e ordem com a capture

**C122** - Deitado (844×390) e em tablet (768×1024), cada tela ocupa a largura proporcionalmente, sem rolagem horizontal; rolagem vertical é aceita (Edge Cases, UI-01)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/layout.spec.ts -g "scales proportionally on landscape and tablet without horizontal scroll"`

**C123** - Depois de `room-not-found` a conexão não tenta reconectar; usar "CONTINUAR" de novo abre uma conexão nova (Edge Cases, ENTRY-01)
Proof: `npx vitest run packages/phone/src/net/room-connection.test.ts -t "stops reconnecting after room-not-found"`

**C124** - Na contagem da rodada seguinte todo aparelho recebe a lista de jogadores sem a marca de espectador antes do `round-start` (SPEC-01, AC 3)
Proof: `npx vitest run packages/core/src/room/round.test.ts -t "tells every connection that the former spectator plays, before the round starts"`

**C125** - O chip de rodadas diz "1 Rodada" no singular e "N Rodadas" no plural (LOBBY-01)
Proof: `npx vitest run packages/phone/src/strings/pt-BR.test.ts -t "says rounds in the singular for one round"`

**C118** - As telas sem capture foram fotografadas a 390 px e mostradas ao user (UI-01)
Proof: walk - cada foto em `captures/uncaptured/` com a resposta do user em `## Handoff`

**C126** - Dois deslizes de CASA soltos antes de o primeiro ser julgado dão "JÁ ENCONTRADA" no segundo, CASA uma vez na lista e um só `submit` (PLAY-01, AC 8)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "shows already found for a second swipe of a word released before the first one was judged"`

**C127** - Cada veredito tem a cor de `phone-feedbacks.png` pelo seu token (VÁLIDA `--color-valid`, JÁ ENCONTRADA `--color-already-found`, INVÁLIDA `--color-invalid`, MUITO CURTA `--color-too-short`) e só a palavra inválida treme (PLAY-01, AC 6-10)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "colors each verdict and shakes an invalid word"`

**C128** - `kicked` apaga o token da sala no storage (EXIT-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/exit.spec.ts -g "shows the kicked screen and forgets the token"`

**C129** - `closed-by-host` apaga o token da sala no storage (EXIT-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/exit.spec.ts -g "shows who closed the room and forgets the token"`

**C130** - O tabuleiro do espectador não reage ao toque (SPEC-01, AC 1)
Proof: `npx vitest run packages/phone/src/model/board-lock.test.ts -t "locks the board for a spectator and for a phone that has not joined"`

**C131** - Os `.tsx` do celular não escrevem cor literal; a cor inicial do seletor personalizado vem do `core`, como a `PALETTE` (UI-01, AC 2, AD-017)
Proof: `npx vitest run packages/phone/src/styles/styles.test.ts -t "writes no literal color in the components and screens"`

**C132** - O `theme-color` do `index.html` é o `--color-background` de `packages/theme/tokens.css`, e a página não escreve outra cor (UI-01, AC 2, AD-017)
Proof: `npx vitest run packages/phone/src/styles/styles.test.ts -t "keeps the index.html theme-color equal to the theme background and writes no other color"`

**C133** - O dev server do celular responde 403 ao pacote `pt-BR.dict.bin` e aos arquivos de `languages/` pedidos por `/@fs/` (UI-01, AC 11, PROTO-01 AC 8)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/dev-server.spec.ts -g "never serves the dictionary through the dev server"`

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** defaults da fase 2 aceitos, com a correção do nome do anfitrião em laranja com "…" na tela de entrada (T44) e da reconexão depois de `room-not-found` (T43); user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults da fase 2 e sigo para a fase 3, já corrigindo os dois achados?"); paleta do design system "BWords Party System" em `packages/theme/tokens.css`, usada pelo celular e pelas ferramentas (AD-017); user: "Aceito seguir, mas antes disso, registre a paleta de cores do projeto de acordo com as cores que tem definidas no MCP do layout, crie as variaveis css e reutilize em todo o projeto"; default da T43 aceito: depois de `room-not-found` a conexão fica `closed` e CONTINUAR abre um socket novo; user: "Aceito como está."; defaults da fase 3 aceitos (textos de confirmação, telas de saída, sem bandeira e foguete, volume ao soltar); as diferenças visuais do lobby do anfitrião (etiquetas da Ana e do espectador, "Tempo da Rodada" em duas linhas, ícone de preferências laranja) ficam para o sub-agente de telas; user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults da fase 3 e sigo para a fase 4?"); defaults da fase 4 aceitos (relógio arredondado para cima, contagem em 3 acima de 3 s, caminho descartado sem aviso depois de `endsAt` ou reconectando, INVÁLIDA antes do salt, recusa não tira palavra confirmada, janela de 10 caminhos/s, segunda corrida da mesma palavra é JÁ ENCONTRADA) e o desvio de `reconcileFound`; a perda da fila na reconexão fica para a T38; user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults da fase 4 e sigo para a fase 5?"); defaults da fase 5 aceitos (barra de topo comum na contagem, "Tempo!" em cartão sobre o tabuleiro esmaecido, palavra na cor do jogador e depois na do veredito por 0,5 s, chips em maiúsculas sem acento, lista do espectador sem vitórias e com "N jogadores", anfitrião espectador com "Voltar ao lobby", tabuleiro do espectador na largura com rolagem); diferenças visuais ficam para o sub-agente de telas; user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults da fase 5 e sigo para a fase 6?"); defaults da fase 6 aceitos (ordem por pontos e depois alfabética, "+1 pt", maior palavra com os pontos ganhos e oculta sem palavras, subtítulo do cartão da TV, "Voltar ao Lobby" sem confirmação só no pódio, "Encerrar sala" no menu das duas telas, rendimento só das rodadas vistas, espectador sem espera no pódio, placar rápido com rolagem lateral, desconectado esmaecido); defeitos de layout do pódio vistos pelo orquestrador (letras de CORACOES quebram e o "S" desce sozinho; "DESCONECTADO" cortado na linha do Caio; confetes sobre os textos) vão para a T40 e o sub-agente de telas; user: "Aceito, seguir" (resposta à pergunta "Aceita os defaults da fase 6 e sigo para a fase 7?"); defaults da fase 7 aceitos (faixa de reconexão no fluxo, "Conectado" no `welcome`, "Sem conexão" em vermelho com "Tentar de novo", título "Preferências", palavras reenviadas voltam como não confirmadas, etiquetas menores nas listas) e as 13 fotos de `captures/uncaptured/` aprovadas como estão (reconectando, sem conexão, preferências, confirmações de remover, encerrar e cancelar rodada, resultado e pódio de participante e de espectador, Tempo!, inatividade, outra aba); user: "Aceito tudo" (resposta à pergunta "Aceita os defaults da fase 7 e as 13 fotos como estão?")
**Dispatched:** batch worker fase 1 (T1-T8) em HEAD 3db40cb - returned (T1-T8 em b3e2638..a0418b6; phone 116 testes, vitest total 551, build gate verde). Desvios marcados com SPEC_DEVIATION, a confirmar pelo user: `screenFor(view, serverNow)` sem o parâmetro de conexão e com a tela extra `connecting`; `openSocket` é `(path, events) => {send, close}` com `schedule` injetado, e o adaptador do navegador fica em `net/browser.ts`. Defaults do worker, a confirmar: token em `bwords.token.<CODE>`; textos próprios para `bad-message`, `wrong-phase`, `not-host`, `bad-token`, `bad-color`, `bad-settings`, `bad-target`; `bad-token` apaga o token e reconecta sem ele; `replaced` mantém o token; `join` manda o apelido aparado mesmo inválido, para o servidor responder `bad-nickname`; cores de alerta #ffd23f, texto secundário #a8a6b4 e texto sobre primária #2e1500. Para a fase 2: `main.tsx` monta o store com `createRoomConnection` + `browserSocket`; `app.tsx` precisa de um relógio que bata para trocar a contagem pelo tabuleiro; fakes de teste em `src/testing/fakes.ts`; batch worker fase 2 (T9-T14) em HEAD 4c677ca - returned (T9-T14 em 49aaa6d..2df4134, com o 765c0d1 do orquestrador no meio; phone vitest 153, phone e2e 18, vitest total 588, play e2e 10; build gate verde). Fotos `phone-code`, `phone-join` e `phone-lobby` `.running.png` a 390 px, por uma config separada (`playwright.pictures.config.ts`) com sala simulada (`e2e/fake-room.ts`). Defaults do worker, a confirmar: textos novos ("Jogadores", "Você", aria-labels); cor pré-selecionada = primeira livre do PALETTE; campo de apelido limitado a 12 caracteres; erros de apelido sob o campo, de cor sob as cores, o resto acima de ENTRAR; CONTINUAR incompleto foca a primeira caixa vazia; tela de entrada sem ícone de preferências; ícone de preferências sem ação até a T37. Diferenças visuais pendentes: em `phone-join` o nome do anfitrião não está em laranja e falta o "…" de "Aguardando Ana iniciar a partida…". Achado: em `room-not-found` o servidor fecha sem `closed` e a conexão segue tentando reconectar em segundo plano; batch worker fase 3 (T43, T44, T15-T19) em HEAD 2b19d53 - pausado pelo user depois da T43 (`9e61a18`); T44 e T15-T19 por fazer; batch worker fase 3, resto (T44, T15-T19), a partir de 47801cc + o registro do default da T43 - returned (T44 db23629, T15 93979cf, T16 721e4aa, T17 101f0c6, T18 d2ac898, T19 no commit desta nota; phone vitest 160, phone e2e 38, vitest total 595, play e2e 10; build gate verde). Fotos a 390 px: `phone-join` refeita, `phone-host-lobby`, `phone-host-actions`, `phone-kicked` e `phone-room-closed` `.running.png`; as do anfitrião numa janela da altura da página, para o botão fixo e a folha ficarem no pé, como na capture. Defaults do worker, a confirmar: `formatRoundTime` no lugar de `formatSeconds`; contagem do lobby do anfitrião só com o número ("4"), como na capture; sem a bandeira no seletor de dicionário e sem o foguete em INICIAR PARTIDA; confirmação de remover com o botão "Remover"; confirmação de encerrar com "Encerrar a sala? Todos os jogadores saem." e o botão "Encerrar sala"; "Encerrar sala" em vermelho no menu; `idle`/`tv-gone` sem "Obrigado por jogar!"; tela `replaced` só com o texto, sem botão; volume enviado no `change` do slider (ao soltar). Lacuna: C39 confere que o servidor mandou `round-start` e que os celulares saíram do lobby; a contagem ainda é a tela de conexão até a fase 5. Para a fase 4+: `HostMenu` recebe itens com confirmação (servirá a "Voltar ao lobby"), `ConfirmDialog` e `Sheet` prontos; jogadores Node do E2E têm `waitFor` e `messages()`; batch worker fase 4 (T20-T26) a partir de 7f22f91 + este registro - returned (T20 6ee6f60, T21 15bcf7d, T22 7ff0293, T23 1d8b1da, T24 f78d5af, T25 0eb68bf, T26 1e4bf03; phone vitest 220, phone e2e 38, vitest total 655, play e2e 10; build gate verde; as 18 provas Vitest da fase (C46-C50, C52-C60, C63, C64, C110, C112) selecionam um teste cada). Desvio marcado com SPEC_DEVIATION: `reconcileFound(found, sentWords, results)`, porque a recusa no `submit-result` não traz a palavra. Fora do Where das tarefas, para ligar o estado da rodada: `RoomStore` ganhou `submit(paths)` e `listen(listener)`; `model/board-lock.ts` (`isBoardOpen`, com teste) decide quando o tabuleiro aceita o dedo; `fakeConnection` aceita um relógio e `fakeDevice` entrou em `testing/fakes.ts`. Defaults do worker, a confirmar: o timer arredonda o segundo para cima ("00:00" só no fim); a contagem fica em 3 com mais de 3 s; soltar o dedo depois do `endsAt` ou durante a reconexão descarta o caminho sem feedback; antes de chegar o salt, toda palavra é "INVÁLIDA"; uma palavra recusada que o servidor já tinha confirmado fica na lista; o envio respeita a janela de 10 caminhos por segundo e espera a janela abrir para o resto; o relógio do servidor (`serverNow`) conta a janela e o `submitDelay`. Para a fase 5: `store.round` expõe `path`, `feedback`, `pendingPaths`, `extendPathTo(tile)` e `releasePath()`; o `BoardScreen` liga os pointer events a `tileAtPoint(..., HIT_RADIUS_RATIO)` e `extendPathTo`, e o soltar/sair do tabuleiro a `releasePath`; `formatClock`, `isAlert`, `countdownNumber` e `foundTotals` estão prontos; `main.tsx` passa vibração, som e preferências desligados até a T36-T37. Lacuna: caminhos ainda na fila quando a conexão cai se perdem no `welcome` da volta (o servidor só devolve o que aceitou); avaliar na T38; batch worker fase 5 (T27-T30) a partir de c446235 + este registro - returned (T27 acf9a2f, T28 370106d, T29 646d817, T30 9c7476f; phone vitest 234, phone e2e 48, vitest total 669, play e2e 10; build gate verde). Fotos a 390 px: `phone-countdown`, `phone-board`, `phone-feedbacks` e `phone-spectator` `.running.png`; a do espectador numa janela da altura da página; a de `phone-feedbacks` é uma folha com os quatro cartões da palavra fotografados no app rodando, empilhados numa página de 390 px, sem redimensionar. O E2E da C39 agora confere a contagem ("Prepare o dedo!") nos dois celulares. Defaults do worker, a confirmar: a contagem tem o topo comum (etiqueta da sala à esquerda, preferências e menu do anfitrião) no lugar da linha "SALA KBXT" centralizada da capture, e mantém "As letras aparecem em instantes…", que está na capture e não na lista do AD-005; "Tempo!" aparece num cartão sobre o tabuleiro esmaecido, com o timer em 00:00; a palavra acima do tabuleiro mostra as peças do dedo na cor do jogador e, ao soltar, a palavra julgada na cor do veredito por 0,5 s, com o selo embaixo das peças, como em `phone-board`; a última peça do caminho ganha um contorno; o chip mais recente das palavras encontradas fica na cor do jogador; as palavras aparecem em maiúsculas sem acento (o celular só conhece a forma normalizada); o espectador vê a lista sem vitórias e sem coroa, como na capture, com "N jogadores"; o anfitrião espectador também tem o menu (⋮) com "Voltar ao lobby"; o tabuleiro do espectador ocupa a largura e a página rola se faltar altura. Diferenças visuais para o sub-agente de telas: na contagem a etiqueta da sala fica no topo e não abaixo do selo da rodada; em `phone-board` a cor do Beto (PALETTE[4]) é mais escura que o azul da capture e o placar é "5 pal · 9 pts" (coerente com as 5 palavras) no lugar de "12 pal · 18 pts"; em `phone-spectator` a página fica mais alta (as linhas da lista são as do lobby), as etiquetas da Duda quebram em duas linhas, a linha da Duda não tem fundo destacado e "ESPECTADOR(A)" segue a cor do lobby (vermelha). Para a fase 6: `useServerClock` foi para `state/server-clock.ts`; `roundPosition` (`model/round-position.ts`) dá "Rodada N de M"; `MatchHostMenu` está em `components/HostMenu.tsx`; `PlayerRow` aceita `wins` opcional; `fakeRoom` devolve `{ push, sent }` e aceita quadros binários; `e2e/round-room.ts` tem `openRound`, `swipe`, `slideOver` e `tileCenter`, e `e2e/samples.ts` tem `SAMPLE_BOARD`, `SAMPLE_WORDS`, `roundWelcome` e `sampleHashFrame`; as fotos com feedback usam `page.clock.install` para o feedback não sumir; em `app.tsx`, `round-result` e `podium` ainda apontam para `ConnectingScreen`.; batch worker fase 6 (T31-T35) a partir de ed1a916 + este registro - returned (T31 9c2bd87, T32 bbdad44, T33 624f3b1, T34 3dff169, T35 no commit desta nota; phone vitest 254, phone e2e 61, vitest total 689, play e2e 10; build gate verde). Fotos a 390 px: `phone-round-result` e `phone-podium` `.running.png`, numa janela da altura da página por causa dos botões fixos; na do pódio o confete fica parado no meio da queda (animações pausadas em pontos diferentes), como na capture. As E2E do resultado e do pódio usam a sala simulada (`fakeRoom`), com `resultsWelcome`, `sampleResults`, `PODIUM_PLAYERS` e `SAMPLE_PODIUM` em `e2e/samples.ts`. Fora do Where das tarefas: `resultRounds` em `model/results.ts` (rodada que acabou e a próxima, pelo `last` do servidor) e `podiumTags` em `model/players.ts`, ambos com teste; componentes novos `RoundScoreCard`, `ResultWordList`, `QuickScoreboard`, `ResultHostActions`, `SecondaryButton`, `WaitingNote`, `PodiumHighlight`, `MatchPerformance`, `RankingList`, `PodiumHostActions` e `Confetti`; `PhoneStore` ganhou `match`. Defaults do worker, a confirmar: subtítulo do cartão da TV "Acompanhe no telão a revelação das palavras" (a capture corta o texto); "somados nesta rodada!" e "PLACAR ACUMULADO" ficam, por terem dado por trás; palavras do resultado ordenadas por pontos (maior primeiro) e depois em ordem alfabética; só entram as palavras em comum que o servidor confirmou para este celular; "+1 pt" no singular; pontos da maior palavra = os que o jogador ganhou com ela (dobrados se única); o bloco da maior palavra some se o jogador não achou nenhuma; uma rodada recebida de novo (reconexão nos resultados) substitui a anterior no histórico; o histórico zera no `round-start` da rodada 0; o anfitrião tem o menu (⋮) com "Encerrar sala" no resultado e no pódio (UI-01 AC 6), além do botão ENCERRAR SALA do pódio; "Voltar ao Lobby" do pódio age sem confirmação (POD-01 AC 10), o do resultado pede; confirmação do ENCERRAR SALA com o texto e o botão do lobby; o espectador da partida inteira não vê "Aguardando…" no pódio; no resultado o espectador vê "Aguardando <anfitrião> avançar…"; "Aguardando…" sem os pontinhos animados, porque o texto já termina em "…"; linha desconectada no pódio com a etiqueta DESCONECTADO e esmaecida; mais de 4 jogadores rolam de lado dentro do placar rápido. Diferenças visuais para o sub-agente de telas: no resultado a pílula "Você está em 1º lugar" fica embaixo de "32 pts" e não ao lado; o selo da posição é um círculo dourado; o espectador do placar rápido não tem "4º" em cima (a regra da T13 não dá posição a espectador); faltam o foguete de PRÓXIMA RODADA e de JOGAR DE NOVO (como na fase 3); pontos coerentes com as palavras (CORACOES +12, base +6) no lugar de +16/base +8; no pódio o resumo mostra 4 palavras (só a rodada vista) no lugar de 28, o círculo de posição da Duda fica vazio, as etiquetas da Ana quebram em duas linhas e a porta de "Voltar ao Lobby" é outro desenho. Para a fase 7: `match.summary` só conta o que o celular viu; o T41 (partida inteira) pode conferir "SEU RENDIMENTO" contra as palavras enviadas; `WaitingNote` e `SecondaryButton` servem às telas que faltam; o layout das telas novas ainda não passou pelas larguras 320-480 (T40).; batch worker fase 7 (T36-T42) a partir de 27267e2 + este registro - returned (T36 42f1eab, T37 25c28bc, T38 0c41b1e, T39 f5aa502, T40 01b964c, T41 8f05722, fix 4ddaf41, T42 no commit desta nota; phone vitest 289, phone e2e 71, vitest total 724, play e2e 10; build gate verde). T36: `state/prefs.ts` (preferências em `bwords.prefs`, Wake Lock pedida no lobby e na rodada e de novo ao ficar visível); `state/safe-storage.ts` guarda todo acesso ao storage, então um storage que lança exceção não quebra o store. T37: `device/` (wake lock, vibração, bipe Web Audio) ligado no `main.tsx`; `PrefsSheet` aberta pelo ícone de pessoa, renderizada pelo `app.tsx`. T38: faixa em `components/ReconnectBanner.tsx`, montada por `screens/RoomTopBar.tsx` (topo + faixa) em toda tela de sala, e por `ConnectionBanner` na entrada e na tela de conexão; a regra fica em `model/connection-banner.ts` e `state/banner.ts`. Lacuna da fila resolvida: caminhos na fila ou enviados sem resposta antes da queda são guardados; depois do `welcome` da mesma rodada, os que o `welcome` não lista voltam à lista (não confirmados) e são reenviados (`stillUnsent` em `model/submit-queue.ts`); durante a reconexão nada é enviado. Achado corrigido (4ddaf41): um socket que abre e cai antes do `welcome` reiniciava a janela de 30 s, e o "Sem conexão" nunca chegava; agora o prazo só some com o `welcome`. T39: auditoria lê os CSS do disco (o Vitest entrega `.css` vazio, mesmo com `?raw`); o CSS já passava. T40: `e2e/layout.spec.ts` com 21 telas e estados (`e2e/screen-states.ts`) em 320-480 × 568/932, deitado e tablet; defeitos do pódio corrigidos: peças da maior palavra numa linha só (encolhem), confete dentro do cartão do vencedor e por baixo dos textos, etiquetas compactas nas listas; fotos refeitas: `phone-board`, `phone-host-actions`, `phone-host-lobby`, `phone-lobby`, `phone-podium`, `phone-spectator`. T41: o teste lê o pacote pt-BR de `tools/dict-build/dist` só no Node para achar palavras do tabuleiro real; confere SEU RENDIMENTO 4/2/2 contra as palavras enviadas. T42: 13 fotos em `captures/uncaptured/` (reconectando, sem conexão, preferências, confirmações de remover, encerrar e cancelar rodada, resultado e pódio de participante e de espectador, Tempo!, inatividade, outra aba); falta a resposta do user sobre cada foto (C118). Defaults do worker, a confirmar: faixa dentro do fluxo logo abaixo do topo (empurra o conteúdo; o tabuleiro encolhe); "Conectado" só depois do `welcome`, não na abertura do socket; "Sem conexão" em vermelho com "Tentar de novo" ao lado; folha de preferências com título "Preferências"; palavras reenviadas depois da reconexão voltam à lista como não confirmadas; etiquetas menores nas listas (lobby e pódio). Diferenças visuais restantes: no lobby do anfitrião as etiquetas da Ana ainda quebram em duas linhas a 390 px (no pódio cabem); o círculo de posição do espectador no pódio fica vazio (laranja na própria linha); o resto das diferenças das fases anteriores segue para o sub-agente de telas.; walker + check_proofs (implement.md passos 9 e 10.1) a partir deste registro - returned (98cf18e tira de tasks.md a cópia duplicada da lista de tarefas que entrou no 921799f; walk em 8595e2b: todas as histórias andadas no app rodando, ok exceto o Espectador - quem entra durante a rodada continua espectador no celular na rodada seguinte e não consegue jogar, porque o servidor não manda `players` no `round-start` e o `startRound` do celular mantém os `players` antigos; nenhum critério nem teste cobre "jogar na rodada seguinte" (critério faltando, não corrigido); observações sem critério: chip "1 Rodadas" com 1 rodada; com o menu (⋮) do anfitrião aberto, o primeiro deslizar só fecha o menu; 5c3cff3 escapa os parênteses do `-g` da prova da C34, que não selecionava o teste; proofs.md em HEAD 5c3cff3: 117 pass, 12 not judged (as fotos das captures, para o sub-agente de telas), build verde); achados do walk corrigidos pelo orquestrador: T45 (3c01f62, espectador preso na rodada seguinte) e T46 (a2984ce, "1 Rodada"); o menu (⋮) aberto engolir o primeiro deslize ficou como observação, sem critério; Verifier (validate.md) e sub-agente de telas (verify-screens.md) em HEAD a6e7f1a - returned (telas 31aac34: 6 batem, 6 diferem, round 1; Verifier a8ef07a: FAIL, 12 mutações com 11 mortas e `recheckFound` sobrevivente, 1 achado Medium e 4 Minor); fixer dos achados do Verifier e das diferenças de tela a partir de a8ef07a + este registro - dispatched; etiquetas da Ana (as captures do lobby do anfitrião e do participante se contradizem) perguntadas ao user
**Walked:** 2026-10-29, sobre 98cf18e, com `npm run debug` (wrangler dev 8787 + página de debug 5174 como TV: "Criar sala" dá o código em `header strong`) e `npm run dev -w @bwords/phone` (5175), Playwright em Node com um contexto por celular (390×844, toque), gestos reais com o mouse sobre o tabuleiro; palavras válidas tiradas do `round-start` que o próprio celular recebeu, resolvidas com `boardSolutions` do pacote pt-BR (`tools/dict-build/dist`). Chegar na sala: ok - `/` mostra "Entrar numa sala" com 4 caixas e CONTINUAR; "z" vira "Z" e o foco passa à caixa 2; ZZZZ dá "Sala não encontrada"; o código certo em minúsculas abre `/<CODE>` na entrada; `/<CODE>` direto abre a entrada; recarregar ou abrir outra aba com o token vai direto ao lobby (`hello` com `token`); um token falso em `bwords.token.<CODE>` cai na entrada e o token some. Apelido e cor: ok - "1/12", "4/12", "12/12"; "A" dá a mensagem de 2 a 12; "ANA" dá "Esse apelido já está em uso"; a cor da Ana aparece travada com "Ana" embaixo; Personalizada perto da cor da Ana dá "Muito parecida com a cor de Ana", #050505 dá "Essa cor fica difícil de ver na TV"; `join` vai com o apelido aparado; `room-full` não foi andado (coberto pelo teste). Lobby do participante: ok - cartão, chips, VOCÊ/ANFITRIÃO(Ã), "2 na sala"; cada mudança do anfitrião (5×5, 3:00, rodadas, Mín. 4) aparece no chip do outro celular; fechar a aba de um jogador mostra DESCONECTADO; depois de uma partida o vencedor tem a coroa. Observação: com 1 rodada o chip diz "1 Rodadas" (o spec escreve "N Rodadas"). Lobby do anfitrião: ok - cada controle manda `settings` com `patch` e a página de debug mostra o valor (size=5, seconds=180, rounds, minLength=4, filterProfanity=false, fastMode=true, volume ao soltar o slider, muted=true); − desabilita em 0:30 e + em 3:00; Dicionário só "Português (BR)"; a folha do jogador com as três ações, Cancelar sem envio, Tornar anfitrião troca as telas dos dois; Remover pede "Remover Caio? Ele perde os pontos."; ⋮ → Encerrar sala pede confirmação e só então manda. Contagem: ok - "RODADA 1 DE 2", "Prepare o dedo!", 3-2-1 vistos, tabuleiro só a partir do `startsAt`. Tabuleiro e deslizar: ok - palavra em formação acima do tabuleiro, voltar à penúltima peça tira a última; VÁLIDA (+N PTS) com a palavra na lista e "1 pal · N pts"; repetida dá JÁ ENCONTRADA; caminho de vizinhos que não é palavra dá INVÁLIDA; 2 peças dá MUITO CURTA sem envio; o feedback some em ~0,5 s; `submit` agrupado só com os válidos; timer em alerta nos 10 s finais; "Tempo!" no `endsAt`; o tabuleiro cabe em 320×568, 390×844 e 480×932 sem rolagem lateral. Observação sem critério: com o menu (⋮) do anfitrião aberto, o primeiro deslizar só fecha o menu e é descartado. Anfitrião durante a partida: ok - ⋮ com "Voltar ao lobby" na contagem e na rodada; "Cancelar a rodada? O placar será zerado."; confirmado, os quatro celulares voltam ao lobby. Espectador: PROBLEMA - entrar durante a rodada 1 mostra a tela travada ("Você entra na próxima rodada.", "Assistindo", "JOGADORES NA SALA" sem contagem) e o toque não reage; mas na rodada 2 o celular continua na tela de espectador e não deixa jogar: o `startRound` do core zera `spectator` de todos, mas o servidor não manda `players` no `round-start`, e o `startRound` de `model/room-view.ts` mantém os `players` antigos (o mesmo vale para JOGAR DE NOVO e para a TV); nenhum critério nem teste cobre "jogar na rodada seguinte" (critério faltando). Resultado da rodada: ok - anfitrião vê "Rodada 1 de 2 • RESULTADO", OLHE PARA A TV, pontos, placar, 1º, palavra em comum ("em comum", com a grafia "(ilusória)") e única ("ÚNICA ×2", base), placar rápido com "Esp.", PRÓXIMA RODADA (2 DE 2) manda `next`, Voltar ao Lobby pede "Cancelar a partida?…" e Cancelar não manda nada; o participante vê "Aguardando Ana avançar…"; o espectador vê "Você joga na próxima rodada!"; na última rodada o botão é VER PÓDIO. Pódio: ok - "Você ficou em 1º Lugar!", PONTUAÇÃO TOTAL, NA SESSÃO, SEU RENDIMENTO 4 (as palavras da Ana nas 2 rodadas), MAIOR PALAVRA com peças e "10 letras", classificação na ordem com a espectadora por último ("Espectador(a)", 0 PTS) e a última linha acima dos botões; participante vê "Aguardando Ana decidir…"; quem entrou na última rodada vê só a classificação e "Você joga na próxima partida"; ENCERRAR SALA pede confirmação; JOGAR DE NOVO leva os celulares à contagem. Saída da sala: ok - removido vê "Você foi removido da sala", o token some e ENTRAR EM OUTRA SALA abre o código; o mesmo token numa segunda aba mostra "Você abriu o jogo em outra aba ou aparelho" na primeira, que não reconecta; Encerrar sala mostra "Ana encerrou a sala" e "Obrigado por jogar!". Reconexão: ok - com o socket do celular cortado por `context.routeWebSocket` (servidor real atrás; `setOffline` não derruba um WebSocket aberto no Chromium), aparece "Reconectando…" com o tabuleiro esmaecido e travado; de volta, "Conectado" e a palavra achada antes da queda continua na lista; 30 s sem rede dão "Sem conexão" com "Tentar de novo", que reconecta. Preferências: ok - folha com Vibrar e Som ao acertar desligados e Fechar; ligadas, ficam ligadas ao recarregar; sem `navigator.vibrate` a opção Vibrar some. Visual e textos: ok nas telas andadas - lobby e lobby do anfitrião sem rolagem lateral em 320×568. Para as fotos: os estados das captures saem com dados de exemplo (KBXT, Ana, Beto, Caio, Duda) por `npx playwright test -c packages/phone/playwright.pictures.config.ts` (sala simulada em `e2e/fake-room.ts`, dados em `e2e/samples.ts`, janela 390 px a 2x); no app real cada estado se alcança como acima: entrada em `/` e `/<CODE>`, lobby e lobby do anfitrião depois de ENTRAR, folha tocando outro jogador, contagem e tabuleiro com INICIAR PARTIDA, espectador entrando por `/<CODE>` durante a rodada, resultado no fim da rodada (0:30 no lobby encurta), pódio com VER PÓDIO, removido e sala encerrada pelas ações do anfitrião.

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

Phase 1:  T1 ---→ T2 ---→ T3 ---→ T4 ---→ T5 ---→ T6 ---→ T7 ---→ T8
Phase 2:  T9 ---→ T10 --→ T11 --→ T12 --→ T13 --→ T14
Phase 3:  T43 --→ T44 --→ T15 --→ T16 --→ T17 --→ T18 --→ T19
Phase 4:  T20 --→ T21 --→ T22 --→ T23 --→ T24 --→ T25 --→ T26
Phase 5:  T27 --→ T28 --→ T29 --→ T30
Phase 6:  T31 --→ T32 --→ T33 --→ T34 --→ T35
Phase 7:  T36 --→ T37 --→ T38 --→ T39 --→ T40 --→ T41 --→ T42 --→ T45 --→ T46
```

Execution is strictly sequential. Cada fase é um batch de subagente (Phase 1 tem 8 tarefas, o resto ≤ 7), e o orquestrador para entre as fases para mostrar o resultado e perguntar antes da próxima.
