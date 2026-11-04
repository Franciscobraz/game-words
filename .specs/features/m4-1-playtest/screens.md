# M4.1 Playtest screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 1

pictures: tiradas por este sub-agent com os picture scripts da TV (`npx playwright test -c packages/tv/playwright.pictures.config.ts words.picture result.picture`), janela de 1920x1080 a deviceScaleFactor 2, sem redimensionar, com os dados de exemplo das captures. A `tv-words.png` foi comparada pelo quadro de 1920x1080 dentro da margem de 64 px.

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/tv-round-result.running.png` | `captures/tv-round-result.png` | matches | 0 rows differ |
| `captures/tv-words.running.png` | `captures/tv-words.png` | matches | 0 rows differ |

### `captures/tv-round-result.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| arranjo: header no topo, coluna esquerda (cartão da maior palavra acima do tabuleiro), coluna direita (classificação), rodapé centralizado | same | |
| header: logo "B" laranja e "BWords" à esquerda | same | |
| header: "Resultado · Rodada 1 de 3", "Resultado" esmaecido e "Rodada 1 de 3" em destaque | same | |
| header: cartão do código com "KBXT" em laranja e o QR à direita, sem "CÓDIGO DA SALA" | same | nota: cartão um pouco mais alto e QR maior; na capture o código fica numa caixa interna mais escura, no picture direto no cartão. QR real da sala (diferença confirmada) |
| cartão da maior palavra: borda laranja à esquerda, "A maior palavra do tabuleiro", "TERNOS" grande | same | |
| cartão da maior palavra: chip "Ana encontrou!" laranja com borda, à direita | same | |
| painel do tabuleiro: 4x4 centralizado num painel escuro, com "Qu" numa peça | same | |
| tabuleiro: peças de TERNOS (E, R, O, T, N, S) acesas em laranja, as outras escuras | same | |
| título da classificação "Classificação da Partida" | same | "Classificação da Rodada 1" (diferença confirmada, AD-027) |
| "Após Rodada 1" à direita do título | same | nada (diferença confirmada, AD-029) |
| pódio: três cartões lado a lado com a faixa no topo na cor do jogador (laranja, azul, verde) | same | |
| cartão 1º: "Ana" com coroa, "1º" na cor, "14 plvrs · 34 pts" com os pontos grandes | same | nota: a coroa é um ícone amarelo chapado, na capture um emoji |
| cartão 2º: "Beto", "2º", "11 plvrs · 25 pts" | same | |
| cartão 3º: "Caio (offline)" em itálico esmaecido, "3º", "8 plvrs · 16 pts" | same | "Caio (desconectado)" (diferença confirmada, AD-022) |
| confete sobre o cartão do 1º | same | sem confete entre as rodadas (diferença confirmada, AD-024) |
| painel da lista: 4º a 10º em duas colunas, linhas com fundo próprio, ordem 4º/5º, 6º/7º, 8º/9º, 10º sozinho à esquerda | same | |
| linha da lista: posição, círculo com inicial na cor do jogador, apelido, "N plvrs · N pts" à direita com os pontos em destaque | same | |
| singular: "1 plvr · 1 pt" na linha da Bia | same | |
| painel da lista se estende até a altura do painel do tabuleiro, com espaço vazio abaixo das linhas | same | |
| rodapé: ponto laranja e "Aguardando Ana avançar…" centralizado | same | |

### `captures/tv-words.running.png`

| Element | Result | Picture draws |
| --- | --- | --- |
| margem de 64 px em volta do quadro | same | a tela ocupa a janela inteira (diferença confirmada, AD-030) |
| arranjo: header no topo, lista à esquerda (~2/3), painel "Jogadores" à direita (~1/3), ambos começando na mesma altura | same | nota: a lista um pouco mais larga em proporção |
| header: logo "B" laranja e "BWords" à esquerda | same | |
| header: "Palavras · Rodada 1 de 3", "Palavras" em laranja claro e o resto em branco | same | |
| header: cartão do código "KBXT" grande em branco com o QR à direita | same | QR real da sala |
| faixa de totais: "142 palavras possíveis" à esquerda (número laranja) e "13 palavras encontradas" à direita (número azul) | same | nota: os números um pouco maiores |
| lista: uma palavra por linha, linhas alternando com e sem fundo, círculos dos jogadores e "+N" à direita | same | nota: na capture as linhas ficam recuadas dentro de um painel de fundo; no picture vão até a largura da faixa de totais |
| lista: primeira (SER) e última (TERNOS) linhas esmaecidas nas bordas da área de rolagem | same | |
| linhas comuns: CASA, CERA, QUERO com dois círculos | same | círculos na cor de cada jogador (diferença confirmada, AD-030) |
| destaque de palavra | same | CERA destacada em laranja, com fundo mais claro e escala maior (diferença confirmada, AD-024) |
| separador "Palavras Únicas" com o chip laranja "PONTOS EM DOBRO" | same | |
| "APENAS 1 JOGADOR" à direita do separador | same | nada (diferença confirmada, AD-022) |
| linhas únicas: NUA, TIA, RINS, SERIA com um círculo e "+N" | same | |
| variantes: "SERIA (seria, séria)" com as variantes menores ao lado | same | |
| painel "Jogadores": título, chip "10 na sala", "RODADA 1" à direita, linha divisória | same | |
| card do jogador: borda esquerda e círculo na cor do jogador, apelido, "N palavras" abaixo, "N pts" à direita | same | |
| pontos do 1º e do 2º na cor de cada um, os outros em branco | same | |
| card desconectado: "Caio DESCONECTADO" e card esmaecido | same | |
| ordem do painel pelos pontos | same | ordem pelos pontos até CERA (Ana 7, Beto 6, Caio 3, Gui 0…); os números seguem a lista no meio, e o card do 1º tem o fundo mais claro (WORDCTL-01 AC 24, 29) |
| singular: "1 palavra" e "1 pt" na Pri | same | Pri com "1 palavra" e "0 pts" no meio da lista |
| dez cards, todos inteiros dentro do painel, sem rolagem | same | |
