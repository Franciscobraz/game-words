# M4.1 Playtest Tasks

**Approved**: 2026-11-03 - user: "aprovo as tarefas, antes de começar o batch 1, faça push dos commits até aqui."

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/m4-1-playtest/design.md`
**Status**: Draft
**Mutations**: 3
**Build**: `npx tsc -b; npm run lint -w @bwords/phone; npm run lint -w @bwords/tv; npx vitest run; npx playwright test; npx playwright test -c packages/phone/playwright.config.ts; npx playwright test -c packages/tv/playwright.config.ts`

### Regras de execução

- **Style guide:** todo código segue `docs/style-guide.md`: legibilidade (§3.1), SOLID (§4), componentes (§5), CSS só com flexbox e margens (§5.1), Signals (AD-015), cores só por tokens (AD-017).
- **Limites exatos (L-001):** todo limite tem um teste no valor exato e um logo depois: 999 e 1.000 ms do destaque, o topo e a última palavra inteira nos passos de ▲ e ▼, 0 e 1 em "plvr" e "pt", 29,9 e 30 s da vinheta, 15 000 e 15 001 ms antes do fim da rodada na aceleração da música, 1 e 2 dedos no bloqueio da pinça.
- **Um caso por ramo de tabela (L-007):** `applyServerMessage` (TV e celular), `screenFor`, `tvScreen`, `musicTrack` (uma linha por tela), `COMMAND_PHASES` das mensagens novas e `clientAsset` têm um caso por ramo.
- **Sem vazamento (L-008):** a prova de que nenhuma palavra da rodada chega a um celular antes de "Ver resultado" passa por toda mensagem que um celular e um convidado podem receber, inclusive o `welcome` de quem conecta ou reconecta na fase `words` (C17, C19).
- **Nomes dos testes:** cada teste citado em `## Checks` usa exatamente o nome da prova, porque `check_proofs.py` seleciona por `-t` (Vitest) e `-g` (Playwright).
- **Testes do M3 e do M4 que mudam:** só mudam os que um critério desta feature substitui, e o commit lista quais e por qual critério. Nenhum teste é enfraquecido. A lista prevista: celular `podium.spec.ts` "opens the podium when the last round ends" (vira C30), `prefs.test.ts` "starts with both preferences off" (vira C36), `prefs.spec.ts` "opens the preferences with both switches off" (passa a esperar as duas ligadas, FEEDBACK-02 AC 1), `exit.spec.ts` "enter another room opens the code screen" (vira C34), `entry.spec.ts` "shows the code screen at the root" (vira "shows the code screen at /join", C35), `round.test.ts` "drops pending paths when the results arrive" (passa a valer para a mensagem `phase` com `words`); TV `words.spec.ts` "follows the host during the scroll", "takes the last round through the words before the result", "scrolls until the last word is in view" e "says when no word was found" (viram C50-C59), `reveal.test.ts` de `scrollDurationMs` e `hold` (viram C42), `result.spec.ts` "shows the three cards with place and points" e "shows the round between rounds" (viram C67 e C70), `lobby.spec.ts` "shows the code and the real address" (C99) e "shows the empty lobby" (C100); servidor `assets.test.ts` "serves the phone at the root and at a room code" (vira C94 e C97).
- **Janelas vermelhas conhecidas:** a T3 muda o fim da rodada antes de os clientes conhecerem "Ver resultado". Os E2E que jogam pelo servidor real ficam vermelhos de T3 até a tarefa que os devolve: `packages/phone/e2e/full-match.spec.ts` e `host-match.spec.ts` até a T12, `packages/tv/e2e/full-match.spec.ts` até a T28. Os E2E da TV com sala simulada que esperam a ida automática ao resultado (`words.spec.ts`, `result.spec.ts`, `connection.spec.ts` "does not restart the scroll after a cut socket") ficam vermelhos de T17 até T21 e T26. Nesse intervalo o gate de cada tarefa roda os arquivos que ela lista, e o commit diz quais suítes esperam. O Build completo só é exigido no fim da fase 5 em diante.
- **Capture:** `captures/tv-round-result.png` tem 3840x2160; a foto é tirada numa janela de 1920x1080 com `deviceScaleFactor: 2`, com os dados de exemplo da capture (Ana, Beto, Caio, Duda, Lucas, Mariana, Pedro, Camila, Rafael, Bia; TERNOS), e salva em `.specs/features/m4-1-playtest/captures/tv-round-result.running.png`.
- **Diferenças pequenas:** diferenças como 10x10 px não contam (preferência do user).
- **Caminhadas do user:** C108 a C110 só se provam em aparelho real (TV LG, iPhone, som na sala). São do user, no fim, depois do deploy que ele pedir; o resultado entra em `**Walked:**`.
- **Código em inglês (AD-001):** identificadores, nomes de teste e mensagens de commit em inglês; este arquivo em português.
- **Histórico:** subagentes nunca usam `rebase`, `--amend` em commit já registrado nem `push --force`. Push só com pedido.
- **Ambiente Windows:** os scripts da skill rodam com `PYTHONUTF8=1` e `PYTHONPATH` apontando para a pasta do `sitecustomize.py` (ver `.specs/STATE.md`). Conferir as portas 8787, 9229, 5175 e 5176 livres antes dos E2E.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: `CLAUDE.md` ("Pronto quer dizer"), `docs/style-guide.md` §9, `vitest.config.ts`, `packages/phone/playwright.config.ts`, `packages/tv/playwright.config.ts`.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| --- | --- | --- | --- | --- |
| Regras do `core` (`room/`, `client/`) | unit | Todos os ramos; 1:1 com os ACs; limites exatos; L-008 em toda mensagem | `packages/core/src/**/*.test.ts` | `npx vitest run packages/core` |
| Servidor (Durable Object) | integration | O fluxo novo e a prova de vazamento no workerd | `packages/server/test/*.test.ts` | `npx vitest run packages/server/test` |
| Rotas com assets reais | integration | Cada rota e o 404 do pacote, com `wrangler dev` | `packages/server/e2e/*.test.ts` | `npx vitest run packages/server/e2e` |
| Regras da TV (`model/`) | unit | Todos os ramos; 1:1 com os ACs; limites exatos | `packages/tv/src/model/*.test.ts` | `npx vitest run packages/tv` |
| Estado e aparelho da TV (`state/`, `device/`) | unit | Ações, sons e erros com fakes | `packages/tv/src/{state,device}/*.test.ts` | `npx vitest run packages/tv` |
| Regras e estado do celular (`model/`, `state/`, `device/`) | unit | Só o que esta feature muda | `packages/phone/src/**/*.test.ts` | `npx vitest run packages/phone` |
| Telas da TV | e2e | Happy path, cada estado e edge case, com Playwright em 1920x1080 | `packages/tv/e2e/*.spec.ts` | `npx playwright test -c packages/tv/playwright.config.ts` |
| Telas do celular | e2e | Happy path, cada estado e edge case, em 390x844 com toque | `packages/phone/e2e/*.spec.ts` | `npx playwright test -c packages/phone/playwright.config.ts` |
| Config, docs e `tools/debug` | none | Build gate; config e docs com prova por comando | - | Build gate |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use | Command |
| --- | --- | --- |
| Quick | Tarefas só com testes unitários | `npx tsc -b; npx vitest run <pacote>` e o lint do pacote tocado |
| Full | Tarefas com E2E ou integração | Quick, mais `npx vitest run packages/server` ou `npx playwright test -c <config do pacote> <arquivos da tarefa>` |
| Build | Fim de fase da fase 5 em diante, e tarefas sem testes | `npx tsc -b; npm run lint -w @bwords/phone; npm run lint -w @bwords/tv; npx vitest run; npx playwright test; npx playwright test -c packages/phone/playwright.config.ts; npx playwright test -c packages/tv/playwright.config.ts` |

---

## Execution Plan

Phases run in order, and tasks run in order within a phase.

### Phase 1: Protocolo e sala

O servidor passa a ser dono da lista e do resultado; o som compartilhado e a correção da conexão entram no `core`.

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 2: Celular sincronizado

"Olhe para a TV", os controles do anfitrião e a saída para `/join`.

```
T8 → T9 → T10 → T11 → T12 → T13 → T45
```

### Phase 3: Retorno da palavra no celular

Preferências ligadas, o "check" e o caminho pintado.

```
T45 → T14 → T15 → T16 → T48
```

### Phase 4: Lista conduzida na TV

A etapa pela fase, a rolagem com destaque e os comandos do anfitrião.

```
T16 → T48 → T17 → T18 → T19 → T20 → T21 → T46
```

### Phase 5: Resultado na TV

Pontos e palavras, a ordem por rodada ou partida, a foto e a partida inteira pelo Worker.

```
T21 → T22 → T23 → T24 → T25 → T26 → T27 → T47 → T28
```

### Phase 6: Música e vinheta

As quatro músicas em todas as telas da TV (lobby, partida, vinheta e partida finalizada), a partida 1,5x mais rápida nos 15 s finais, a 50% dos efeitos, e a opção "Música".

```
T28 → T29 → T30 → T31 → T32 → T33 → T34 → T35
```

### Phase 7: TV sempre ativa e rotas

As camadas de tela ativa, `/` na TV, `/join` no celular e o endereço da sala.

```
T35 → T36 → T37 → T38 → T39
```

### Phase 8: Zoom, pendências e documentos

```
T39 → T40 → T41 → T42 → T43 → T44
```

---

## Task Breakdown

### T1: Protocol for the words stage

**What**: `Phase` ganha `words`; o cliente ganha `scroll` (`up`, `down`) e `show-result`; o servidor ganha `phase` e `scroll`; `PlayerInfo.words`, `PlayerResult.roundWords` e `PlayerResult.words` entram nos tipos; os `switch` exaustivos de TV, celular e `tools/debug` tratam os casos novos sem mudar o comportamento (fase `words` como `results` até as tarefas das telas).
**Where**: `packages/core/src/room/protocol.ts` (modify)
**Depends on**: None
**Reuses**: `SHAPES`, `parseClientMessage`
**Requirement**: WORDCTL-01

**Done when**:

- [x] C7
- [x] `npx tsc -b` verde no repositório inteiro
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): add the words phase and the host's list commands to the protocol`

---

### T2: Music setting

**What**: `Settings.music`, ligada numa sala nova e numa sala guardada sem o campo; validada como booleano.
**Where**: `packages/core/src/room/state.ts` (modify)
**Depends on**: T1
**Reuses**: `SETTING_RULES`, `sanitizeLoadedSettings`
**Requirement**: MUSIC-01

**Done when**:

- [x] C4-C6
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): add the music setting`

---

### T3: Round ends on the words

**What**: `endRound` leva a sala a `words`: a TV recebe `counts` e `round-results`, todos recebem `phase` com `words` e depois `players`; cada jogador soma `words`, e `round-results` traz `roundWords` e `words`; `beginRound` de partida nova e `returnToLobby` zeram `words`.
**Where**: `packages/core/src/room/results.ts` (modify)
**Depends on**: T2
**Reuses**: `scoreRound`, `awardWins`
**Requirement**: RESULT-02

**Done when**:

- [x] C1-C3
- [x] O commit diz que os E2E de partida inteira esperam a T12 e a T28 (Regras de execução)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): end the round on the words with word counts`

---

### T4: Host drives the words

**What**: `handleScroll` repassa ▲ e ▼ à TV; `handleShowResult` abre `results` (rodada do meio) ou `podium` (última); `COMMAND_PHASES`, `COMMAND_ROLES`, `HOST_COMMANDS` e `ACTIONS` ganham os dois comandos; `back-to-lobby` vale em `words`; `onPrepared` guarda a próxima rodada em `words`; quem entra em `words` é espectador.
**Where**: `packages/core/src/room/reveal.ts` (create)
**Depends on**: T3
**Reuses**: `podiumMessage`, `playersMessage`, `returnToLobby`
**Requirement**: WORDCTL-01, SYNC-01

**Done when**:

- [x] C8-C14
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): let the host scroll the words and show the result`

---

### T5: Welcome per stage without leaks

**What**: `afterWelcome` em `words` manda `round-results` só à TV; celular e convidado recebem só o `welcome`; um teste percorre toda mensagem que celular e convidado podem receber em `words`.
**Where**: `packages/core/src/room/machine.ts` (modify)
**Depends on**: T4
**Reuses**: `afterWelcome`
**Requirement**: SYNC-01

**Done when**:

- [x] C15-C18
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): send each connection what its stage allows`

---

### T6: Match through the Durable Object

**What**: `match.test.ts` toca "Ver resultado" em cada rodada, confere as contagens e reconecta um celular durante `words`; a prova de vazamento passa a cobrir o intervalo até `show-result`.
**Where**: `packages/server/test/match.test.ts` (modify)
**Depends on**: T5
**Reuses**: `playMatch`, `texts`
**Requirement**: SYNC-01

**Done when**:

- [x] C19, C20
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: integration
**Gate**: full
**Commit**: `test(server): play the words stage through the durable object`

---

### T7: Shared check sound

**What**: `synth.ts` no `core`: as interfaces estruturais de Web Audio (movidas de `packages/tv/src/device/audio.ts`), `Note`, `CHECK_SOUND` e `playNotes`; a TV passa a importar as interfaces de `@bwords/core`.
**Where**: `packages/core/src/client/synth.ts` (create)
**Depends on**: T6
**Reuses**: `packages/tv/src/device/audio.ts`, `packages/tv/src/testing/fake-audio.ts`
**Requirement**: FEEDBACK-02

**Done when**:

- [x] C21
- [x] Testes de `packages/tv/src/device/audio.test.ts` verdes, mesma contagem
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(core): share the check sound between the clients`

---

### T8: One offline deadline per drop

**What**: `startReconnecting` só agenda o prazo quando não há um (`cancelOffline ??=`).
**Where**: `packages/core/src/client/room-connection.ts` (modify)
**Depends on**: T7
**Reuses**: `createRoomConnection`
**Requirement**: M4FIX-01

**Done when**:

- [x] C22
- [x] "keeps the 30 second deadline while sockets open and drop before any welcome" continua verde
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `fix(core): keep one offline deadline when a socket drops before the welcome`

---

### T9: Phone follows the words stage

**What**: `round-results` só guarda os dados; `phase` muda a fase; `screenFor` leva `words` a `look-at-tv`; `state/round.ts` descarta os caminhos pendentes na mensagem `phase` com `words`.
**Where**: `packages/phone/src/model/screen.ts` (modify)
**Depends on**: T8
**Reuses**: `applyServerMessage`, `screenFor`
**Requirement**: SYNC-01

**Done when**:

- [x] C23
- [x] Um caso por mensagem em `applyServerMessage` e por fase em `screenFor` (L-007)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): follow the words stage`

---

### T10: Host list commands

**What**: `scroll(direction)` e `showResult()` no store da sala.
**Where**: `packages/phone/src/state/room.ts` (modify)
**Depends on**: T9
**Reuses**: `RoomConnection.send`
**Requirement**: WORDCTL-01

**Done when**:

- [x] C24
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): send the host's list commands`

---

### T11: Look at the TV screen

**What**: `LookAtTvScreen` com "Olhe para a TV" e "As palavras da rodada estão passando lá"; para o anfitrião, `WordsHostControls` com ▲, ▼ e "VER RESULTADO", alvos de 48 px ou mais, de 320 a 480 px.
**Where**: `packages/phone/src/screens/LookAtTvScreen.tsx` (create)
**Depends on**: T10
**Reuses**: `PrimaryButton`, `RoomTopBar`
**Requirement**: SYNC-01, WORDCTL-01

**Done when**:

- [x] C25-C28
- [x] Textos e `aria-label` de ▲ e ▼ na tabela de strings, forma neutra (AD-013)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): tell the players to look at the tv`

---

### T12: Phones open the result with the TV

**What**: Os E2E do resultado, do pódio, da reconexão e da partida inteira passam por "Ver resultado"; o pódio só abre depois dele.
**Where**: `packages/phone/e2e/podium.spec.ts` (modify)
**Depends on**: T11
**Reuses**: `packages/phone/e2e/fake-room.ts`, `phones.ts`
**Requirement**: SYNC-01

**Done when**:

- [x] C29-C33
- [x] `full-match.spec.ts` e `host-match.spec.ts` do celular verdes de novo
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `test(phone): open the result and the podium with the tv`

---

### T13: Leaving goes to /join

**What**: "ENTRAR EM OUTRA SALA" leva a `/join`, que mostra a entrada por código.
**Where**: `packages/phone/src/screens/ExitScreens.tsx` (modify)
**Depends on**: T12
**Reuses**: `parseRoomPath`
**Requirement**: ROUTE-01

**Done when**:

- [x] C34, C35
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): leave a room to /join`

---

### T45: Old rooms count 0 words

**What**: `loadRoom` dá 0 ao campo `words` de um jogador guardado sem ele.
**Where**: `packages/server/src/storage.ts` (modify)
**Depends on**: T13
**Reuses**: `sanitizeLoadedSettings`
**Requirement**: RESULT-02

**Done when**:

- [x] C111
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: integration
**Gate**: full
**Commit**: `fix(server): count 0 words for players stored without them`

---

### T14: Preferences on by default

**What**: "Vibrar" e "Som ao acertar" começam ligados sem preferência guardada; a escolha guardada vale em qualquer sala.
**Where**: `packages/phone/src/state/prefs.ts` (modify)
**Depends on**: T45
**Reuses**: `PREFS_KEY`, `loadPrefs`
**Requirement**: FEEDBACK-02

**Done when**:

- [x] C36-C38
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): turn the feedback preferences on by default`

---

### T15: Phone plays the check

**What**: `createHitSound(createContext)` toca `CHECK_SOUND` com `playNotes`.
**Where**: `packages/phone/src/device/hit-sound.ts` (modify)
**Depends on**: T14
**Reuses**: `playNotes`, `CHECK_SOUND`
**Requirement**: FEEDBACK-02

**Done when**:

- [x] C39
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(phone): play the check of the tv on a valid word`

---

### T16: Path painted with the feedback

**What**: O feedback guarda o caminho; `BoardGrid` pinta as peças dele com a cor do veredito enquanto o feedback aparece.
**Where**: `packages/phone/src/components/BoardGrid.tsx` (modify)
**Depends on**: T15
**Reuses**: `--color-valid`, `--color-already-found`, `--color-invalid`
**Requirement**: FEEDBACK-02

**Done when**:

- [x] C40, C41
- [x] "does not scroll or zoom while swiping" continua verde
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): paint the path with the feedback color`

---

### T48: Valid word in green

**What**: a palavra acima do tabuleiro e as peças do caminho ficam verdes (`--color-valid`) no feedback "VÁLIDA", no lugar da cor do jogador, que fica só no deslizar; achado do orquestrador no batch 2, contra FEEDBACK-02 AC 5-6.
**Where**: `packages/phone/src/styles/word-rack.css` (modify)
**Depends on**: T16
**Reuses**: `pathTone`, `RackTone`
**Requirement**: FEEDBACK-02

**Done when**:

- [x] C124
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `fix(phone): paint a valid word green`

---

### T17: TV follows the words stage

**What**: O redutor da TV lê `phase`; `RevealStage` perde `hold` e a ida ao resultado por tempo; `resultShownAt` marca a abertura do resultado para as peças acesas.
**Where**: `packages/tv/src/state/reveal.ts` (modify)
**Depends on**: T48
**Reuses**: `createRevealClock`, `revealPlan`
**Requirement**: WORDCTL-01

**Done when**:

- [x] C42
- [x] Um caso por mensagem em `applyServerMessage` e por etapa em `tvScreen` (L-007)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): follow the words stage from the server`

---

### T18: Scroll and highlight rules

**What**: `model/word-scroll.ts`: `highlightIndex`, `targetOffset`, `autoOffset`, `stepOffset` e `maxOffset`, com a linha de leitura no terço de cima.
**Where**: `packages/tv/src/model/word-scroll.ts` (create)
**Depends on**: T17
**Reuses**: -
**Requirement**: WORDCTL-01

**Done when**:

- [x] C43-C45
- [x] Limites exatos: 999 e 1.000 ms; passo que chega ao topo e à última palavra inteira
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): decide the scroll and the highlighted word`

---

### T19: TV check cue

**What**: `AudioCue` ganha `check`, tocado com `CHECK_SOUND` no volume e no mudo da sala.
**Where**: `packages/tv/src/device/audio.ts` (modify)
**Depends on**: T18
**Reuses**: `playNotes`
**Requirement**: WORDCTL-01

**Done when**:

- [x] C46
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): play the check`

---

### T20: Word scroll store

**What**: `state/word-scroll.ts`: modo `auto` ou `manual`, layout medido, `step` pelo `scroll` do servidor, destaque e "check" a cada palavra nova em `auto`.
**Where**: `packages/tv/src/state/word-scroll.ts` (create)
**Depends on**: T19
**Reuses**: `model/word-scroll.ts`, `createSoundStore`
**Requirement**: WORDCTL-01

**Done when**:

- [x] C47-C49
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): keep the scroll and the highlight of the words`

---

### T21: Words screen driven by the host

**What**: `WordScroll` mede o painel e as linhas, aplica o `transform` passo a passo e destaca com cor e escala; `WordsScreen` espera "Ver resultado", inclusive com "Nenhuma palavra encontrada".
**Where**: `packages/tv/src/components/WordScroll.tsx` (modify)
**Depends on**: T20
**Reuses**: `WordRow`, `wordRows`
**Requirement**: WORDCTL-01

**Done when**:

- [x] C50-C59
- [x] `words.spec.ts` e `connection.spec.ts` da TV verdes
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): let the host drive the words`

---

### T46: Players beside the words

**What**: `model/words-players.ts` calcula, a cada passo do destaque, os pontos somados de cada jogador da rodada, a ordem por pontos (empate pela entrada), o 1º e o 2º e quem acabou de pontuar; `WordsScreen` mostra o painel "Jogadores" à direita da lista, como em `captures/tv-words.png`, com cards de tamanho fixo que deslizam inteiros até a posição nova (FLIP com `transform`) e animam no "check" quem pontuou.
**Where**: `packages/tv/src/model/words-players.ts` (create), `packages/tv/src/screens/WordsScreen.tsx` (modify)
**Depends on**: T21
**Reuses**: a regra de plural da tabela de strings
**Requirement**: WORDCTL-01

**Done when**:

- [x] C112-C122
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit, e2e
**Gate**: full
**Commit**: `feat(tv): show the players beside the words`

---

### T22: Standings by round or match

**What**: `standings(players, results)`: valores e ordem da rodada entre as rodadas, da partida na última; atrasados por último.
**Where**: `packages/tv/src/model/standings.ts` (modify)
**Depends on**: T21
**Reuses**: `placesOf`
**Requirement**: RESULT-02

**Done when**:

- [x] C60-C64
- [x] Limites exatos: 3 e 4 jogadores (cartões e lista)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): rank the result by the round or by the match`

---

### T23: Words and points label

**What**: `scoreLabel(words, points)`: "plvr"/"plvrs" e "pt"/"pts".
**Where**: `packages/tv/src/model/score-label.ts` (create)
**Depends on**: T22
**Reuses**: `STRINGS.pointsUnit`
**Requirement**: RESULT-02

**Done when**:

- [x] C65
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): write the words and points of a player`

---

### T24: Standings title

**What**: "Classificação da Rodada N" entre as rodadas e "Classificação da Partida" na última; sai "Após Rodada N" (AD-029).
**Where**: `packages/tv/src/model/result-header.ts` (modify)
**Depends on**: T23
**Reuses**: `resultHeader`
**Requirement**: RESULT-02

**Done when**:

- [x] C66
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): title the standings by the round or the match`

---

### T25: Words and points on cards and lines

**What**: `PodiumCard` e `StandingLine` mostram "N plvrs · P pts".
**Where**: `packages/tv/src/components/PodiumCard.tsx` (modify)
**Depends on**: T24
**Reuses**: `scoreLabel`
**Requirement**: RESULT-02

**Done when**:

- [x] C67
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): show words and points on every card and line`

---

### T26: Result screen layout

**What**: Cartão da maior palavra acima do tabuleiro, cartão do código sem rótulo, título novo, lista do 4º em diante em duas colunas, como `.specs/features/m4-1-playtest/captures/tv-round-result.png`; números certos depois de recarregar.
**Where**: `packages/tv/src/screens/ResultScreen.tsx` (modify)
**Depends on**: T25
**Reuses**: `LongestWordCard`, `RoomCard`, `BoardGrid`
**Requirement**: RESULT-02

**Done when**:

- [x] C68-C72
- [x] `result.spec.ts` da TV verde, inclusive "fits the result with ten players and long nicknames at both ends of the screens"
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): lay out the result as the capture`

---

### T27: Result picture

**What**: `result.picture.ts` grava `.specs/features/m4-1-playtest/captures/tv-round-result.running.png` em 1920x1080 com `deviceScaleFactor: 2`, com os dados da capture; `pictures.ts` ganha a pasta da feature.
**Where**: `packages/tv/e2e/result.picture.ts` (modify)
**Depends on**: T26
**Reuses**: `pictureWindow`, `samples.ts`
**Requirement**: RESULT-02

**Done when**:

- [x] C73: foto em `captures/tv-round-result.running.png`, 3840x2160
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `test(tv): take the picture of the round result`

---

### T47: Words picture

**What**: `words.picture.ts` grava `.specs/features/m4-1-playtest/captures/tv-words.running.png` numa janela de 1920x1080 com `deviceScaleFactor: 2`, com os dados da capture (13 palavras, 10 jogadores, Caio desconectado) e a lista parada no meio, com o painel já ordenado.
**Where**: `packages/tv/e2e/words.picture.ts` (create)
**Depends on**: T27
**Reuses**: `pictureWindow`, `samples.ts`
**Requirement**: WORDCTL-01

**Done when**:

- [x] C123: foto em `captures/tv-words.running.png`, 3840x2160
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `test(tv): take the picture of the words`

---

### T28: TV match through the worker

**What**: A partida inteira da TV com 3 celulares toca "Ver resultado" pelo celular do anfitrião em cada rodada.
**Where**: `packages/tv/e2e/full-match.spec.ts` (modify)
**Depends on**: T47
**Reuses**: `packages/tv/e2e/phones.ts`
**Requirement**: SYNC-01

**Done when**:

- [x] C74
- [x] Build completo verde (fim da janela vermelha)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: build
**Commit**: `test(tv): play the whole match with the host showing each result`

---

### T29: Which music plays

**What**: `musicTrack(screen, phase, settings)`, a tabela de telas da TV para as faixas `lobby`, `match`, `jingle`, `finale` ou nenhuma, e `matchTempo(view, serverNow)`, 1,5 só nos 15 s finais da rodada, até o `endsAt`; em "Tempo!" e na lista volta a 1.
**Where**: `packages/tv/src/model/music.ts` (create)
**Depends on**: T28
**Reuses**: `Screen` de `model/screen.ts`, `DEFAULT_SETTINGS`
**Requirement**: MUSIC-01

**Done when**:

- [x] C75, C76, C77, C78, C79, C126, C127, C129
- [x] Um caso por linha da tabela de telas, inclusive `open-failed` com a música do lobby (L-007)
- [x] Limites em 15 000 e 15 001 ms antes do fim (L-001)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): decide which music plays on each screen`

---

### T30: Four songs as notes

**What**: `LOBBY_SONG`, `MATCH_SONG`, `JINGLE_SONG` (128 bpm, 16 compassos, 30 s) e `FINALE_SONG`, escritas pelo projeto a partir de uma partitura curta; `notesInWindow` com a volta do loop.
**Where**: `packages/tv/src/model/songs.ts` (create)
**Depends on**: T29
**Reuses**: `Note` de `@bwords/core`
**Requirement**: MUSIC-01

**Done when**:

- [x] C80, C132
- [x] Toda nota de cada música começa dentro do comprimento dela
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): write the four songs`

---

### T31: Music positions

**What**: `advanceMusic(clock, track, elapsedMs, tempo)`: a faixa atual anda `elapsedMs * tempo` na partitura; `lobby` e `match` continuam de onde pararam; `jingle` e `finale` recomeçam cada vez que viram a faixa; as posições andam mesmo com o som bloqueado.
**Where**: `packages/tv/src/model/music-clock.ts` (create)
**Depends on**: T30
**Reuses**: `MusicTrack` de `model/music.ts`
**Requirement**: MUSIC-01

**Done when**:

- [x] C81, C131
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): keep where each song is`

---

### T32: Music player

**What**: `createMusicPlayer(context)`: agenda as notas até 300 ms à frente, com início e duração divididos pelo tempo e a frequência intacta, num ganho por faixa a 50% de `effectsPeakGain(volume)`; troca de faixa com fade; nada agendado com o som bloqueado, e a partir da posição atual depois da liberação. `device/audio.ts` exporta `effectsPeakGain`, e `playNotes` do `core` ganha o `output` opcional, com teste no `core`.
**Where**: `packages/tv/src/device/music.ts` (create)
**Depends on**: T31
**Reuses**: `playNotes`, `notesInWindow`, `packages/tv/src/testing/fake-audio.ts`
**Requirement**: MUSIC-01

**Done when**:

- [x] C82, C83, C125
- [x] `playNotes` sem `output` toca no `context.destination`, como antes (C21 e C46 verdes)
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): play the music with web audio`

---

### T33: Music store

**What**: `state/music.ts` liga a tela, a sala, o relógio da música e o player a cada tique; `createTvStore` o cria, com a tela como `computed` do store (que `app.tsx` passa a ler) e um só `AudioContext` aberto em `main.tsx` para efeitos e música; `packages/tv/e2e/record-sounds.ts` grava as notas da música à parte (`window.music`), para os E2E de efeitos do M4 seguirem iguais.
**Where**: `packages/tv/src/state/music.ts` (create)
**Depends on**: T32
**Reuses**: `createSoundStore`, `tvScreen`, `musicTrack`, `matchTempo`, `advanceMusic`
**Requirement**: MUSIC-01

**Done when**:

- [x] C84
- [x] `packages/tv/e2e/audio.spec.ts` e `lobby.spec.ts` verdes, sem mudar nenhum teste
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: full
**Commit**: `feat(tv): play the music of each screen`

---

### T34: Music switch in the host lobby

**What**: Toggle "Música" no `SettingsPanel`, ligado numa sala nova, que manda `{ music }`; o celular continua sem música, só com o "check".
**Where**: `packages/phone/src/components/SettingsPanel.tsx` (modify)
**Depends on**: T33
**Reuses**: `Toggle`
**Requirement**: MUSIC-01

**Done when**:

- [x] C85, C130
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): add the music switch to the host lobby`

---

### T35: Music in the browser

**What**: E2E da TV: cada tela começa a música dela, "Reconectando…" mantém a música e nenhum arquivo de áudio é pedido.
**Where**: `packages/tv/e2e/music.spec.ts` (create)
**Depends on**: T34
**Reuses**: `packages/tv/e2e/record-sounds.ts`, `packages/tv/e2e/cuttable-room.ts`, `model/songs.ts`
**Requirement**: MUSIC-01

**Done when**:

- [x] C86, C87, C128
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: build
**Commit**: `test(tv): hear the music on every screen`

---

### T36: Keep-awake store

**What**: `keepsAwake(view)` e `createKeepAwake`: a Screen Wake Lock pedida enquanto a página está aberta e visível, de novo ao voltar a ficar visível, até a sala expirar; `device/wake-lock.ts` na TV, como o do celular.
**Where**: `packages/tv/src/state/awake.ts` (create)
**Depends on**: T35
**Reuses**: `packages/phone/src/device/wake-lock.ts`
**Requirement**: TVAWAKE-01

**Done when**:

- [x] C88-C90
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: unit
**Gate**: quick
**Commit**: `feat(tv): keep the screen awake while the room is open`

---

### T37: Hidden video

**What**: `AwakeVideo`: vídeo mudo de 2x2 px de um `canvas.captureStream` na cor do fundo, em loop, sem erro na tela se recusado.
**Where**: `packages/tv/src/components/AwakeVideo.tsx` (create)
**Depends on**: T36
**Reuses**: `--color-background`
**Requirement**: TVAWAKE-01

**Done when**:

- [x] C91-C93
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(tv): play a hidden video to keep the screen on`

---

### T38: Routes

**What**: `clientAsset`: `/`, `/tv` e `/tv/` dão a TV; `/join` e `/<CÓDIGO>` dão o celular; o pacote de idioma continua 404.
**Where**: `packages/server/src/client-routes.ts` (modify)
**Depends on**: T37
**Reuses**: `isRoomCode`
**Requirement**: ROUTE-01

**Done when**:

- [x] C94-C98
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: integration
**Gate**: full
**Commit**: `feat(server): open the tv at the root and the code entry at /join`

---

### T39: Lobby texts

**What**: "ou acesse <host>/<CÓDIGO>" e "Quem entrar primeiro vira anfitrião(ã)".
**Where**: `packages/tv/src/strings/pt-BR.ts` (modify)
**Depends on**: T38
**Reuses**: `JoinCard`
**Requirement**: ROUTE-01, M4FIX-01

**Done when**:

- [x] C99, C100
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: build
**Commit**: `feat(tv): show the room address with the code`

---

### T40: No zoom on the phone

**What**: Meta viewport, `touch-action: manipulation`, `preventZoom` para `gesture*` e `touchmove` de dois dedos, campos de 16 px ou mais.
**Where**: `packages/phone/src/device/no-zoom.ts` (create)
**Depends on**: T39
**Reuses**: `packages/phone/src/styles/styles.test.ts`
**Requirement**: NOZOOM-01

**Done when**:

- [x] C101-C104
- [x] "does not scroll or zoom while swiping" continua verde
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `feat(phone): keep the zoom at one`

---

### T41: Banner below the code card

**What**: Na rodada, a faixa "Reconectando…" fica abaixo do cartão do código.
**Where**: `packages/tv/src/styles/connection-banner.css` (modify)
**Depends on**: T40
**Reuses**: `ConnectionBanner`
**Requirement**: M4FIX-01

**Done when**:

- [x] C105
- [x] Gate check passes
- [x] Test count: anterior + novos, nenhum removido sem o critério que o substitui

**Tests**: e2e
**Gate**: full
**Commit**: `fix(tv): keep the code card clear of the reconnecting banner`

---

### T42: Phone E2E with 4 workers

**What**: `workers: 4` no config de E2E do celular, com o motivo.
**Where**: `packages/phone/playwright.config.ts` (modify)
**Depends on**: T41
**Reuses**: `packages/tv/playwright.config.ts`
**Requirement**: M4FIX-01

**Done when**:

- [x] C106
- [x] Gate check passes

**Tests**: none
**Gate**: build
**Commit**: `test(phone): run the e2e with four workers`

---

### T43: Debug page follows the words

**What**: `tools/debug` mostra a fase `words` e ganha ▲, ▼ e "Ver resultado".
**Where**: `tools/debug/src/main.tsx` (modify)
**Depends on**: T42
**Reuses**: `send`
**Requirement**: WORDCTL-01

**Done when**:

- [x] `npm run debug` joga uma rodada até o resultado
- [x] Gate check passes

**Tests**: none
**Gate**: build
**Commit**: `feat(debug): drive the words stage`

---

### T44: Update project docs

**What**: `docs/DESIGN.md` cita `wrangler.jsonc` e segue AD-024 a AD-029 (lista conduzida, rotas, resultado sincronizado, música); `docs/screens.md` ganha "Olhe para a TV" e o resultado novo.
**Where**: `docs/DESIGN.md` (modify)
**Depends on**: T43
**Reuses**: -
**Requirement**: M4FIX-01

**Done when**:

- [x] C107
- [x] Gate check passes

**Tests**: none
**Gate**: build
**Commit**: `docs: record the playtest decisions`

---

## Checks

Os testes Vitest ficam ao lado do módulo; os E2E em `packages/<pacote>/e2e/*.spec.ts`.

**C1** - Um jogador conta como palavras as únicas dele e as em comum que achou: `roundWords` é o tamanho do que ele achou na rodada (RESULT-02, AC 5)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "counts the unique words and the shared ones each player found"`

**C2** - `PlayerInfo.words` e `PlayerResult.words` somam as palavras da partida a cada rodada e voltam a 0 numa partida nova e no lobby (RESULT-02, AC 3)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "adds up the words of the match after each round"`

**C3** - No fim da rodada a sala vai para `words`: só a TV recebe `round-results`, e todos recebem `phase` com `words` (SYNC-01, AC 1; WORDCTL-01, AC 9)
Proof: `npx vitest run packages/core/src/room/results.test.ts -t "ends the round on the words with the results only to the tv"`

**C4** - Uma sala nova começa com `music` ligada (MUSIC-01, AC 14)
Proof: `npx vitest run packages/core/src/room/state.test.ts -t "starts a new room with the music on"`

**C5** - Uma sala guardada sem `music` carrega com a música ligada (MUSIC-01, AC 14)
Proof: `npx vitest run packages/core/src/room/settings.test.ts -t "turns the music on in a room stored without it"`

**C6** - Uma mudança de `music` no lobby vale para a partida seguinte, e fora do lobby recebe `wrong-phase` (Edge Cases)
Proof: `npx vitest run packages/core/src/room/settings.test.ts -t "changes the music only in the lobby"`

**C7** - `scroll` com `up` ou `down` e `show-result` passam no parse; outra direção, campo a mais ou faltando dão `bad-message` (WORDCTL-01, AC 5, 6, 8)
Proof: `npx vitest run packages/core/src/room/protocol.test.ts -t "parses the host list commands and refuses any other direction"`

**C8** - `scroll` e `show-result` de quem não é o anfitrião recebem `not-host`, e de um convidado ou da TV, `bad-message` (WORDCTL-01, AC 10)
Proof: `npx vitest run packages/core/src/room/reveal.test.ts -t "refuses scroll and show-result from anyone but the host"`

**C9** - O `scroll` do anfitrião chega só à TV, com a mesma direção, e sem TV não vai a ninguém (WORDCTL-01, AC 5, 6)
Proof: `npx vitest run packages/core/src/room/reveal.test.ts -t "relays the host scroll to the tv only"`

**C10** - `show-result` numa rodada do meio leva a `results`: celulares e convidados recebem `round-results`, e todos `phase` com `results` (WORDCTL-01, AC 8; SYNC-01, AC 2)
Proof: `npx vitest run packages/core/src/room/reveal.test.ts -t "opens the results in the middle of the match on show-result"`

**C11** - `show-result` na última rodada leva a `podium`: celulares e convidados recebem `round-results` e todos `podium` (SYNC-01, AC 3)
Proof: `npx vitest run packages/core/src/room/reveal.test.ts -t "opens the podium after the last round on show-result"`

**C12** - Um segundo `show-result` recebe `wrong-phase` e não pula o resultado (Edge Cases)
Proof: `npx vitest run packages/core/src/room/reveal.test.ts -t "refuses a second show-result"`

**C13** - `back-to-lobby` durante `words` leva todos ao lobby (Edge Cases)
Proof: `npx vitest run packages/core/src/room/reveal.test.ts -t "goes back to the lobby from the words"`

**C14** - Quem entra durante `words` é espectador, e a próxima rodada já está preparada em `words` (SYNC-01, AC 2; design: sala em `words`)
Proof: `npx vitest run packages/core/src/room/reveal.test.ts -t "keeps the next round ready and makes a newcomer a spectator on the words"`

**C15** - A TV que conecta em `words` recebe `welcome` e `round-results` da rodada (WORDCTL-01, AC 11)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends the tv that connects on the words the results of the round"`

**C16** - Um celular que conecta depois de "Ver resultado" recebe o resultado e, depois da última rodada, o pódio (SYNC-01, AC 6)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends a phone that connects after show-result the results and the podium"`

**C17** - Em `words`, nenhuma mensagem que um celular ou um convidado recebe traz uma palavra da rodada, inclusive o `welcome` de quem conecta ou reconecta (SYNC-01, AC 4; L-008)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends no word of the round to a phone or a guest on the words"`

**C18** - Um celular que conecta em `words` recebe só o `welcome` com a fase `words` (SYNC-01, AC 5)
Proof: `npx vitest run packages/core/src/room/machine.test.ts -t "sends a phone that connects on the words only the welcome"`

**C19** - No Durable Object, nenhum celular recebe palavra da rodada antes do `show-result`, nem reconectando durante a lista (SYNC-01, AC 4; L-008)
Proof: `npx vitest run packages/server/test/match.test.ts -t "never sends round words to phones before the results"`

**C20** - Uma partida de 2 rodadas com TV e 3 celulares passa por "Ver resultado" em cada rodada, com `roundWords` e `words` certos (WORDCTL-01, AC 8; RESULT-02, AC 2, 3)
Proof: `npx vitest run packages/server/test/match.test.ts -t "plays a 2-round match with a TV and 3 phones"`

**C21** - `playNotes` toca `CHECK_SOUND` como notas curtas que sobem, no ganho pedido, com fade (WORDCTL-01, AC 15; FEEDBACK-02, AC 2)
Proof: `npx vitest run packages/core/src/client/synth.test.ts -t "plays the check as short rising notes"`

**C22** - Um socket que abre e cai antes do `welcome` não deixa prazo que derrube a conexão seguinte depois do `welcome` (M4FIX-01, AC 1)
Proof: `npx vitest run packages/core/src/client/room-connection.test.ts -t "keeps one offline deadline when a socket drops before the welcome"`

**C23** - Na fase `words`, jogador, espectador e anfitrião veem `look-at-tv`, e `round-results` sozinho não muda a tela (SYNC-01, AC 1)
Proof: `npx vitest run packages/phone/src/model/screen.test.ts -t "shows look at the tv on the words to players, spectators and the host"`

**C24** - ▲, ▼ e "Ver resultado" mandam `scroll` com `up`, `scroll` com `down` e `show-result` (WORDCTL-01, AC 5, 6, 8)
Proof: `npx vitest run packages/phone/src/state/room.test.ts -t "sends scroll and show-result for the host buttons"`

**C25** - Durante "Tempo!" e a lista, todo celular mostra "Olhe para a TV" e "As palavras da rodada estão passando lá" (SYNC-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "tells every phone to look at the tv during the words"`

**C26** - Durante "Tempo!" e a lista, o anfitrião vê ▲, ▼ e "VER RESULTADO", com alvos de 48 px ou mais, e os outros não (WORDCTL-01, AC 4)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "shows the host the list controls during the words"`

**C27** - Quando o anfitrião passa a vez durante a lista, o novo anfitrião passa a ver ▲, ▼ e "VER RESULTADO" (WORDCTL-01, AC 12)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "gives the list controls to the new host"`

**C28** - Um celular que reconecta durante a lista mostra "Olhe para a TV" (SYNC-01, AC 5)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/look-at-tv.spec.ts -g "shows look at the tv after reconnecting on the words"`

**C29** - Numa rodada do meio, o resultado abre nos celulares quando o anfitrião toca "Ver resultado" (SYNC-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/results.spec.ts -g "opens the round result when the host shows it"`

**C30** - Na última rodada, o pódio abre nos celulares quando o anfitrião toca "Ver resultado", com o resumo somando a rodada (SYNC-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "opens the podium when the host shows the last result"`

**C31** - Ao fim da última rodada, os celulares ficam em "Olhe para a TV" e não mostram o pódio antes de "Ver resultado" (SYNC-01, AC 4)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/podium.spec.ts -g "keeps the podium for after the host shows the last result"`

**C32** - Um celular que reconecta depois de "Ver resultado" mostra o resultado ou o pódio (SYNC-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/reconnect.spec.ts -g "shows the result or the podium after reconnecting once it was shown"`

**C33** - Uma partida de 2 rodadas com 3 celulares reais passa por "Ver resultado" até "JOGAR DE NOVO" (SYNC-01, AC 2, 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/full-match.spec.ts -g "plays a two-round match with three phones until play again"`

**C34** - "ENTRAR EM OUTRA SALA" leva a `/join`, com a entrada por código (ROUTE-01, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/exit.spec.ts -g "enter another room opens the code screen at /join"`

**C35** - `/join` abre a entrada por código do celular (ROUTE-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/entry.spec.ts -g "shows the code screen at /join"`

**C36** - Sem preferência guardada, "Vibrar" e "Som ao acertar" começam ligados (FEEDBACK-02, AC 1)
Proof: `npx vitest run packages/phone/src/state/prefs.test.ts -t "starts with vibrate and sound on without saved preferences"`

**C37** - A preferência mudada numa sala vale ao entrar em outra sala no mesmo navegador (FEEDBACK-02, AC 4)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/prefs.spec.ts -g "keeps the preferences of another room"`

**C38** - Com "Vibrar" ligado, uma palavra válida vibra 50 ms (FEEDBACK-02, AC 3)
Proof: `npx vitest run packages/phone/src/state/round.test.ts -t "vibrates 50 ms on a valid word when the preference is on"`

**C39** - O som de acerto do celular toca as notas de `CHECK_SOUND`, as mesmas da lista da TV (FEEDBACK-02, AC 2)
Proof: `npx vitest run packages/phone/src/device/hit-sound.test.ts -t "plays the check of the tv words list"`

**C40** - A palavra acima do tabuleiro fica verde em "VÁLIDA", amarela em "JÁ ENCONTRADA" e vermelha em "INVÁLIDA" (FEEDBACK-02, AC 5)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "colors each verdict and shakes an invalid word"`

**C41** - As peças do caminho ficam na cor da palavra enquanto o feedback aparece e voltam ao normal depois de 500 ms (FEEDBACK-02, AC 6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "paints the path tiles with the color of the feedback while it shows"`

**C42** - Em `words`, a TV fica em "Tempo!" e na lista por mais tempo que qualquer rolagem e só vai ao resultado com a fase `results` ou `podium` (WORDCTL-01, AC 9)
Proof: `npx vitest run packages/tv/src/state/reveal.test.ts -t "never opens the result while the room is on the words"`

**C43** - Um passo de ▲ ou ▼ que passaria do começo ou do fim para no topo ou com a última palavra inteira na tela (WORDCTL-01, AC 7)
Proof: `npx vitest run packages/tv/src/model/word-scroll.test.ts -t "stops a step at the top and with the last word whole"`

**C44** - Com a lista andando, a palavra destacada é a que está na linha de leitura do terço de cima do painel (WORDCTL-01, AC 13)
Proof: `npx vitest run packages/tv/src/model/word-scroll.test.ts -t "highlights the word on the reading line while the list moves"`

**C45** - Numa lista que cabe, o destaque desce uma palavra por segundo, na ordem, e para na última; com 999 ms ainda é a primeira (WORDCTL-01, AC 14)
Proof: `npx vitest run packages/tv/src/model/word-scroll.test.ts -t "highlights a list that fits one word a second and stops on the last"`

**C46** - O `check` da TV toca `CHECK_SOUND` no volume da sala e fica mudo com a sala muda (WORDCTL-01, AC 15)
Proof: `npx vitest run packages/tv/src/device/audio.test.ts -t "plays the check of the shared recipe at the room volume"`

**C47** - Cada palavra que passa a ficar destacada toca um `check`, uma vez (WORDCTL-01, AC 15)
Proof: `npx vitest run packages/tv/src/state/word-scroll.test.ts -t "plays a check each time a word becomes highlighted"`

**C48** - Depois do primeiro ▲ ou ▼, a lista fica sem destaque e sem `check` até o fim (WORDCTL-01, AC 16)
Proof: `npx vitest run packages/tv/src/state/word-scroll.test.ts -t "drops the highlight and the check after the host's first step"`

**C49** - Uma rodada nova ou a saída de `words` volta a lista ao modo automático (WORDCTL-01, AC 11)
Proof: `npx vitest run packages/tv/src/state/word-scroll.test.ts -t "starts every list in the automatic mode"`

**C50** - Medida na tela, a lista sobe a altura de uma linha por segundo (WORDCTL-01, AC 1)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "scrolls one line a second"`

**C51** - Uma lista que cabe no painel não se move (WORDCTL-01, AC 2)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "does not move a list that fits"`

**C52** - A lista para com a última palavra inteira na tela e a TV continua na tela de palavras (WORDCTL-01, AC 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "stops with the last word whole and stays on the words"`

**C53** - ▼ do anfitrião para a rolagem automática e desce a lista meia altura do painel (WORDCTL-01, AC 5)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "moves half a panel down at the host down and stops the automatic scroll"`

**C54** - ▲ do anfitrião para a rolagem automática e sobe a lista meia altura do painel (WORDCTL-01, AC 6)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "moves half a panel up at the host up"`

**C55** - Com `phase` em `results`, a TV troca a lista pelo resultado da rodada (WORDCTL-01, AC 8)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "shows the result when the host shows it"`

**C56** - Recarregada durante a lista, a TV volta à lista, do topo, com a rolagem automática (WORDCTL-01, AC 11)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "restarts the list from the top with the automatic scroll after a reload"`

**C57** - O destaque muda só cor e escala: nenhuma outra linha muda de posição (WORDCTL-01, AC 17)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "highlights with color and scale only, without moving the other words"`

**C58** - Com o anfitrião desconectado, a lista anda até o fim e espera (Edge Cases)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "scrolls to the end and waits while the host is away"`

**C59** - Sem palavras, a TV mostra "Nenhuma palavra encontrada" e espera "Ver resultado" (Edge Cases)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "says when no word was found and waits for the host"`

**C60** - Entre as rodadas, cada linha traz as palavras e os pontos da rodada (RESULT-02, AC 2)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "shows the round words and points between rounds"`

**C61** - No resultado da última rodada, cada linha traz a soma das palavras e dos pontos da partida (RESULT-02, AC 3)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "shows the match sums after the last round"`

**C62** - Entre as rodadas, ordem e posições seguem os pontos da rodada, com empate na ordem de entrada (RESULT-02, AC 6)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "orders and places by the round points between rounds"`

**C63** - Na última rodada, ordem e posições seguem a soma da partida (RESULT-02, AC 7)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "orders and places by the match after the last round"`

**C64** - Quem entrou atrasado vai por último, com 0 e 0 na rodada e a própria soma no resultado da última rodada (RESULT-02, AC 10)
Proof: `npx vitest run packages/tv/src/model/standings.test.ts -t "puts a late joiner last with 0 in the round and their sum after the last round"`

**C65** - "1 plvr" e "1 pt" no singular; "0 plvrs", "0 pts", "2 plvrs" e "2 pts" nos outros casos (RESULT-02, AC 4)
Proof: `npx vitest run packages/tv/src/model/score-label.test.ts -t "writes plvr and pt in the singular and plvrs and pts otherwise, 0 included"`

**C66** - O título é "Classificação da Rodada N" entre as rodadas e "Classificação da Partida" na última, sem "Após Rodada N" (RESULT-02, AC 6, 7)
Proof: `npx vitest run packages/tv/src/model/result-header.test.ts -t "titles the standings by the round between rounds and by the match after the last"`

**C67** - Cada cartão e cada linha mostra "N plvrs · P pts" (RESULT-02, AC 2)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows words and points on every card and line"`

**C68** - O cartão da maior palavra fica acima do tabuleiro (RESULT-02, AC 8)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows the longest word card above the board"`

**C69** - O cartão do código mostra só o código e o QR, sem "CÓDIGO DA SALA" (RESULT-02, AC 9)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "shows only the code and the qr on the code card"`

**C70** - O resultado ordena pela rodada com "Classificação da Rodada N" numa rodada do meio, na tela (RESULT-02, AC 6)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "ranks by the round between rounds"`

**C71** - O resultado ordena pela partida com "Classificação da Partida" na última rodada, na tela (RESULT-02, AC 7)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "ranks by the match after the last round"`

**C72** - Recarregada no resultado, a TV mostra as mesmas palavras e pontos (RESULT-02, AC 2, 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/result.spec.ts -g "keeps the words and points after a reload"`

**C73** - O resultado entre as rodadas, aberto por "Ver resultado", como em `captures/tv-round-result.png`, com as diferenças de `## Differences from the source` (RESULT-02, AC 1)
Proof: browser captures/tv-round-result.running.png

**C74** - Uma partida de 2 rodadas com a TV e 3 celulares vai de `/tv` a "JOGAR DE NOVO" pelo Worker, com "Ver resultado" em cada rodada (WORDCTL-01, AC 8; SYNC-01, AC 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/full-match.spec.ts -g "plays a whole match through the worker"`

**C75** - No lobby, em "abrindo a sala" e em "sala expirada", a faixa é a música do lobby (MUSIC-01, AC 1)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "plays the lobby music on the lobby, the opening and the expired room"`

**C76** - Na contagem, na rodada, em "Tempo!" e na lista de palavras, a faixa é a música da partida (MUSIC-01, AC 2)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "plays the match music on the countdown, the round, the time up and the words"`

**C77** - Com 15 000 ms para o fim da rodada a música da partida fica 1,5x mais rápida até o `endsAt`, e em "Tempo!" e na lista volta à velocidade normal; com 15 001 ms ainda está na velocidade normal (MUSIC-01, AC 3)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "speeds the match music up 1.5 times from 15 seconds before the end"`

**C78** - Na contagem da rodada seguinte, a música da partida volta à velocidade normal (MUSIC-01, AC 4)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "brings the match music back to its tempo on the next countdown"`

**C79** - No resultado de uma rodada que não é a última, a faixa é a vinheta (MUSIC-01, AC 6)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "plays the jingle on the result between rounds"`

**C80** - A vinheta recomeça aos 30 s: uma nota em 29,9 s é do fim, e a de 30 s é a primeira (MUSIC-01, AC 12)
Proof: `npx vitest run packages/tv/src/model/songs.test.ts -t "loops the jingle every 30 seconds"`

**C81** - Depois de um resultado, a música da partida continua da posição em que parou, inclusive o trecho andado no tempo rápido (MUSIC-01, AC 5)
Proof: `npx vitest run packages/tv/src/model/music-clock.test.ts -t "resumes the match music where it stopped after a result"`

**C82** - Cada faixa toca com metade do ganho de pico dos efeitos no mesmo volume da sala, e nada com a sala muda (MUSIC-01, AC 10)
Proof: `npx vitest run packages/tv/src/device/music.test.ts -t "plays every track at half the gain of the effects"`

**C83** - Com o som bloqueado nada é agendado; na liberação, a música começa da posição em que estaria (MUSIC-01, AC 15)
Proof: `npx vitest run packages/tv/src/device/music.test.ts -t "starts after the unlock at the point the music would be"`

**C84** - Com `music` desligada nenhuma faixa toca, e o apito, os bipes e o `check` continuam tocando (MUSIC-01, AC 13)
Proof: `npx vitest run packages/tv/src/state/music.test.ts -t "silences every track and leaves the other sounds playing with the music off"`

**C85** - No lobby do anfitrião, "Música" começa ligada numa sala nova e o toque manda `music: false` (MUSIC-01, AC 13, 14)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/host-lobby.spec.ts -g "switches the music in the host lobby"`

**C86** - A TV não pede nenhum arquivo de áudio em nenhuma tela (MUSIC-01, AC 11)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/music.spec.ts -g "loads no audio file"`

**C87** - No navegador, cada tela começa pelas primeiras notas da sua música: a do lobby em "abrindo a sala", a da partida na primeira contagem, a vinheta no resultado entre as rodadas e a da partida finalizada no pódio (MUSIC-01, AC 1, 2, 6, 7)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/music.spec.ts -g "plays the music of each screen in the browser"`

**C125** - A 1,5x, as notas da música da partida têm as mesmas frequências, com início e duração divididos por 1,5 (MUSIC-01, AC 3)
Proof: `npx vitest run packages/tv/src/device/music.test.ts -t "keeps the pitch and shortens the steps at 1.5 times the tempo"`

**C126** - No resultado da última rodada, a faixa é a música de partida finalizada (MUSIC-01, AC 7)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "plays the finale on the result of the last round"`

**C127** - Em "A TV foi aberta em outra aba" não há faixa (MUSIC-01, AC 8)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "plays nothing on the replaced tab"`

**C128** - Com a faixa "Reconectando…", a TV continua a música da tela, sem recomeçá-la (MUSIC-01, AC 9)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/music.spec.ts -g "keeps the music of the screen while reconnecting"`

**C129** - Com `music` desligada, nenhuma tela da TV tem faixa (MUSIC-01, AC 13)
Proof: `npx vitest run packages/tv/src/model/music.test.ts -t "plays no track on any screen with the music off"`

**C130** - O celular toca só as notas do `check`, do lobby ao resultado, com `music` ligada na sala (MUSIC-01, AC 16)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "plays only the check on the phone with the music on"`

**C131** - A vinheta e a música de partida finalizada começam do zero a cada resultado, e a do lobby continua de onde parou (MUSIC-01, AC 1, 6, 7)
Proof: `npx vitest run packages/tv/src/model/music-clock.test.ts -t "starts the jingle and the finale from the top on each result"`

**C132** - Nas quatro músicas, uma janela que cruza o fim traz as notas do começo (MUSIC-01, AC 6, 7, 11)
Proof: `npx vitest run packages/tv/src/model/songs.test.ts -t "wraps a window across the end of each song to its start"`

**C88** - Com a página aberta e visível, a TV mantém uma Screen Wake Lock pedida, em qualquer fase (TVAWAKE-01, AC 1)
Proof: `npx vitest run packages/tv/src/state/awake.test.ts -t "holds a screen wake lock while the page is open and visible"`

**C89** - Quando a página volta a ficar visível, a TV pede a Screen Wake Lock de novo (TVAWAKE-01, AC 2)
Proof: `npx vitest run packages/tv/src/state/awake.test.ts -t "asks for the wake lock again when the page comes back"`

**C90** - Recusada a Screen Wake Lock, ou sem a API, o store segue sem lançar erro (TVAWAKE-01, AC 4)
Proof: `npx vitest run packages/tv/src/state/awake.test.ts -t "goes on when the browser refuses the wake lock"`

**C91** - A TV toca em loop um vídeo mudo de 2x2 px, fora da vista dos jogadores (TVAWAKE-01, AC 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/awake.spec.ts -g "plays a muted looping video out of sight"`

**C92** - Sem Screen Wake Lock e com o vídeo recusado, a TV mostra o lobby e segue o jogo sem aviso de erro (TVAWAKE-01, AC 4)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/awake.spec.ts -g "shows no error when the browser refuses the wake lock and the video"`

**C93** - A tela com o vídeo é igual, pixel a pixel, à tela sem ele (TVAWAKE-01, AC 5)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/awake.spec.ts -g "keeps every pixel of the screen the same with the video"`

**C94** - `GET /` responde com a TV (ROUTE-01, AC 1)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "serves the tv at the root"`

**C95** - `GET /tv` e `GET /tv/` respondem com a TV (ROUTE-01, AC 2)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "serves the tv at /tv"`

**C96** - `GET /join` responde com o celular (ROUTE-01, AC 3)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "serves the phone code entry at /join"`

**C97** - `GET /KBXT` e `GET /kbxt` respondem com o celular (ROUTE-01, AC 4)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "serves the phone at a room code"`

**C98** - Os arquivos do pacote de idioma continuam 404 (ROUTE-01, AC 7)
Proof: `npx vitest run packages/server/e2e/assets.test.ts -t "never serves the language pack"`

**C99** - O lobby da TV diz "ou acesse <host>/<CÓDIGO>" (ROUTE-01, AC 5)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the code and the real address"`

**C100** - O lobby vazio diz "Quem entrar primeiro vira anfitrião(ã)" (M4FIX-01, AC 3)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/lobby.spec.ts -g "shows the empty lobby"`

**C101** - Dois toques rápidos em qualquer ponto de cada tela mantêm `visualViewport.scale` em 1 (NOZOOM-01, AC 1)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/zoom.spec.ts -g "keeps the zoom at one after a double tap anywhere"`

**C102** - A pinça mantém `visualViewport.scale` em 1, e um dedo deslizando no tabuleiro continua formando palavras (NOZOOM-01, AC 2)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/zoom.spec.ts -g "keeps the zoom at one after a pinch"`

**C103** - Um toque duplo em "+" de rodadas sobe duas rodadas (NOZOOM-01, AC 3)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/zoom.spec.ts -g "counts each tap of a double tap"`

**C104** - Todo campo de texto do celular tem fonte de 16 px ou mais, para o Safari não dar zoom ao focar (NOZOOM-01, AC 1)
Proof: `npx vitest run packages/phone/src/styles/styles.test.ts -t "keeps every text field at 16 px or more"`

**C105** - Com a faixa "Reconectando…" na rodada, o cartão do código fica inteiro à vista (M4FIX-01, AC 2)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/connection.spec.ts -g "keeps the code card whole under the reconnecting banner"`

**C106** - O config de E2E do celular usa 4 workers (M4FIX-01, AC 4)
Proof: `node -e "const t=require('fs').readFileSync('packages/phone/playwright.config.ts','utf8');process.exit(/workers:\s*4,/.test(t)?0:1)"`

**C107** - `docs/DESIGN.md` cita `wrangler.jsonc` e não `wrangler.toml` (M4FIX-01, AC 5)
Proof: `node -e "const t=require('fs').readFileSync('docs/DESIGN.md','utf8');process.exit(t.includes('wrangler.jsonc')&&!t.includes('wrangler.toml')?0:1)"`

**C111** - Uma sala guardada com jogadores sem `words` volta com 0 palavras para eles (RESULT-02; Edge Cases)
Proof: `npx vitest run packages/server/test/persistence.test.ts -t "counts 0 words for players stored without them"`

**C112** - A coluna da lista traz os jogadores da rodada na ordem de entrada, com as palavras da rodada completas e os pontos em 0 ao abrir (WORDCTL-01, AC 18-19)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "starts every player of the round at 0 points with all their words"`

**C113** - A cada palavra destacada, os pontos dela somam a quem a achou, e só esses jogadores são marcados para animar (WORDCTL-01, AC 20-21)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "adds the highlighted word to whoever found it"`

**C114** - No controle manual, a coluna mostra os pontos completos da rodada (WORDCTL-01, AC 22)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "shows the full round points under manual control"`

**C115** - Com o destaque na última palavra, os pontos de cada jogador são os do resultado da rodada (WORDCTL-01, AC 23)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "ends at the round points of the result"`

**C116** - Na TV, a linha de quem pontuou anima no "check", e o painel fica à direita da lista (WORDCTL-01, AC 18, 21)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "animates the players who scored with the check"`

**C117** - O painel se ordena pelos pontos, do maior para o menor, e no empate pela ordem de entrada (WORDCTL-01, AC 24)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "orders the players by points, ties by joining order"`

**C118** - A cada reordenação, o card que muda de posição desliza inteiro só com transform (WORDCTL-01, AC 25)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "slides the whole card to its new place"`

**C119** - O painel e cada card mantêm o tamanho durante a reordenação (WORDCTL-01, AC 26)
Proof: `npx playwright test -c packages/tv/playwright.config.ts packages/tv/e2e/words.spec.ts -g "keeps the panel and the cards the same size while they reorder"`

**C120** - O desconectado mostra "DESCONECTADO" e card esmaecido, e quem entrou atrasado fica fora (WORDCTL-01, AC 27-28)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "tags the disconnected and leaves out who did not play"`

**C121** - O card do 1º tem o fundo mais claro, e os pontos do 1º e do 2º ficam na cor de cada um (WORDCTL-01, AC 29)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "marks the first two places"`

**C122** - "14 palavras", "1 palavra", "20 pts" e "1 pt" no painel (WORDCTL-01, AC 18)
Proof: `npx vitest run packages/tv/src/model/words-players.test.ts -t "writes words and points in full, singular at one"`

**C123** - A lista de palavras abre como em `captures/tv-words.png` (WORDCTL-01, AC 30)
Proof: browser captures/tv-words.running.png

**C124** - No feedback "VÁLIDA", a palavra acima do tabuleiro e as peças do caminho ficam na cor de `--color-valid`, e no deslizar continuam na cor do jogador (FEEDBACK-02, AC 5-6)
Proof: `npx playwright test -c packages/phone/playwright.config.ts packages/phone/e2e/board.spec.ts -g "paints a valid word and its path green"`

**C108** - Na TV LG da sala, com a página aberta e sem tocar no controle, a TV não entra em descanso numa partida de 3 rodadas de 3 min (TVAWAKE-01, AC 1-5; Goals)
Proof: walk - caminhada do user na TV real, depois do deploy que ele pedir; resultado em `**Walked:**`

**C109** - Num iPhone real, toques rápidos nos botões do lobby do anfitrião e a pinça em todas as telas não dão zoom (NOZOOM-01, AC 1-3; Goals)
Proof: walk - caminhada do user no Safari do iPhone; resultado em `**Walked:**`

**C110** - Na sala, a música do lobby se ouve no lobby; a da partida na contagem, na rodada e na lista, mais rápida e no mesmo tom nos 15 s finais e normal de novo na contagem seguinte, continuando de onde parou; a vinheta no resultado entre as rodadas; a da partida finalizada no pódio; a música fica abaixo dos efeitos e o "check" se ouve por cima dela na lista; o celular toca só o "check"; e "Música" desligada no lobby cala as quatro, com os efeitos tocando (MUSIC-01, AC 1-16; FEEDBACK-02, AC 2; Goals)
Proof: walk - caminhada do user na TV e num celular reais; resultado em `**Walked:**`

---

## Handoff

The feature's live state, written as it happens - a compaction gives no warning.

**Settled mid-build:** padrões da apresentação das tarefas aceitos com a aprovação: celulares recebem pontos e contagem de palavras, sem palavras, antes de "Ver resultado"; a música de fundo continua entre partidas e só recomeça ao recarregar a TV; sem chip "Música" no lobby da TV; peças de palavra curta demais voltam ao normal; user: "aprovo as tarefas"; none
**Dispatched:** batch worker fase 1 (T1-T8) a partir do commit seguinte a 3b2216b (push feito em 3b2216b a pedido do user) - returned (T1 7901080, T2 145010e, T3 6830435, T4 ed36908, T5 997f084, T6 d8e4646, T7 c2580cf, T8 d29292a; vitest 1042 e tsc verdes, conferidos pelo orquestrador em d29292a; phone e2e 78+1 e tv e2e 77+1 vermelhos só em `full-match.spec.ts`, dentro da janela; `match.test.ts` do servidor vermelho de T3 a T6, fora da janela prevista, verde desde T6; sala guardada antes da mudança não tem o campo `words` dos jogadores, sem default). MUSIC-01 emendado depois do batch 1: as tarefas da fase 6 precisam ser reescritas antes do batch 5. T45 (salas antigas, default do orquestrador) e T46 (jogadores ao lado da lista, AD-030) entraram depois da aprovação das tarefas; T46 ganhou a ordem por pontos e T47 (foto da lista) entrou na fase 5, com C117-C123; user: "1. Concordo. 2. Concordo, ajustado no stitch tabém 3. Concordo, ajustado no stitch também 4. Ajustado no Stitch 5. O card todo deve fazer a animação de troca de posições quando necessario. A lista deve maner um tamanho fixo para evitar comportamentos e ou glitchs indejados e os itens da lista se ordenam de acordo com os pontos"; user: "Aplique a recomendação mas adicione uma animação simples aos jogadores que receberam algum ponto no mesmo momento do check da palavra, a quantidade de palavras nessa pagina ja deve vir com valor da rodada completo, apenas os pontos vão somando."; batch worker fases 2 e 3 (T9-T13, T45, T14-T16) a partir do commit seguinte - returned (T9 35a9480, T10 c5ae3c8, T11 e365857, T12 31d924f, T13 f22c4b4, T45 fcd977e, T14 480b7a8, T15 dbaed09, T16 4869f53; vitest 1056 e tsc verdes, conferidos pelo orquestrador em 4869f53; phone e2e 88 verdes; tv e2e 77+1 vermelho só em `full-match.spec.ts`, dentro da janela). Achado do orquestrador: a palavra válida acima do tabuleiro e o caminho saem na cor do jogador, e FEEDBACK-02 AC 5-6 pede verde; T48 entra no começo do batch 3; batch worker do batch 3 (T48, T17-T21, T46) a partir do commit seguinte; user: "Seguir o batch 3" - returned (T48 c73d320, T17 7ed448f, T18 330a238, T19 1a43243, T20 4af5165, T21 77a3f13, T46 d3df96d; vitest 1095 e tsc verdes, conferidos pelo orquestrador em d3df96d; phone e2e 89 verdes; tv e2e 75 verdes e 13 vermelhos, 12 em `result.spec.ts` até T26 e `full-match.spec.ts` até T28, dentro da janela; C116 corrigido para "à direita", como no spec; painel com 34rem por causa de apelido de 12 letras com "DESCONECTADO" em 720p; destaque do 1º e cores do 1º e 2º só com mais de 0 pontos); batch worker do batch 4 (T22-T27, T47, T28) a partir do commit seguinte; user: "Seguir o batch 4" - returned (T22 ce2e544, T23 0dfbf47, T24 6b8947e, T25 6ca3227, T26 bfde915, T27 5915246, T47 a644269, T28 94819a4; vitest 1102, conferido pelo orquestrador em 94819a4; Build completo verde pelo worker: tv e2e 92, phone e2e 89, play e2e 10; janela de vermelhos da TV fechada; `board.spec.ts` "shows the feedback within 100 ms of release" falhou uma vez no Build serial (143 ms) e passou sozinho; as duas fotos conferidas pelo orquestrador contra as captures). Antes do batch 5: reescrever as tarefas da fase 6 pela emenda de MUSIC-01; sub-agente que reescreve o design e as tarefas da fase 6 pela emenda de MUSIC-01, a partir do commit seguinte; depois dele, o batch 5; user: "Reescrever e seguir" - returned (a838cbf: fase 6 replanejada, C75-C87 reescritos e C125-C132 novos; o orquestrador corrigiu a aceleração para valer só até o `endsAt`, como no AC 3); batch worker do batch 5 (T29-T35) a partir do commit seguinte - returned (T29 5275942, T30 f65ad3b, T31 9ca2cd8, T32 e8d102b, T33 0cc5df7, T34 bc15bb2, T35 67fd4ed; Build completo verde pelo worker: vitest 1144, play 10, phone 91, tv 95; `host-lobby.spec.ts` "has no fast mode control" passou a esperar dois interruptores, pelo MUSIC-01 AC 13; a foto do lobby do anfitrião no celular não foi refeita com a linha "Música"); batch worker do batch 6 (T36-T44) a partir do commit seguinte, numa sessão retomada; user: "volte de onde parou" - returned (T36 d57ddff, T37 ada140c, T38 f18582a, T39 fc0ca1a, T40 254163c, T41 a70225a, T42 044cc23, T43 97ef999, T44 65232ae; vitest 1160, play 10, phone 114, tv 99; Build verde no fim da fase 7; no fim da fase 8 `exit.spec.ts` "forgets the room and creates none when it expires" caiu uma vez com ERR_CONNECTION_REFUSED no Vite e passou sozinho; prova de zoom em Chromium limitada, iPhone fica na caminhada C109; comentário velho em `packages/phone/src/main.tsx` sobre `/`); comentário velho corrigido em 645b5d0; walker (implement.md passo 9) a partir do commit seguinte; user: "Seguir o fechamento" - walker returned (fd31734: todas as histórias ok, nenhum PROBLEMA); check_proofs em fd31734: 137 pass, só C73 e C123 à espera do julgamento das fotos; sub-agente de telas, round 1, a partir do commit seguinte, e o Verifier depois dele
**Walked:** walker a partir de 59c0cc1, contra a pilha real, sem tocar em código nem em testes, sem fotos novas. Como chegar: `npm run assets:build` (o pacote pt-BR já existia; senão `npm run dict:build` antes), `npm run dev -w @bwords/server` (wrangler dev em 8787); Chromium do Playwright com `--autoplay-policy=no-user-gesture-required`; TV em `http://localhost:8787/` num contexto de 1920x1080; celulares em contextos de 390x844 com `hasTouch` em `http://localhost:8787/<CÓDIGO>` ("Seu Apelido", ENTRAR; o 1º vira anfitrião); Duda entra por `/join` (digitar o código nas 4 caixas, CONTINUAR) num contexto `isMobile`. O som foi lido sem ouvir: um init script envolve `AudioNode.connect`, `createGain` e `createOscillator.start` do Web Audio real e anota frequência e horário de cada nota; nota cujo gain liga em outro gain é música, nota direto nos alto-falantes é efeito; a música foi reconhecida casando as notas com `TRACK_SONGS` de `songs.ts` a 1x e 1,5x; `navigator.vibrate` e `navigator.wakeLock.request` foram envolvidos do mesmo jeito. Palavras jogadas com gestos de mouse sobre o `group` "Tabuleiro", escolhidas com `boardSolutions`, `pickLongestWord` e `findPath` do core a partir do `round-start` que a TV recebe; sockets da TV e do Beto passam por `page.routeWebSocket` para poder cortar (fechar e recusar novas conexões, depois liberar). Partida: anfitrião toca 2x "Aumentar Rodadas" (3) e 3x "Diminuir Tempo da Rodada" (0:30); rodada 1 com 19 palavras (Ana 18, Beto 1 em comum, Caio 1), rodada 2 com Duda entrando atrasado e Caio fazendo mais pontos que Ana na rodada e menos na partida, rodada 3 sem palavras. Resultado por história. TV sempre ativa: ok no que o navegador mostra, o vídeo `awake-video` toca mudo, em loop, 2x2 px no canto, sem ficar por cima de nada; a TV pede a Screen Wake Lock ao abrir, o Chromium headless recusa (NotAllowedError, mesmo com a permissão dada pelo CDP) e a TV segue sem erro na tela nem no console. Lista conduzida pelo anfitrião: ok, rolagem automática que sobe uma linha a cada destaque (1029 px em cerca de 11 s na rodada 1), um destaque por vez e um "check" (880 Hz e 1318,5 Hz, efeito) a cada 1 s, 19 checks para 19 palavras; a lista para com a última palavra inteira e o destaque continua descendo até ela (cerca de 6 s depois), e a TV fica nas palavras sem ir sozinha ao resultado; recarregar a TV no meio volta ao topo (deslocamento 8, 18, 31 px), com pontos do zero e destaque automático; com a lista da rodada 2 rolando, ▼ desce 411 px (painel de 794 px), tira o destaque, para o "check" e salta os pontos para o total (Caio 6 para 42), mais ▼ param com a última palavra inteira e ▲ volta ao topo (0) e para ali; "Tempo!" e a lista mostram ▲, ▼ e VER RESULTADO só no celular da Ana; VER RESULTADO abre o resultado. Painel "Jogadores": ok, pontos somam a cada check e no fim batem com o resultado (Ana 45, Caio 2, Beto 1), "18 palavras" e "1 palavra" já com o total, ordem por pontos com o card do 1º mais claro e os pontos do 1º e 2º na cor, cards de 504x60 e painel de 544x836 sem mudar de tamanho, Duda (entrou atrasado) fora do painel, Beto cortado mostra "DESCONECTADO" e o card esmaecido e volta ao normal quando a conexão volta. Celulares sincronizados: ok, Beto, Caio e Duda veem "Olhe para a TV" e "As palavras da rodada estão passando lá" no "Tempo!" e na lista; Caio recarregado no meio da lista volta a "Olhe para a TV"; Beto recarregado depois de VER RESULTADO volta ao resultado; nas 3 rodadas os celulares mudam 40 a 60 ms depois do toque e a TV 110 a 120 ms depois, e o pódio só abre com o toque. Resultado: ok, "Classificação da Rodada 1" com Ana 18 plvrs · 45 pts, Caio 1 plvr · 2 pts, Beto 1 plvr · 1 pt; "Classificação da Rodada 2" com Caio 1º (16 plvrs · 42 pts), Ana e Beto 2º (1 plvr · 2 pts) e Duda 4º com 0 plvrs · 0 pts; no fim "Ana venceu!" e "Classificação da Partida" com as somas (Ana 19 plvrs · 47 pts, Caio 17 plvrs · 44 pts, Beto 2 plvrs · 3 pts, Duda 0 plvrs · 0 pts); o cartão da maior palavra fica acima do tabuleiro; o cartão do código do resultado só tem o código e o QR. Música: ok pelas notas, música do lobby no "abrindo a sala" e no lobby; "Música" ligada por padrão no lobby do anfitrião, desligada não toca nenhuma nota em 3 s e religada volta; música da partida na contagem, na rodada, no "Tempo!" e na lista, a 1,5x só de cerca de 15 s antes do fim de cada rodada até o fim, e a 1x de novo nas palavras e na contagem seguinte; vinheta no resultado entre as rodadas; música de partida finalizada no pódio; durante "Reconectando…" a música da partida segue no mesmo gain; gain da música 0,25 contra 0,5 do pico dos efeitos (50%); nenhum celular toca nota de música. Retorno da palavra: ok, num navegador limpo "Vibrar" e "Som ao acertar" começam ligados; VÁLIDA pinta as letras acima do tabuleiro e as peças do caminho de verde (`--color-valid`), JÁ ENCONTRADA de amarelo e INVÁLIDA de vermelho; cada VÁLIDA toca o mesmo "check" da TV e vibra 50 ms; Caio desligou "Som ao acertar", vibrou sem som, saiu da sala e entrou em outra pelo `/join` com o som ainda desligado e "Vibrar" ligado. Rotas: ok, `/`, `/tv`, `/join` e `/<CÓDIGO>` respondem 200 com a tela certa, `/pt-BR/dict.bin` e `/pt-BR/meta.json` 404, o lobby diz "ou acesse localhost:8787/<CÓDIGO>", e "ENTRAR EM OUTRA SALA" depois de "Ana encerrou a sala" leva a `/join`. Celular sem zoom: ok até onde o Chromium mostra, meta viewport com `maximum-scale=1, user-scalable=no`, `touch-action: manipulation` na raiz, dois toques rápidos em "Aumentar Rodadas" contam dois (1 para 3) e `visualViewport.scale` fica 1 depois de toque duplo e pinça (CDP `Input.synthesizePinchGesture`) em `/join`, no lobby do anfitrião e no espectador; numa página de controle sem bloqueio a pinça sintética também não deu zoom, então a prova não é conclusiva. Pendências do M4: ok, "Quem entrar primeiro vira anfitrião(ã)" no lobby vazio; a faixa "Reconectando…" (y 112 a 153) fica abaixo do cartão do código (y 34 a 110), sem cobrir nada dele, e some quando a conexão volta. Nenhum erro de console nem `pageerror` na TV e nos 4 celulares. Sem PROBLEMA e sem teste vermelho perdido. Observações sem critério: ao recarregar a TV na lista o DOM passa por `round-screen` com `time-up` por cerca de 100 a 200 ms antes de `words-screen`, como no M4, e a TV toca 2 notas da música do lobby no "abrindo a sala" antes de voltar à música da partida. Não caminhado: TV LG real (descanso em 3 rodadas de 3 min), zoom no iPhone real, ouvir a música e o "check", a vinheta inteira de 30 s em loop e a música da partida continuar do ponto em que parou (só os testes cobrem), a Wake Lock aceita e pedida de novo ao voltar a ficar visível (o headless recusa). O servidor e os navegadores foram fechados; as portas 8787, 9229, 5175 e 5176 ficaram livres.

---

## Phase Execution Map

```
Phase 1:  T1 --→ T2 --→ T3 --→ T4 --→ T5 --→ T6 --→ T7 --→ T8
Phase 2:  T9 --→ T10 --→ T11 --→ T12 --→ T13 --→ T45
Phase 3:  T14 --→ T15 --→ T16 --→ T48
Phase 4:  T17 --→ T18 --→ T19 --→ T20 --→ T21 --→ T46
Phase 5:  T22 --→ T23 --→ T24 --→ T25 --→ T26 --→ T27 --→ T47 --→ T28
Phase 6:  T29 --→ T30 --→ T31 --→ T32 --→ T33 --→ T34 --→ T35
Phase 7:  T36 --→ T37 --→ T38 --→ T39
Phase 8:  T40 --→ T41 --→ T42 --→ T43 --→ T44
```

Execução estritamente sequencial. Batches propostos, com fases inteiras: 1 (fase 1, 8 tarefas), 2 (fases 2 e 3, 8), 3 (fase 4, 5), 4 (fase 5, 7), 5 (fase 6, 7), 6 (fases 7 e 8, 9). O orquestrador para entre os batches para mostrar o resultado e perguntar antes de seguir.
