# M4.1 Playtest Design

**Spec**: `.specs/features/m4-1-playtest/spec.md`
**Status**: Draft

---

## Architecture Overview

A mudança central é que o servidor passa a ser dono da etapa depois do fim da rodada. No M4, a TV decidia sozinha, pelo relógio, quando sair da lista de palavras para o resultado, e os celulares iam direto para o resultado ou o pódio. Agora existe uma fase nova, `words`, entre `round` e `results`/`podium`. Só o toque do anfitrião em "Ver resultado" (`show-result`) tira a sala dela. Assim, TV e celulares mudam juntos, e quem conecta ou reconecta cai na tela certa pelo `welcome` (SYNC-01 AC 5-6).

A posição da lista continua só na TV (assumption "TV recarregada na lista"). O servidor não guarda posição nem destaque: ele só repassa à TV os toques de ▲ e ▼ do anfitrião, como códigos (`up`, `down`).

```mermaid
sequenceDiagram
  participant S as Servidor (core)
  participant T as TV
  participant H as Celular do anfitrião
  participant P as Outros celulares
  Note over S: alarm em endsAt + 300 ms: endRound
  S->>T: counts, round-results (com roundWords e words)
  S->>T: phase words
  S->>H: phase words
  S->>P: phase words
  Note over T: "Tempo!" 2 s, depois a lista rola e destaca 1 palavra/s
  Note over H,P: "Olhe para a TV"; o anfitrião vê ▲, ▼ e "Ver resultado"
  H->>S: scroll down
  S->>T: scroll down
  Note over T: modo manual: meia altura do painel, sem destaque
  H->>S: show-result
  alt rodada do meio
    S->>H: round-results
    S->>P: round-results
    S->>T: phase results
    S->>H: phase results
    S->>P: phase results
  else última rodada
    S->>H: round-results, podium
    S->>P: round-results, podium
    S->>T: podium
  end
  Note over T: resultado com a vinheta; os celulares abrem o resultado ou o pódio
```

Quem recebe o quê, por fase (prova de L-008 em toda mensagem, inclusive no `welcome`):

| Fase | TV | Celular de jogador | Convidado (tela de entrada) |
| --- | --- | --- | --- |
| `round` | `welcome`, `counts` | `welcome` com `found` e `salt`, hashes | `welcome` |
| `words` | `welcome`, `round-results` | só `welcome` | só `welcome` |
| `results` | `welcome`, `round-results` | `welcome`, `round-results` | `welcome`, `round-results` |
| `podium` | `welcome`, `round-results`, `podium` | `welcome`, `round-results`, `podium` | `welcome`, `round-results`, `podium` |

A palavra da rodada só chega a um celular depois do `show-result`. A TV recebe as palavras no fim da rodada, como no M4: a lista da TV já é a revelação.

### Três decisões de abordagem

**1. Fase `words` no servidor, com mensagens de fase explícitas.** Recomendada e adotada.
- O servidor guarda `phase: 'words'`; o `welcome` a carrega; uma mensagem nova `{ type: 'phase', phase }` anuncia `words` e `results`. O `podium` continua anunciado pela mensagem `podium`.
- `round-results` deixa de mudar a fase nos dois redutores: ele só traz os dados. A fase vem só de `welcome`, `round-start`, `phase` e `podium`. Isso evita que a ordem das mensagens decida a tela.
- Alternativa descartada: manter a fase `results` com um campo `stage` no estado. Funciona, mas cada regra que hoje pergunta "é `results`?" teria de olhar dois campos, e `COMMAND_PHASES` deixaria de bastar para recusar `next` durante a lista.
- Alternativa descartada: a TV continuar dona da etapa e só avisar o servidor. Um cliente decidiria uma regra de jogo, contra "O servidor é autoritativo".

**2. Rolagem e destaque como função pura do tempo, um passo por segundo.** A palavra destacada é `floor(tempo desde o início da lista / 1 s)`, até a última. A posição da lista é a que põe a palavra destacada na linha de leitura (um terço do painel), presa entre o topo e "última palavra inteira na tela". Entre dois segundos a lista anda em linha reta, numa transição de `transform` de 1 s.
- Com linhas de altura igual, a lista sobe uma linha por segundo (WORDCTL-01 AC 1). Uma lista que cabe fica presa em 0, e o destaque desce sozinho (AC 2, 14). No fim, a posição para na última palavra inteira e o destaque continua até a última palavra (AC 3).
- A regra fica em `model/word-scroll.ts`, testada com Vitest; a tela só mede as linhas e aplica o `transform`.
- Alternativa descartada: rolagem contínua em pixels por segundo e destaque "de quem cruza a linha". As palavras acima da linha de leitura no começo e abaixo dela no fim nunca seriam destacadas.

**3. Uma receita de som no `core`, dois tocadores finos.** O "check" é dado puro (`CHECK_SOUND`: notas, ondas e ganhos) em `packages/core/src/client/synth.ts`, com `playNotes(context, notes, at, gain)` escrito sobre interfaces estruturais de Web Audio (`AudioContextLike`). O `core` continua sem tipos de DOM: as interfaces descrevem só o que é usado, como a TV já fazia em `device/audio.ts`. TV e celular passam o `AudioContext` real; os testes passam um falso.
- Alternativa descartada: copiar a receita nos dois clientes. Dois lugares para o mesmo som, que o spec manda ser "o mesmo".

---

## Code Reuse Analysis

### Existing Components to Leverage

| Component | Location | How to Use |
| --- | --- | --- |
| Tabela de handlers e de fases | `packages/core/src/room/machine.ts` (`HANDLERS`, `COMMAND_PHASES`, `COMMAND_ROLES`) | `scroll` e `show-result` entram como linhas novas (style guide §4, O) |
| Comandos de anfitrião | `HOST_COMMANDS` em `packages/core/src/room/host.ts` | Recusa `not-host` (WORDCTL-01 AC 10) sem código novo |
| Fim da rodada | `endRound` em `packages/core/src/room/results.ts` | Muda o destino (`words`), os destinatários e ganha as contagens |
| Pódio e vitórias | `podiumMessage`, `awardWins` em `flow.ts` | `show-result` da última rodada manda o pódio |
| Volta ao lobby | `handleBackToLobby` | Passa a valer também em `words` (Edge Cases) |
| Sala guardada antiga | `sanitizeLoadedSettings` em `settings.ts` | Liga `music` numa sala guardada sem o campo |
| Prova de vazamento no DO | `packages/server/test/match.test.ts` ("never sends round words to phones before the results") | Ganha o `show-result` e uma reconexão durante `words` |
| Interfaces de Web Audio | `packages/tv/src/device/audio.ts` | Sobem para `core/src/client/synth.ts`; a TV importa de `@bwords/core` |
| Áudio falso | `packages/tv/src/testing/fake-audio.ts` | Base dos testes do `synth`, da música e do "check" do celular |
| Relógio de etapas | `createRevealClock` em `packages/tv/src/state/reveal.ts` | Passa a ler a fase; perde `hold` e a ida ao resultado por tempo |
| Linhas da lista | `wordRows` em `packages/tv/src/model/word-rows.ts` | Igual; o destaque usa o índice das linhas `word` |
| Wake lock do celular | `packages/phone/src/device/wake-lock.ts` | Padrão copiado em `packages/tv/src/device/wake-lock.ts` (ponta com DOM, não sobe) |
| Sala simulada | `packages/tv/e2e/fake-room.ts`, `packages/phone/e2e/fake-room.ts` | Empurram `phase` e `scroll` nos E2E |
| Fotos | `packages/tv/e2e/pictures.ts`, `result.picture.ts` | `picturePath` ganha a pasta da feature |
| Rotas fechadas | `clientAsset` em `packages/server/src/client-routes.ts` | Muda a tabela: `/` vai para a TV, `/join` para o celular |

### Integration Points

| System | Integration Method |
| --- | --- |
| Protocolo | `Phase` ganha `words`; cliente ganha `scroll` e `show-result`; servidor ganha `phase` e `scroll`; `PlayerInfo.words`, `PlayerResult.roundWords` e `PlayerResult.words`; `Settings.music` |
| Celular | `screenFor` mapeia `words` para `look-at-tv`; ações `scroll` e `showResult` no store; `SettingsPanel` ganha "Música" |
| TV | Etapa pela fase; `scroll` do servidor vai para o store da lista; música e tela ativa ligadas ao store |
| `tools/debug` | Mostra a fase `words` e ganha os botões ▲, ▼ e "Ver resultado" |
| Worker | Só a tabela de `clientAsset` muda |

---

## Components

### Core: protocolo

- **Purpose**: Os tipos e o parse das mensagens novas.
- **Location**: `packages/core/src/room/protocol.ts`
- **Interfaces**:
  - `Phase = 'lobby' | 'round' | 'words' | 'results' | 'podium'`.
  - Cliente: `{ type: 'scroll'; direction: 'up' | 'down' }`, `{ type: 'show-result' }`. `SHAPES` recusa outro `direction` e campos a mais (`bad-message`).
  - Servidor: `{ type: 'phase'; phase: 'words' | 'results' }`, `{ type: 'scroll'; direction: 'up' | 'down' }` (só para a TV).
  - `SCROLL_DIRECTIONS = ['up', 'down'] as const`.
- **Dependencies**: nenhuma.

### Core: sala na fase `words`

- **Purpose**: Encerrar a rodada na lista e abrir o resultado no toque do anfitrião.
- **Location**: `packages/core/src/room/results.ts` (modify), `packages/core/src/room/reveal.ts` (create), `machine.ts`, `round.ts`
- **Interfaces**:
  - `endRound(state, now, deps)`: fase `words`; a TV recebe `counts` e `round-results`; todos recebem `{ type: 'phase', phase: 'words' }` e depois `players`. Na última rodada as vitórias já são contadas aqui, como no M4. Com rodadas restando, `prepare-next` continua aqui.
  - `handleScroll`: na fase `words`, manda `{ type: 'scroll', direction }` à TV conectada; sem TV, nada. Não muda o estado.
  - `handleShowResult`: rodada do meio: fase `results`; celulares e convidados recebem `round-results`; todos recebem `{ type: 'phase', phase: 'results' }`. Última rodada: fase `podium`; celulares e convidados recebem `round-results`; todos recebem `podium`.
  - `COMMAND_PHASES`: `scroll` e `show-result` em `['words']`; `back-to-lobby` ganha `words`; `transfer-host`, `kick`, `join`, `close-room`, `hello` e `time` valem em todas as fases. `HOST_COMMANDS` ganha os dois; `COMMAND_ROLES` os dá só a `player`. Os dois contam como ação para o idle.
  - Um segundo `show-result` chega com a sala já em `results` ou `podium` e recebe `wrong-phase` (Edge Cases).
  - `afterWelcome`: em `words`, só a TV recebe `round-results`; celulares e convidados recebem só o `welcome`.
  - `onPrepared` passa a guardar a próxima rodada também em `words`, quando há rodadas restando.
  - `handleJoin`: quem entra em `words` é espectador, como em `round` e `results`.
- **Reuses**: `podiumMessage`, `playersMessage`, `returnToLobby`.

### Core: contagem de palavras (RESULT-02)

- **Purpose**: Mandar as palavras da rodada e da partida de cada jogador, robusto a uma TV recarregada.
- **Location**: `packages/core/src/room/results.ts`, `state.ts`, `effects.ts`
- **Interfaces**:
  - `Player.words` e `PlayerInfo.words`: palavras da partida até a última rodada encerrada. Soma em `endRound` (`found.size`, que é a soma das únicas e das em comum que ele achou, RESULT-02 AC 5); zera junto com `score` em `beginRound` de partida nova e em `returnToLobby`. Espectadores não somam.
  - `PlayerResult.roundWords` e `PlayerResult.words`, ao lado de `roundPoints` e `score`.
- **Por que no servidor**: o celular soma o próprio resumo (AD-007), mas a TV só vê o último `round-results`. Com `words` em `PlayerInfo`, um `welcome` depois de recarregar já traz a soma da partida.
- **Contagem não é palavra**: `players` com `words` vai a todos só a partir do fim da rodada, como `score`. Durante a rodada os números ficam só nos `counts` da TV (AD-011).

### Core: música na sala

- **Location**: `packages/core/src/room/state.ts`, `settings.ts`
- **Interfaces**: `Settings.music: boolean`; `DEFAULT_SETTINGS.music = true` (MUSIC-01 AC 9); `SETTING_RULES.music = isBool`; `sanitizeLoadedSettings` põe `music: true` numa sala guardada sem o campo. Só muda no lobby, porque `settings` só vale lá: a mudança vale na partida seguinte (Edge Cases).

### Core: som compartilhado

- **Purpose**: O mesmo "check" na TV e no celular (WORDCTL-01 AC 15, FEEDBACK-02 AC 2).
- **Location**: `packages/core/src/client/synth.ts` (create)
- **Interfaces**:
  - `AudioContextLike`, `OscillatorNodeLike` (com `type`), `GainNodeLike`, `AudioParamLike`: movidos de `packages/tv/src/device/audio.ts`.
  - `interface Note { startS; durationS; frequencyHz; wave: 'sine' | 'triangle' | 'square'; gain }`.
  - `CHECK_SOUND: readonly Note[]`: duas notas curtas que sobem (cerca de 0,2 s no total), onda triangular.
  - `playNotes(context, notes, atS, peakGain)`: um oscilador e um ganho com fade por nota.
- **Dependencies**: nenhuma de DOM.

### Core: conexão (M4FIX-01 AC 1)

- **Location**: `packages/core/src/client/room-connection.ts`
- **Interfaces**: `startReconnecting` só agenda o prazo de 30 s (ou o da política) quando não há um: `cancelOffline ??= schedule(...)`. Um socket que abre e cai antes do `welcome` mantém o primeiro prazo, que o `welcome` cancela. O teste existente "keeps the 30 second deadline while sockets open and drop before any welcome" continua valendo.

### Celular

| Módulo | Mudança | Requisito |
| --- | --- | --- |
| `model/room-view.ts` | `round-results` só guarda `results`; `phase` muda a fase | SYNC-01 |
| `model/screen.ts` | `words` → `look-at-tv`, para jogador, espectador e anfitrião; `results` com `last` continua `podium` | SYNC-01 AC 1-6 |
| `state/room.ts` | `scroll(direction)` e `showResult()` mandam as mensagens | WORDCTL-01 AC 4-8 |
| `state/round.ts` | A mensagem `phase` com `words` descarta os caminhos pendentes, como `round-results` fazia | Edge Cases do M3 |
| `screens/LookAtTvScreen.tsx` | "Olhe para a TV", "As palavras da rodada estão passando lá"; com `hostId === myId`, o componente `WordsHostControls` (▲, ▼, "VER RESULTADO", botões de 48 px ou mais) | SYNC-01 AC 1, WORDCTL-01 AC 4, 12 |
| `state/prefs.ts` | `DEFAULT_PREFS = { vibrate: true, sound: true }` | FEEDBACK-02 AC 1 |
| `device/hit-sound.ts` | `createHitSound(createContext)` toca `CHECK_SOUND` com `playNotes` | FEEDBACK-02 AC 2 |
| `components/BoardGrid.tsx` | Prop `tone` (`valid`, `already-found`, `invalid`, `too-short` ou nada); com `tone`, as peças do caminho do feedback usam `--color-valid`, `--color-already-found` ou `--color-invalid` | FEEDBACK-02 AC 6 |
| `state/round.ts` | O feedback guarda o caminho solto (`path`), para o tabuleiro pintar | FEEDBACK-02 AC 6 |
| `screens/ExitScreens.tsx` | "ENTRAR EM OUTRA SALA" vai para `/join` | ROUTE-01 AC 6 |
| `components/SettingsPanel.tsx` | Toggle "Música" | MUSIC-01 AC 8 |
| `index.html`, `styles/app.css`, `device/no-zoom.ts` | Sem zoom (abaixo) | NOZOOM-01 |

"Too short" não tem cor própria no spec: as peças voltam ao normal, como hoje a palavra.

### TV: etapa pela fase

- **Location**: `packages/tv/src/model/room-view.ts`, `model/reveal.ts`, `state/reveal.ts`, `model/screen.ts`
- **Interfaces**:
  - `applyServerMessage`: `round-results` só guarda; `phase` muda a fase; `scroll` não muda a view (vai para o store da lista).
  - `RevealStage = 'time-up' | 'words' | 'result'`. Em `words`: `time-up` até `wordsStartAt`, depois `words`. Em `results` e `podium`: `result`. Saem `hold`, `HOLD_AFTER_LAST_MS`, `WORDS_PER_SECOND`, `MAX_SCROLL_MS` e `scrollDurationMs`.
  - `RevealPlan = { wordsStartAt; resultShownAt: number | null }`. `wordsStartAt` segue a regra do M4 (`max(chegada, endsAt + 2 s)`); uma TV recarregada na lista recomeça do topo (WORDCTL-01 AC 11). `resultShownAt` é o instante, no relógio do servidor, em que a TV viu a fase virar `results` ou `podium`; as peças acendem a partir dele.

### TV: lista conduzida

- **Location**: `packages/tv/src/model/word-scroll.ts` (create), `state/word-scroll.ts` (create), `components/WordScroll.tsx`, `screens/WordsScreen.tsx`
- **Interfaces** (`model/word-scroll.ts`, puro):
  - `interface ScrollLayout { panelPx: number; listPx: number; words: readonly { topPx: number; heightPx: number }[] }`.
  - `maxOffset(layout)`: `max(0, listPx - panelPx)`, a última palavra inteira na tela.
  - `highlightIndex(elapsedMs, wordCount)`: `null` antes de 0 ou sem palavras; senão `min(floor(elapsedMs / 1000), wordCount - 1)`.
  - `targetOffset(layout, index)`: o centro da palavra na linha de leitura (`panelPx / 3`), preso entre 0 e `maxOffset`.
  - `autoOffset(layout, elapsedMs)`: interpolação linear entre `targetOffset(i)` e `targetOffset(i + 1)` dentro do segundo `i`.
  - `stepOffset(layout, offset, direction)`: `offset ± panelPx / 2`, preso entre 0 e `maxOffset` (AC 5-7).
  - Constantes: `HIGHLIGHT_STEP_MS = 1_000`, `READING_LINE_RATIO = 1 / 3`, `MANUAL_STEP_RATIO = 0.5`.
- **Store** (`state/word-scroll.ts`): `mode: 'auto' | 'manual'`, `offset`, `highlight` (`computed` do relógio do servidor e de `wordsStartAt`); `setLayout(layout)`, que a tela chama depois de medir; `step(direction)`, que no primeiro toque congela `autoOffset` do instante e passa a `manual`, sem destaque até o fim da lista (AC 16). Um `effect` toca `check` quando `highlight` muda para um índice novo, só em `auto`. O store zera ao sair de `words` e ao chegar uma rodada nova. O `scroll` do servidor chega pelo `onMessage` do store da sala.
- **Tela**: `WordScroll` mede o painel e as linhas `word` uma vez, depois das fontes, e manda o layout ao store. Em `auto`, o `transform` muda a cada segundo, com `transition: transform 1s linear`; em `manual`, com uma transição curta. A palavra destacada ganha `word-row--highlighted`: cor de fundo e `transform: scale()`, sem mudar a altura nem a posição das outras (AC 17). "Nenhuma palavra encontrada" fica parada até "Ver resultado" (Edge Cases).
- **Por que o layout é medido**: as linhas têm alturas diferentes (grafias que quebram, títulos de grupo). Medir uma vez deixa o cálculo puro e testável com layouts escritos à mão.

### TV: resultado

| Módulo | Mudança | Requisito |
| --- | --- | --- |
| `model/standings.ts` | `standings(players, results)`: entre as rodadas, valores de `results.players` (`roundPoints`, `roundWords`), ordem pelos pontos da rodada, empates na ordem de entrada; na última, `PlayerInfo.score` e `PlayerInfo.words`. Quem não está em `results.players` vai por último: 0 e 0 entre as rodadas, a própria soma na última. `crowned` = 1º lugar com pontos acima de 0 | RESULT-02 AC 2, 3, 5-7, 10 |
| `model/score-label.ts` | `scoreLabel(words, points)` → `{ words: '14 plvrs', points: '34', unit: 'pts' }`; singular só em 1 | RESULT-02 AC 4 |
| `model/result-header.ts` | `standingsTitle`: "Classificação da Rodada N" ou "Classificação da Partida"; sai `afterRound` | RESULT-02 AC 6-7, AD-029 |
| `components/PodiumCard.tsx`, `StandingLine.tsx` | "N plvrs · P pts" | RESULT-02 AC 2-3 |
| `screens/ResultScreen.tsx` | Cartão da maior palavra acima do tabuleiro; `RoomCard` com `label={null}`; lista do 4º em diante em duas colunas, como a capture | RESULT-02 AC 1, 8, 9 |

### TV: música e vinheta

| Módulo | Função | Requisito |
| --- | --- | --- |
| `model/music.ts` | `musicTrack(phase, settings, closeReason)`: `round` e `words` → `background`; `results` e `podium` → `jingle`; lobby, sem sala ou `music: false` → `null` | MUSIC-01 AC 1, 3, 4, 8 |
| `model/songs.ts` | `BACKGROUND_SONG` e `JINGLE_SONG` como tabelas de `Note` escritas a partir de uma partitura curta (`score(bpm, voices)`); `notesInWindow(song, fromS, toS)` com a volta do loop | MUSIC-01 AC 6, 7 |
| `model/music-clock.ts` | `advanceMusic(clock, track, elapsedMs)`: a posição da `background` só anda enquanto ela é a faixa e nunca volta ao zero; a `jingle` volta ao zero a cada resultado novo | MUSIC-01 AC 2, 10 |
| `device/music.ts` | `createMusicPlayer(context)`: agenda as notas da janela seguinte (lookahead de 300 ms) num ganho por faixa; troca de faixa abaixa e solta o ganho antigo; contexto bloqueado não agenda nada | MUSIC-01 AC 5, 10 |
| `state/music.ts` | Liga sala, relógio e player: a cada tique anda o relógio da música pelo tempo real (`now()` injetado) e pede a janela ao player | MUSIC-01 AC 1-10 |

- **Música original**: o projeto escreve as notas; não há arquivo nem trecho de música de terceiros. A `background` é calma, em torno de 72 bpm, onda triangular com baixo suave, em escala pentatônica maior; a `jingle` é animada, a 128 bpm, 16 compassos de 4 tempos: exatamente 30 s (MUSIC-01 AC 7).
- **Volume**: `MUSIC_GAIN_RATIO = 0,3` do ganho dos efeitos, no mesmo volume e mudo da sala (MUSIC-01 AC 5). O "check", o apito e os bipes não passam por `music` (MUSIC-01 AC 8).
- **Som liberado depois**: o relógio da música anda pela regra, toque o navegador ou não. Na liberação, o player começa da posição atual (MUSIC-01 AC 10).

### TV: tela sempre ativa

- **Location**: `packages/tv/src/device/wake-lock.ts` (create), `state/awake.ts` (create), `components/AwakeVideo.tsx` (create), `app.tsx`
- **Interfaces**:
  - `keepsAwake(view)`: verdadeiro até a sala expirar (`idle`, `tv-gone`) ou a aba ser substituída (`replaced`); em todas as fases (assumption "Quando a tela fica ativa").
  - `createKeepAwake({ wakeLock, onVisible, room })`: pede a Screen Wake Lock enquanto `keepsAwake` e a página estiver visível; pede de novo ao voltar a ficar visível (TVAWAKE-01 AC 1-2).
  - `AwakeVideo`: um `<video muted loop playsinline autoplay aria-hidden>` de 2x2 px no canto, cuja fonte é `canvas.captureStream(1)` de um canvas pintado com `--color-background`, lida do CSS. `play()` recusado é registrado com `console.warn` e o jogo segue (TVAWAKE-01 AC 3-5).
  - A música de fundo é a terceira camada, quando toca.
- **Sem arquivo de vídeo**: o stream do canvas dispensa um binário no repositório e qualquer dúvida de licença. A cor do fundo faz o vídeo sumir mesmo com opacidade total, sem depender de `opacity: 0`, que alguns navegadores tratam como vídeo que pode pausar.

### Rotas

- **Location**: `packages/server/src/client-routes.ts`
- **Interfaces**: `clientAsset`: `/`, `/tv` e `/tv/` → TV; `/join` → celular; `/<CÓDIGO>` em qualquer caixa → celular; arquivos de cada cliente como hoje; o resto `null`. `JOIN` nunca é um código: o alfabeto não tem I nem O.
- **TV**: `JoinCard` mostra "ou acesse <host>/<CÓDIGO>" (ROUTE-01 AC 5). O QR continua com `roomUrl`.
- **Celular**: `parseRoomPath('/join')` já dá `null`, e a tela é a de código. No Vite de desenvolvimento, `/join` cai no `index.html`.

### Celular sem zoom

- **Location**: `packages/phone/index.html`, `packages/phone/src/styles/app.css`, `packages/phone/src/device/no-zoom.ts` (create), `main.tsx`
- **Interfaces**:
  - Meta viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`. O Chromium e o Android respeitam; o Safari do iOS ignora `user-scalable` para a pinça.
  - CSS: `html { touch-action: manipulation; }` tira o zoom de toque duplo no iOS e no Android, sem o atraso de 300 ms, então cada toque de um toque duplo conta (NOZOOM-01 AC 1, 3). O tabuleiro mantém o `touch-action` dele.
  - `preventZoom(target)`: `preventDefault` em `gesturestart`, `gesturechange` e `gestureend` (só existem no Safari) e em `touchmove` com dois dedos ou mais (`passive: false`). Um dedo nunca é bloqueado, então o deslizar segue (NOZOOM-01 AC 2).
  - Campos de texto com fonte de 16 px ou mais: o Safari dá zoom ao focar um campo menor. A auditoria de estilos do celular ganha essa regra.

### Pendências do M4

| AC | Onde | Como |
| --- | --- | --- |
| 1 | `core/src/client/room-connection.ts` | `cancelOffline ??=` (acima) |
| 2 | `tv/src/styles/connection-banner.css` | Na rodada, a faixa fica abaixo do cartão do código: o topo dela parte do fim do cabeçalho, em `rem` |
| 3 | `tv/src/strings/pt-BR.ts` | `firstJoinerHosts: 'Quem entrar primeiro vira anfitrião(ã)'` |
| 4 | `phone/playwright.config.ts` | `workers: 4`, com o mesmo comentário da TV |
| 5 | `docs/DESIGN.md` | `wrangler.jsonc` no lugar de `wrangler.toml` |

---

## Data Models

```typescript
type Phase = 'lobby' | 'round' | 'words' | 'results' | 'podium';

type ScrollDirection = 'up' | 'down';

type ClientMessage =
  | /* ...as do M4... */
  /** Host only, on the words (WORDCTL-01 AC 5-6, 10). */
  | { type: 'scroll'; direction: ScrollDirection }
  /** Host only, on the words; a second one gets wrong-phase (WORDCTL-01 AC 8-10). */
  | { type: 'show-result' };

type ServerMessage =
  | /* ...as do M4... */
  /** The phase moved without another message carrying it: the words at the end of a round, the result in the middle of a match. */
  | { type: 'phase'; phase: 'words' | 'results' }
  /** Only to the TV: the host's step through the words. */
  | { type: 'scroll'; direction: ScrollDirection };

interface Settings {
  /* ...as do M4... */
  /** Background music and the result jingle on the TV; on in a new room (MUSIC-01 AC 8-9). */
  music: boolean;
}

interface PlayerInfo {
  /* ...as do M4... */
  /** Words of the match up to the last round that ended (RESULT-02 AC 3, 5). */
  words: number;
}

interface PlayerResult {
  playerId: string;
  unique: ResultWord[];
  roundPoints: number;
  /** Unique words plus the shared ones this player found, in this round (RESULT-02 AC 2, 5). */
  roundWords: number;
  score: number;
  /** Words of the match after this round (RESULT-02 AC 3). */
  words: number;
}
```

```typescript
// packages/tv/src/model/word-scroll.ts
interface ScrollLayout {
  panelPx: number;
  listPx: number;
  /** Only the word rows, in list order; group titles are not highlighted. */
  words: readonly { topPx: number; heightPx: number }[];
}

// packages/tv/src/model/music-clock.ts
type MusicTrack = 'background' | 'jingle';
interface MusicClock {
  track: MusicTrack | null;
  backgroundS: number;
  jingleS: number;
}
```

---

## Error Handling Strategy

| Error Scenario | Handling | User Impact |
| --- | --- | --- |
| `scroll` ou `show-result` de quem não é anfitrião | `not-host` | Nada muda |
| `scroll` ou `show-result` fora de `words` (inclusive o segundo "Ver resultado") | `wrong-phase` | Nada muda; o celular já está na tela nova |
| `scroll` sem TV conectada | O servidor descarta | Nada; a TV recarregada recomeça do topo |
| Anfitrião desconectado durante a lista | A TV segue em `auto` até o fim e espera; a passagem de anfitrião do M3 dá os controles a outro | O novo anfitrião vê ▲, ▼ e "Ver resultado" |
| Navegador sem Screen Wake Lock ou que recusa | `console.warn`, segue | Nenhum aviso na tela |
| `captureStream` ou `play()` do vídeo indisponível ou recusado | `console.warn`, sem vídeo | Nenhum aviso na tela |
| Som bloqueado | A música anda no relógio sem tocar; o aviso de som do M4 continua | A música entra na liberação, do ponto em que estaria |
| Navegador sem Web Audio | Sem música e sem "check" | Nenhum aviso, como no M4 |
| Sala guardada sem `music` | `sanitizeLoadedSettings` liga | Música ligada |

---

## Risks & Concerns

| Concern | Location (file:line) | Impact | Mitigation |
| --- | --- | --- | --- |
| `round-results` hoje muda a fase nos dois redutores; com `words`, a ordem das mensagens decidiria a tela | `packages/tv/src/model/room-view.ts:63`, `packages/phone/src/model/room-view.ts:103` | Tela errada numa reconexão | `round-results` só guarda dados; a fase vem de `welcome`, `round-start`, `phase` e `podium`, com teste por ramo (L-007) |
| Os E2E de partida inteira jogam contra o servidor real; a T3 muda o fluxo antes de os clientes saberem "Ver resultado" | `packages/phone/e2e/full-match.spec.ts`, `packages/tv/e2e/full-match.spec.ts` | E2E vermelhos entre a T3 e a T12 (celular) e a T28 (TV) | As duas suítes ficam fora do gate das tarefas nesse intervalo; o commit da T3 diz isso, e T12 e T28 as devolvem ao verde. Nenhum teste é apagado |
| L-008: uma mensagem nova, ou o `welcome` em `words`, levar palavras a um celular | `packages/core/src/room/machine.ts:211`, `results.ts:79` | Vazamento das palavras antes do resultado | Prova em toda mensagem que um celular e um convidado podem receber em `words`, inclusive o `welcome` de reconexão, no `core` e no Durable Object |
| `players` com `words` vai aos celulares antes de "Ver resultado" | `results.ts:84` | Um número da rodada chega antes, mas nunca uma palavra | Aceito, como `score` no M4; os celulares mostram "Olhe para a TV" |
| Linhas de alturas diferentes mudam o "uma linha por segundo" | `packages/tv/src/styles/word-row.css` | Um segundo com título de grupo anda mais | A regra anda uma palavra por segundo; o teste de velocidade usa linhas de altura igual. Ver gap no spec |
| `canvas.captureStream` e a proteção de tela da LG | DESIGN §4.5 | Não confirmei na documentação se o navegador da TV conta um vídeo de stream como mídia ativa | Três camadas; a prova é a caminhada na TV real. Se falhar, uma tarefa nova troca a fonte do vídeo por um arquivo MP4 gerado pelo projeto |
| `Input.synthesizePinchGesture` é experimental no CDP | Playwright, `packages/phone/e2e/zoom.spec.ts` | O teste da pinça pode quebrar com o Chromium | Se o comando sumir, a prova da pinça vira caminhada; o iPhone já é caminhada |
| O Safari do iOS ignora `user-scalable=no` | `packages/phone/index.html` | Zoom por pinça no iPhone | `gesturestart` e `touchmove` de dois dedos; prova no iPhone real |
| Música tocando por cima do "check" | `state/music.ts` | O "check" some | Música a 30% do ganho dos efeitos |
| Lookahead da música num navegador de TV lento | `device/music.ts` | Notas atrasadas | Agendar no relógio do `AudioContext`, com 300 ms de folga, nunca por `setTimeout` por nota |
| `tools/debug` com `switch` exaustivo sobre a fase | `tools/debug/src/main.tsx` | `tsc` vermelho | A T1 trata `words` em todo `switch` exaustivo do repositório, como no M4 |

---

## Tech Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Quem decide a etapa depois da rodada | Fase `words` no servidor | "O servidor é autoritativo"; reconexão cai na tela certa |
| Mensagem de fase | `{ type: 'phase', phase }` só para `words` e `results` | `round-start` e `podium` já carregam a fase deles |
| Onde fica a posição da lista | Só na TV | Assumption "TV recarregada na lista"; o servidor só repassa ▲ e ▼ |
| Destaque | Índice por segundo; a lista se move para pôr a palavra destacada na linha de leitura | Toda palavra é destacada, inclusive as do começo e do fim |
| Contagem de palavras | `PlayerInfo.words` e `PlayerResult.roundWords`/`words` | A TV recarregada recupera tudo do `welcome` e do último `round-results` |
| Som compartilhado | Receita e tocador em `core/src/client/synth.ts`, sobre interfaces estruturais | Sem tipos de DOM no `core`; um lugar para o "check" |
| Música | Notas escritas no código, tocadas com Web Audio | MUSIC-01 AC 6; sem arquivo nem licença de terceiros |
| Vídeo da tela ativa | `canvas.captureStream`, sem arquivo | Nada binário no repositório |
| Prova do zoom | Playwright com `isMobile: true` no arquivo do teste, pinça por CDP; iPhone por caminhada | O Chromium de desktop ignora o meta viewport |
| Prova de config e docs | Comando `node -e` que lê o arquivo, julgado pelo exit code | Não há suíte que alcance `playwright.config.ts` nem `docs/` |
| Foto do resultado | `result.picture.ts` grava em `.specs/features/m4-1-playtest/captures/`, 1920x1080 com `deviceScaleFactor: 2` | A capture tem 3840x2160 |

Nenhuma decisão aqui muda uma `AD-NNN` ativa; AD-024 a AD-029 já registram as decisões de produto desta feature.
