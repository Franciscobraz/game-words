# M3 Phone screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2

Fotos tiradas por este sub-agente em HEAD a6e7f1a com `npx playwright test -c packages/phone/playwright.pictures.config.ts` (sala falsa de `e2e/fake-room.ts`, janela de 390×884 a 2x, página inteira, de modo que os rodapés sticky aparecem no fim da página como numa janela alta). As fotos novas só diferem das do autor no ponto animado de "Aguardando" (`phone-join`, `phone-lobby`) e foram salvas por cima. C121: as mesmas telas fotografadas a 320 e 480 px mantêm regiões, composição e ordem; os testes de `phone-host-lobby`, `phone-host-actions`, `phone-spectator`, `phone-round-result` e `phone-podium` fixam 390 px e não foram vistos em outra largura nesta rodada.

**Round 2** (HEAD 7176644, depois do fixer `5ca2029..80c44a4` e de AD-018): este sub-agente refez só as seis fotos com linha `differs` (`phone-host-lobby`, `phone-spectator`, `phone-round-result`, `phone-podium`, `phone-kicked`, `phone-room-closed`) com o mesmo comando, a 390 px e página inteira; as seis saíram iguais às do fixer. Só as linhas `differs` do round 1 foram julgadas de novo; o resto ficou como estava. AD-018 aplicada (etiquetas da Ana como em `phone-lobby.png`). C121: as seis telas também foram fotografadas a 320 e 480 px (`PICTURE_WIDTH`, em `packages/phone/test-results/pictures/<largura>/`, fora do git). A 320 px mantêm regiões e ordem; "Tempo da Rodada" quebra em duas linhas porque não cabe ao lado dos botões de 48 px (limite conhecido, AD-016), "Filtrar palavrões" e a etiqueta do espectador também quebram, as etiquetas da Ana e dos outros descem para baixo do apelido no lobby do anfitrião, e em `phone-round-result` o "(corações)" de CORACOES quebra no meio da palavra ("(coraçõe" / "s)"), o que fica como nota para o user.

Aplicados: `## Differences from the source` do spec e os defaults aceitos em `## Handoff` (barra de topo comum na contagem; sem bandeira e foguete; ordem por pontos; "em comum"; lista do espectador sem vitórias, com "N jogadores" e com rolagem; menu ⋮ do anfitrião no resultado e no pódio; etiquetas menores nas listas). Dados de exemplo (contagens, relógio, pontos que o `core` calcula, ordem da paleta) não são julgados.

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/phone-code.running.png` | `captures/phone-code.png` | matches | |
| `captures/phone-join.running.png` | `captures/phone-join.png` | matches | |
| `captures/phone-lobby.running.png` | `captures/phone-lobby.png` | matches | |
| `captures/phone-host-lobby.running.png` | `captures/phone-host-lobby.png` | matches | round 2: os 3 rows agora `same` |
| `captures/phone-host-actions.running.png` | `captures/phone-host-actions.png` | matches | |
| `captures/phone-countdown.running.png` | `captures/phone-countdown.png` | matches | |
| `captures/phone-board.running.png` | `captures/phone-board.png` | matches | |
| `captures/phone-spectator.running.png` | `captures/phone-spectator.png` | matches | round 2: o row agora `same` |
| `captures/phone-round-result.running.png` | `captures/phone-round-result.jpg` | matches | round 2: os 2 rows agora `same` |
| `captures/phone-podium.running.png` | `captures/phone-podium.jpg` | matches | round 2: os 4 rows agora `same` |
| `captures/phone-kicked.running.png` | `captures/phone-kicked.png` | matches | round 2: o row agora `same` |
| `captures/phone-room-closed.running.png` | `captures/phone-room-closed.png` | matches | round 2: o row agora `same` |

### `captures/phone-code.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| marca no topo, centralizada: quadrado laranja "B" + "BWords" numa pílula | same | nota: pílula mais arredondada |
| título "Entrar numa sala" centralizado | same | |
| subtítulo "Digite o código de 4 letras exibido na TV" | same | |
| quatro caixas numa linha, K B X preenchidas, a 4ª realçada com cursor "_" | same | |
| erro "Sala não encontrada" com ícone "!" numa pílula vermelha embaixo das caixas | same | |
| botão laranja largo "CONTINUAR →" | same | |
| resto da tela vazio | same | |

### `captures/phone-join.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| topo: logo "B" + "BWords" à esquerda, pílula "SALA KBXT" à direita | same | nota: código em laranja, na capture em branco |
| cartão "Seu Apelido" com ícone, contador "4/12" verde, campo "Beto" com check verde | same | |
| cartão "Escolha sua cor no jogo" com ícone de paleta | same | |
| linha de círculos de cor que rola na horizontal, cortada na borda direita | same | nota: ordem segue a paleta do `core`; Duda fica fora da parte visível |
| cores dos outros bloqueadas (ícone ⊘) com o apelido embaixo | same | |
| cor escolhida com anel e check, "Você" embaixo | same | |
| bloco "Como você aparecerá na TV" com ícone, círculo "B" na cor e "Beto" | same | |
| cartão "Regras Desta Partida" com ícone | same | |
| chips "Tabuleiro 4x4", "2:00 min", "3 Rodadas", "Mín. 3 letras" em duas linhas, com ícones | same | nota: ícone de "3 Rodadas" é o de repetir, igual ao de `phone-lobby.png` |
| cartão "Aguardando Ana iniciar a partida…" com três pontos e "Ana" em laranja | same | |
| botão verde largo "ENTRAR" com ícone | same | |

### `captures/phone-lobby.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| topo: pílula "SALA KBXT" à esquerda, botão redondo de preferências laranja à direita | same | |
| cartão "Você": círculo "B" na cor, "Beto", etiqueta "VOCÊ", troféu "1" à direita, arco decorativo | same | |
| chips das regras em duas linhas (Tabuleiro 4x4, 2:00 min, 3 Rodadas, Mín. 3 letras) | same | |
| "Jogadores" com "4 na sala" à direita | same | |
| linha Ana: círculo, apelido, coroa, "ANFITRIÃO(Ã)" laranja, troféu "2" | same | nota: etiquetas menores (default aceito) |
| linha Beto: "VOCÊ" azul, troféu "1" | same | |
| linha Caio esmaecida com "DESCONECTADO", troféu "0" | same | |
| linha Duda com "ESPECTADOR(A)" vermelho, troféu "0" | same | |
| cartão de espera: ícone de controle, "Aguardando Ana iniciar a partida" em duas linhas, três pontos à direita | same | nota: pontos em três cores, na capture todos laranja |

### `captures/phone-host-lobby.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| topo: pílula "SALA KBXT", botão de preferências, menu ⋮ | same | nota: botão de preferências laranja, na capture cinza |
| linha divisória sob o topo | same | round 2: linha fina sob o topo |
| selo "VOCÊ É O(A) ANFITRIÃO(Ã)" centralizado | same | |
| título "Regras da Partida" com ícone | same | |
| "TABULEIRO" com segmentado 4×4 / 5×5 / 6×6, 4×4 ativo | same | |
| linha "Tempo da Rodada" com stepper − 2:00 + | same | round 2: rótulo numa linha a 390 px; a 320 px quebra em duas (limite conhecido, AD-016) |
| linha "Rodadas" com stepper − 3 + | same | |
| "MÍN. LETRAS" com segmentado 3 / 4, 3 ativo | same | |
| "Filtrar palavrões" com ícone e chave ligada | same | |
| "Fast mode" com ícone e chave desligada, legenda "Resultados rápidos, sem revelar palavra por palavra" | same | nota: a legenda quebra em duas linhas |
| "Dicionário" com seletor "Português (BR)" | same | sem bandeira (default aceito) |
| "Volume da TV" com ícone, botão de som e barra com controle | same | nota: trilho preenchido de laranja até o controle |
| "Jogadores" com contador "4" | same | |
| linha Ana: "VOCÊ" laranja ao lado do apelido e coroa, "ANFITRIÃO(Ã)" cinza embaixo do apelido, troféu "2" | same | round 2: "ANFITRIÃO(Ã)" laranja ao lado do apelido e "VOCÊ" azul embaixo (AD-018) |
| linha Beto, troféu "1" | same | |
| linha Caio esmaecida com "DESCONECTADO", troféu "0" | same | nota: etiqueta cinza, na capture avermelhada |
| linha Duda com "ESPECTADOR(A)", troféu "0" | same | nota: etiqueta vermelha, na capture cinza |
| rodapé com botão laranja "INICIAR PARTIDA" com ícone ▶ | same | sem foguete (default aceito) |

### `captures/phone-host-actions.running.png`

Só a folha é julgada; o fundo é o lobby atual escurecido (Differences from the source).

| Element | Result | Picture draws |
| --- | --- | --- |
| fundo escurecido atrás da folha | same | |
| folha presa embaixo, com alça no topo | same | |
| cabeçalho: círculo "B" na cor, "Beto", "1 vitória na sessão" | same | |
| linha divisória sob o cabeçalho | same | |
| botão "Tornar anfitrião" com coroa | same | nota: coroa preenchida |
| botão vermelho "Remover da sala" com ícone | same | |
| botão "Cancelar" | same | |

### `captures/phone-countdown.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| pílula "RODADA 1 DE 3" com ícone de cronômetro | same | |
| "SALA KBXT" (sem "SINCRONIZADO", AD-005) | same | na barra de topo comum, com o botão de preferências (default aceito) |
| número "1" grande, laranja, centralizado | same | |
| "Prepare o dedo!" | same | |
| "As letras aparecem em instantes..." | same | |

### `captures/phone-board.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| topo: pílula "SALA KBXT", botão de preferências | same | |
| cartão do relógio: ícone, "01:47", "Rodada 1/3", "N pal · N pts" à direita | same | nota: dados do exemplo (01:46, 5 pal · 9 pts) |
| área da palavra: peças C A S A acesas na cor do jogador | same | |
| selo verde "VÁLIDA (+2 PTS)" com check | same | |
| tabuleiro 4×4 num cartão, Qu numa peça | same | |
| caminho aceso com ligações entre as peças, última peça com anel | same | nota: tom da cor do jogador mais escuro |
| cartão "PALAVRAS ENCONTRADAS" com ícone e "5 no total" | same | |
| chips das palavras em linha que rola, CASA realçado, pontos em selo | same | |

### `captures/phone-spectator.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| topo: pílula "SALA KBXT" sem ponto (AD-005), botão de preferências | same | |
| cartão do relógio: ícone, "01:47", "Rodada 1/3" | same | |
| barra de progresso do tempo | same | |
| tabuleiro esmaecido | same | |
| cartão sobre o meio do tabuleiro: ícone de controle, "Você entra na próxima rodada.", "Assistindo" com três pontos | same | nota: cartão opaco; na capture deixa ver as letras por trás |
| cartão "JOGADORES NA SALA" com ícone e "4 jogadores" | same | |
| linhas com círculo, apelido, sem vitórias (default aceito) | same | |
| etiquetas ("ANFITRIÃO(Ã)", "DESCONECTADO", "VOCÊ", "ESPECTADOR(A)") alinhadas à direita da linha | same | round 2: etiquetas na ponta direita; nota: com uma margem maior até a borda da linha |
| a lista continua abaixo da dobra | same | rolagem aceita (default da fase 5) |

### `captures/phone-round-result.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| topo: pílula "SALA KBXT", preferências, menu ⋮ do anfitrião | same | menu ⋮ (default aceito) |
| linha "Rodada 1 de 3 • RESULTADO" | same | |
| cartão "OLHE PARA A TV" com ícone e subtítulo | same | subtítulo em duas linhas (Differences) |
| cartão "DESEMPENHO DA RODADA": ícone, "+18 pts", "somados nesta rodada!", selo "1º" | same | |
| caixa "PLACAR ACUMULADO 32 pts" com a pílula "Você está em 1º lugar" à direita, na mesma linha | same | round 2: pílula à direita, na mesma linha |
| "MINHAS PALAVRAS ENCONTRADAS (4)" com ícone, sem "Pontuação" | same | |
| linha CORACOES "(corações)" com selo "ÚNICA ×2", pontos e "base" à direita | same | nota: pontos do `core` (+12, base +6) |
| linhas QUERO, CASA, LUA com "em comum" e pontos | same | ordem por pontos (default aceito) |
| "PLACAR RÁPIDO DA MESA": quatro blocos com posição, círculo, apelido e pontos; o 1º realçado | same | |
| bloco da Duda com "4º", círculo, "Duda" e "Esp." | same | round 2: "4º" em cima do círculo |
| botão laranja "PRÓXIMA RODADA (2 DE 3)" | same | sem foguete (default aceito) |
| botão "← Voltar ao Lobby" | same | |

### `captures/phone-podium.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| topo: "SALA KBXT", preferências, menu ⋮ | same | Differences (AD-006) |
| cartão principal: círculo "A" com selo de troféu, "Você ficou em 1º Lugar!" | same | nota: sem o troféu solto à direita do título |
| caixas "PONTUAÇÃO TOTAL 46 pts" e "NA SESSÃO 3 vitórias" | same | |
| confetes | same | nota: só dentro do cartão principal |
| "SEU RENDIMENTO" | same | |
| cartão com ícone, "N Palavras encontradas" | same | |
| cartão "MAIOR PALAVRA ENCONTRADA" com "(corações)", selo de pontos, peças e "8 letras" | same | |
| "CLASSIFICAÇÃO DA MESA" com "4 jogadores" | same | |
| linhas com faixa na cor à esquerda, posição, círculo, apelido, vitórias e pontos | same | |
| linha Ana: "VOCÊ" e depois "ANFITRIÃO(Ã)", coroa ao lado do apelido | same | round 2: "ANFITRIÃO(Ã)" laranja e depois "VOCÊ" azul (AD-018); nota: as duas etiquetas ficam ao lado do apelido, não "VOCÊ" embaixo como diz o texto de AD-018, porque a segunda linha é "3 vitórias na sessão" (o user respondeu "Manter como está"); a 320 px descem para uma linha própria |
| linha Caio: "(desconectado)" em itálico ao lado do apelido | same | round 2: "(desconectado)" em itálico |
| linha Duda: posição "4", ícone de olho, "Espectador(a)", 0 PTS | same | round 2: "4" no círculo |
| rodapé sobre uma faixa escura que ocupa a largura | same | round 2: faixa escura na largura toda, com borda no topo |
| botão laranja "JOGAR DE NOVO" | same | sem foguete (default aceito) |
| botão "Voltar ao Lobby" com ícone | same | |
| "ENCERRAR SALA" com ícone | same | |

### `captures/phone-kicked.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| ícone de porta em contorno num círculo, com selo de mão acenando | same | round 2: porta em contorno e selo de mão; nota: porta fechada, na capture entreaberta |
| título "Você foi removido da sala" | same | numa linha |
| botão laranja "ENTRAR EM OUTRA SALA →" | same | texto, cartão e "VOLTAR AO INÍCIO" fora (Differences) |

### `captures/phone-room-closed.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| cartão central | same | "PARTIDA FINALIZADA" e o texto da TV fora (Differences) |
| ícone de confete num anel com três pontos coloridos | same | round 2: três pontos no anel; nota: confete preenchido |
| "Ana encerrou a sala" | same | |
| "Obrigado por jogar!" em laranja | same | |
| botão laranja "ENTRAR EM OUTRA SALA" com ícone de porta | same | cartão "Resultado Salvo" e "VOLTAR AO INÍCIO" fora (Differences) |
