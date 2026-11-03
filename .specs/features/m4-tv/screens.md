# M4 TV screens

**Verifier**: independent sub-agent (author != verifier)
**Round**: 2

Fotos tiradas por este sub-agente, contra a pilha real (`wrangler dev` em 8787), com gestos reais de 10 celulares a 390x844 e a TV a 1920x1080. `tv-lobby.png` tem 3840x2160, então o lobby foi fotografado na mesma viewport de 1920x1080 com `deviceScaleFactor` 2; as outras três captures têm 1920x1080 e foram fotografadas a 1x. Nenhuma foto foi redimensionada. Os dados que seguem a partida (apelidos, cores, código, letras, palavras, números) não contam como diferença.

| Screen | Compared with | Verdict | Finding |
| --- | --- | --- | --- |
| `captures/tv-lobby.running.png` | `captures/tv-lobby.png` | matches | round 2: as 2 linhas que diferiam agora são same |
| `captures/tv-round.running.png` | `captures/tv-round.png` | matches | |
| `captures/tv-words.running.png` | `captures/tv-words.png` | matches | |
| `captures/tv-round-result.running.png` | `captures/tv-round-result.png` | matches | |

### `captures/tv-lobby.running.png`

Estado: 4 jogadores, Ana com 2 vitórias e Beto com 1, ganhas em partidas reais; Caio com a página fechada; configurações 4x4, 2 min, 3 rodadas.

| Element | Result | Picture draws |
| --- | --- | --- |
| header: logo "B" laranja e "BWORDS" à esquerda, aviso de som no centro, cartão da sala à direita | same | "BWords", pela tabela de diferenças |
| aviso: pílula com ícone de mudo, "Aperte", tecla "OK", "no controle para liberar o som" | same | nota: a pílula é um pouco mais escura que na capture. O navegador sem gesto bloqueou o som, e o aviso apareceu |
| aviso: ícone de mudo dentro de um quadrado escuro arredondado, de cerca de 40 px | same | round 2: o ícone laranja dentro de um quadrado escuro de cantos arredondados, com 80 px de largura na foto a 2x, ou seja 40 px |
| cartão da sala: "SALA" em cinza e o código em azul | same | |
| painel esquerdo: "CONECTE-SE AGORA" | same | nada, pela tabela de diferenças |
| painel esquerdo: título "Entre pelo celular" | same | |
| painel esquerdo: QR em fundo branco arredondado, com o "B" no centro | same | QR real, mais denso, pela tabela de diferenças |
| painel esquerdo: código em letras gigantes e espaçadas | same | |
| painel esquerdo: "ou acesse <endereço> e digite o código", endereço em azul | same | `localhost:8787`, o endereço real |
| painel direito: "Jogadores", selo "4 / 10" e fio abaixo | same | |
| painel direito: "Mínimo 2 para iniciar" | same | nada, pela tabela de diferenças |
| lista: duas colunas de 5 linhas, preenchidas em linhas alternadas (Ana, Beto / Caio, Duda) | same | |
| linha da Ana: quadrado com a inicial, apelido, coroa, "ANFITRIÃO(Ã)", troféu e "2 vitórias", borda na cor do jogador | same | nota: coroa e troféu em desenho chapado e dourado; na capture, emoji colorido |
| linha do Beto: quadrado, apelido, troféu e "1 vitória", borda na cor do jogador | same | |
| linha do Caio: esmaecida, sem borda colorida, "DESCONECTADO" à direita | same | |
| linha da Duda: "ESPECTADOR(A)" na cor dela, sem troféu | same | round 2: troféu e "0 vitórias" na cor dela, como as outras linhas, pela tabela de diferenças (AD-023) |
| vagas: "Vaga Livre #5" a "#10", com o número num quadrado e borda tracejada | same | nota: tracejado mais fino |
| "CONFIGURAÇÕES" | same | |
| chips, 1ª fila: Grade 4x4, Tempo 2 min, 3 rodadas, Mín. 3 letras, com ícones | same | |
| chips, 2ª fila: Palavrões filtrados, Português (BR), com ícones | same | sem "Fast mode desligado", pela tabela de diferenças |
| rodapé em faixa: ponto laranja e "Aguardando Ana iniciar a partida…" | same | |

### `captures/tv-round.running.png`

Estado: rodada 1 de 3 com 10 jogadores; 14, 11, 8, 7, 6, 5, 4, 3, 2 e 1 palavras jogadas com gestos reais; Caio com a página fechada.

| Element | Result | Picture draws |
| --- | --- | --- |
| header: logo "B" e "BWords" à esquerda | same | |
| cartão: "CÓDIGO DA SALA", código em laranja e QR pequeno | same | QR real, pela tabela de diferenças |
| coluna esquerda: 5 cartões (Ana, Beto, Caio, Duda, Lucas) | same | |
| coluna direita: 5 cartões (Mariana, Pedro, Camila, Rafael, Bia) | same | |
| cartão: círculo com a inicial, apelido à esquerda, número e "palavras" à direita, número na cor do jogador | same | |
| Ana: coroa e selo "ANFITRIÃO(Ã)" | same | nota: coroa em desenho chapado |
| Caio: apelido esmaecido, selo "DESCONECTADO" | same | nota: o cartão esmaece menos que na capture; a borda e o círculo seguem visíveis, e o "8" fica na cor do jogador, não em cinza |
| Bia: "1" e "palavra" no singular | same | |
| barra central: "RODADA 1 DE 3" à esquerda, relógio azul à direita | same | |
| tabuleiro: 4x4, peças escuras arredondadas com a letra branca, dentro de um painel arredondado | same | |
| nenhuma palavra da rodada na tela | same | |

### `captures/tv-words.running.png`

Estado: palavras da rodada no meio da rolagem, com as 57 palavras da mesma rodada.

| Element | Result | Picture draws |
| --- | --- | --- |
| header: logo "B" e "BWords" à esquerda | same | |
| header: "Palavras · Rodada 1 de 3" à direita | same | |
| cartão: código e QR, sem o rótulo "CÓDIGO DA SALA" | same | |
| faixa fixa: total em laranja e "palavras possíveis" à esquerda, total em azul e "palavras encontradas" à direita | same | números com cerca de 48 px, pela tabela de diferenças; a faixa fica mais alta por isso |
| lista central, mais estreita que a tela | same | |
| linha: palavra em maiúsculas à esquerda, círculos com a inicial e pontos à direita | same | |
| linhas em comum: dois círculos, pontos em branco | same | |
| listras alternadas nas linhas | same | a listra segue a posição na lista |
| faixa "Palavras Únicas" com o chip laranja "PONTOS EM DOBRO" | same | |
| faixa: "APENAS 1 JOGADOR" | same | nada, pela tabela de diferenças |
| linhas únicas: um círculo, pontos em laranja-claro | same | |
| grafias reais entre parênteses, ao lado da palavra | same | "(aos, aós)", "(auô)", e também nas comuns |
| esmaecimento da lista em cima e embaixo | same | |

### `captures/tv-round-result.running.png`

Estado: resultado da rodada 1 de 3, depois de a TV passar sozinha por "Tempo!" e pela rolagem, com todas as peças da palavra mais longa acesas.

| Element | Result | Picture draws |
| --- | --- | --- |
| header: logo "B" e "BWords" à esquerda | same | |
| header: "Resultado · Rodada 1 de 3" à direita | same | |
| cartão: "CÓDIGO DA SALA", código em laranja e QR | same | QR real, pela tabela de diferenças. Nota: QR de cerca de 80 px, contra 48 px na capture, e cartão mais alto |
| painel esquerdo: tabuleiro 4x4 centralizado, num fundo mais escuro | same | |
| peças da palavra mais longa em laranja, as outras escuras | same | 7 de 7 acesas |
| cartão da palavra: barra laranja à esquerda, "A maior palavra do tabuleiro", palavra grande | same | |
| cartão da palavra: selo "Ana encontrou!" à direita | same | |
| "Classificação da Partida" e "Após Rodada 1" | same | |
| 3 cartões do pódio em fila, com a borda de cima na cor do jogador, apelido, posição e pontos | same | |
| cartão da Ana: coroa | same | nota: coroa em desenho chapado |
| cartão da Ana: confete | same | sem confete, pela tabela de diferenças: só na última rodada |
| cartão do Caio: "(offline)" em itálico | same | "(desconectado)", pela tabela de diferenças; cabe na linha |
| painel dos demais: 4º a 10º em duas colunas, preenchidas em linhas alternadas, com posição, círculo, apelido e pontos | same | |
| 10º sozinho na última fila, espaço livre abaixo | same | |
| rodapé centralizado: ponto laranja e "Aguardando Ana avançar…" | same | |
