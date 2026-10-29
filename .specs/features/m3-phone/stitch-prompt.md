# Prompt de correção para o Stitch (telas do celular)

## Parte 1 - Corrigir as 5 telas de celular

Corrija as 5 telas de celular (Entrada do Jogador, Lobby do Anfitrião, Tabuleiro do Jogador, Resultado da Rodada, Pódio e Fim de Partida). Mantenha o design system, as cores, as fontes, a largura de 390 px, o tema escuro e a composição geral. Mude só o que está abaixo.

**Regras para todas as telas de celular:**

1. Remova a barra de abas inferior (Jogo/Placar/Letras/Chat e Sala/Placar/Perfil/Regras). Nenhuma tela tem navegação por abas.
2. Remova os títulos de página ("Sala De Espera", "Game Controller", "Placar Da Rodada"). O topo de toda tela tem só a etiqueta "SALA KBXT" à esquerda e, à direita, o ícone de pessoa (abre as preferências). Nas telas do anfitrião, ponha também um botão de menu (⋮) ao lado do ícone.
3. Troque toda foto de avatar por um círculo na cor do jogador com a inicial do apelido em branco e negrito ("A", "B", "C", "D").
4. Remova todos os textos de enfeite. Saem: "Party Game", "Competidor Oficial", "Modo Casual", "ONLINE", "TV Conectada", "Conexão estável com a TV da sala", "Comando total da TV", "Edição ao vivo", "Pronto", "Toque para gerenciar", "Torcendo da TV", "Reconectando ping alto", "ritmo médio", "Top 1 da Rodada", "Partida concluída" e "Espetacular, Ana! O tabuleiro foi todo seu.". Troque "Sinal fraco" pela etiqueta "desconectado" e deixe essa linha do jogador esmaecida.
5. Use "Espectador(a)" como etiqueta de quem está assistindo.
6. Layout só com flexbox e margens, sem CSS Grid e sem `gap`. Botões com pelo menos 48 px de altura.

**Entrada do Jogador:**

- No topo, deixe só o logo "BWords" (sem "Party Game") e a etiqueta "SALA KBXT".
- Seletor de cor: uma linha que rola na horizontal com 10 cores e uma 11ª opção "personalizada" (círculo com ícone de conta-gotas ou arco-íris). As cores já usadas aparecem bloqueadas, com o apelido do dono embaixo. As livres não têm texto embaixo (remova "Livre").
- Prévia "Como você aparecerá na TV": círculo azul com "B" e o apelido "Beto". Remova "Pronto" e "Competidor Oficial • 0 pts".
- Card de regras: título "Regras Desta Partida", sem "Modo Casual".
- Remova "Conexão estável com a TV da sala" embaixo do botão.

**Lobby do Anfitrião:**

- Remova o cartão "Próxima batalha · Caça-Palavras" com a imagem.
- Troque o cartão "Você é a anfitriã / Comando total da TV" por uma etiqueta simples "VOCÊ É O ANFITRIÃO" logo abaixo do topo; o menu (⋮) fica no topo.
- "Regras da Partida" sem "Edição ao vivo". Tire os subtítulos "Cronômetro compartilhado" e "Disputa pelo pódio".
- Lista "Jogadores": título sem "Prontos para jogar". Cada linha tem o círculo com a inicial, o apelido, as vitórias (troféu + número) e a coroa ao lado de quem tem mais vitórias. Ana tem a etiqueta "VOCÊ" e a etiqueta "anfitriã". Caio fica esmaecido com "desconectado". Duda tem "Espectador(a)". Remova "Pronto", "Toque para gerenciar", "Anfitriã da sala" (como subtítulo), "Reconectando ping alto" e "Torcendo da TV".
- Desenhe também, numa segunda versão da tela, a folha de baixo que abre ao tocar em Beto, com "Tornar anfitrião" e "Remover da sala" (texto vermelho).

**Tabuleiro do Jogador:**

- Remova "ONLINE", "Game Controller" e a segunda etiqueta "SALA KBXT" dentro da barra do timer.
- A barra do timer fica com: ícone de relógio, "01:47", "Rodada 1/3" e, à direita, "12 pal · 18 pts".
- Remova os números de pontos do canto das peças. Cada peça tem só a letra ("Qu" numa peça só).
- Remova os botões "Apagar" e "Enviar Palavra". A palavra é enviada ao soltar o dedo, então o tabuleiro fica maior e a lista "PALAVRAS ENCONTRADAS" sobe para logo abaixo dele.
- Mantenha a palavra em formação "CASA" em peças acesas e a pílula "VÁLIDA (+2 PTS)".
- Desenhe também mais três versões só da área do feedback: "INVÁLIDA" em vermelho, "JÁ ENCONTRADA" em amarelo e "MUITO CURTA" em cinza.

**Resultado da Rodada:**

- Remova o título "Sala De Espera" e "TV Conectada".
- Mantenha "Rodada 1 de 3 • RESULTADO", o cartão "OLHE PARA A TV" e o cartão "DESEMPENHO DA RODADA".
- Nas palavras: CORACOES com "ÚNICA ×2 (+16 pts)" e "base +8"; CASA, QUERO e LUA com o subtítulo "em comum" (sem "(3 jogadores)", "(todos)" ou "palavra válida").
- "PLACAR RÁPIDO DA MESA" sem "4 na sala"; troque os avatares e a coroa por posição + círculo com a inicial.
- Mantenha "PRÓXIMA RODADA (2 DE 3)" e "Voltar ao Lobby".

**Pódio e Fim de Partida:**

- Remova a seta de voltar, o título "Placar Da Rodada", "Partida concluída" e "FIM DE JOGO" no topo.
- No destaque, troque o avatar por um círculo laranja grande com "A". Mantenha "Você ficou em 1º Lugar!", "PONTUAÇÃO TOTAL 46 pts" e "NA SESSÃO 3 vitórias". Remova "Espetacular, Ana! O tabuleiro foi todo seu.".
- "SEU RENDIMENTO": mantenha só "28 Palavras encontradas". Remova "+1.4/s ritmo médio" e "Top 1 da Rodada".
- "MAIOR PALAVRA ENCONTRADA": as peças ficam sem acento, C O R A C O E S, com a grafia "(corações)" ao lado, "+16 PTS" e "8 letras".
- "CLASSIFICAÇÃO DA MESA": troque os avatares por círculos com a inicial; Duda com "Espectador(a)".
- Troque a nota "Você é a anfitriã da sala KBXT..." por nada. Mantenha "JOGAR DE NOVO", "Voltar ao Lobby" e "ENCERRAR SALA".

## Parte 2 - Telas que faltam (mesmo estilo, 390 px, tema escuro, sem título de página)

1. **Lobby do participante (Beto, depois de entrar):** topo com "SALA KBXT" e o ícone de pessoa; cartão "Você" com o círculo azul "B", "Beto" e "🏆 1"; a lista de jogadores igual à do anfitrião, sem ações; os chips "Tabuleiro 4x4", "2:00 min", "3 Rodadas", "Mín. 3 letras"; e a mensagem "Aguardando Ana iniciar a partida..." com três pontinhos animados. Sem botão principal.
2. **Entrar numa sala:** logo "BWords", título "Entrar numa sala", quatro caixas grandes com "K B X _" (a quarta com o cursor), botão "Continuar" embaixo. Uma segunda versão com o erro "Sala não encontrada" embaixo das caixas.
3. **Contagem:** tela cheia, "Rodada 1 de 3" no topo e o número "3" gigante no centro.
4. **Espectador na rodada:** a tela do tabuleiro esmaecida, com a faixa "Você entra na próxima rodada. Assistindo…" sobre o tabuleiro, o timer visível e, no lugar das palavras encontradas, a lista de jogadores (círculo, apelido), sem números.
5. **Removido da sala:** ícone neutro (não vermelho), "Você foi removido da sala" e o botão "Entrar em outra sala".
6. **Sala encerrada:** "Ana encerrou a sala", "Obrigado por jogar!" e o botão "Entrar em outra sala".
7. **Reconectando:** a tela do tabuleiro com uma faixa fina no topo "Reconectando…" e um indicador girando. Uma segunda versão com a faixa "Sem conexão" e o botão "Tentar de novo".
8. **Preferências:** uma folha de baixo com dois interruptores, "Vibrar" e "Som ao acertar", os dois desligados.
9. **Confirmação:** um diálogo "Remover Beto? Ele perde os pontos." com "Cancelar" e "Remover" (vermelho).
