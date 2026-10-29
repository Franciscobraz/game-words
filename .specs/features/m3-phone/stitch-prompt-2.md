# Prompt de correção para o Stitch - rodada 2 (telas do celular)

Corrija as telas de celular abaixo. Mantenha o design system, as cores, a fonte, a largura de 390 px e o tema escuro. Mude só o que está listado.

## Regras para todas as telas de celular

1. Nenhum texto ou ícone de enfeite. Não use indicadores de conexão (ponto verde piscando, ícone de wi-fi, "ONLINE", "SINCRONIZADO", "conectados") nem status inventados ("Pronto", "Pronta", "Pronto na cabine", "Em jogo", "Espiando", "Aguardando vaga", "Dica da Rodada").
2. Use sempre a forma neutra de gênero: "Anfitrião(ã)" e "Espectador(a)". O selo do topo do anfitrião fica "VOCÊ É O(A) ANFITRIÃO(Ã)", e a etiqueta na lista fica "ANFITRIÃO(Ã)".
3. A coroa (👑) marca só quem tem mais vitórias na sessão. Ela aparece uma vez, ao lado do apelido. Nunca use a coroa para indicar posição ou placar.
4. Não use `backdrop-blur` nem manchas decorativas com `blur`. Use fundos sólidos ou semitransparentes.
5. Só o anfitrião tem o menu (⋮) no topo.
6. Mantenha as cores de exemplo dos jogadores: Ana laranja, Beto azul-claro, Caio verde, Duda rosa. Caio está desconectado e Duda é Espectador(a).

## Lobby do Anfitrião

- Recoloque no painel "Regras da Partida", depois de "Fast mode":
  - **Dicionário:** um seletor com a bandeira do Brasil e "Português (BR)".
  - **Volume da TV:** um controle deslizante com um botão de mudo ao lado.
- Embaixo do "Fast mode", acrescente a linha de explicação "Resultados rápidos, sem revelar palavra por palavra".
- Troque "VOCÊ É A ANFITRIÃ" por "VOCÊ É O(A) ANFITRIÃO(Ã)", e a etiqueta "ANFITRIÃ" por "ANFITRIÃO(Ã)".

## Lobby do Anfitrião (Ações do Jogador)

- Use como fundo, escurecido e sem blur, a versão atual do Lobby do Anfitrião (não a antiga).
- Mantenha a folha de baixo como está: Beto, "1 vitória na sessão", "Tornar anfitrião", "Remover da sala" e "Cancelar".

## Entrada do Jogador

- Tire o ponto verde piscando da etiqueta "SALA KBXT".
- Troque "Custom" por "Personalizada", embaixo do botão de conta-gotas.
- Use 10 cores bem diferentes entre si no seletor (laranja, azul-claro, verde, rosa, amarelo, roxo, vermelho, turquesa, lima e lilás), todas legíveis sobre o fundo escuro. As de Ana, Caio e Duda ficam bloqueadas com o nome embaixo.

## Lobby do Participante (Beto)

- Tire "Pronto na cabine" e "Fique atento à tela da TV da sala".
- Ana tem uma coroa só, ao lado do apelido, e a etiqueta "ANFITRIÃO(Ã)". Tire a coroa de cima do círculo.
- Mantenha o resto: cartão "Você" com "B", "Beto", "VOCÊ" e "🏆 1"; os chips das regras; a lista de jogadores; e "Aguardando Ana iniciar a partida" com os três pontinhos.

## Tabuleiro do Jogador

- Mostre um feedback só: a pílula "VÁLIDA (+2 PTS)" em verde. Tire as pílulas pequenas "Inválida", "Já encontrada" e "Muito curta" desta tela.
- Crie uma tela separada, "Celular - Feedbacks do Tabuleiro", só com a área da palavra em formação em quatro versões empilhadas:
  - "CASA" + "VÁLIDA (+2 PTS)" em verde;
  - "CSA" + "INVÁLIDA" em vermelho;
  - "CASA" + "JÁ ENCONTRADA" em amarelo;
  - "CA" + "MUITO CURTA" em cinza.
- Tire o `backdrop-blur` do topo e as duas manchas com blur atrás da palavra.

## Contagem Regressiva

- Tire "SINCRONIZADO", a pílula "Ana (Você) PRONTA" e o cartão "Olhe para a TV ou prepare-se para caçar palavras".
- Mantenha "RODADA 1 DE 3" no topo, a etiqueta "SALA KBXT", o número gigante e "Prepare o dedo!".
- Centralize o número e o texto na altura da tela, sem o círculo com brilho por trás do número.

## Entrar numa Sala (Código)

- Tire o teclado desenhado na tela. O celular usa o teclado do sistema, que fica fora do layout. Deixe espaço livre embaixo para ele.
- Tire o cartão "Dica da Rodada" e o ponto verde ao lado do logo.
- Mantenha o logo, "Entrar numa sala", "Digite o código de 4 letras exibido na TV", as quatro caixas "K B X _", o erro "Sala não encontrada" e o botão "CONTINUAR", logo abaixo das caixas.

## Espectador na Rodada

- Tire o menu (⋮) do topo, porque Duda não é anfitriã.
- Tire a pílula "ASSISTINDO" ao lado do timer. A faixa "Você entra na próxima rodada. Assistindo…" já diz isso.
- Na lista "JOGADORES NA SALA", troque "4 conectados" por "4 jogadores". Cada linha tem só o círculo, o apelido e as etiquetas que valem para ele: Ana "ANFITRIÃO(Ã)", Caio esmaecido com "DESCONECTADO" e Duda "VOCÊ" e "ESPECTADOR(A)". Tire "Em jogo", "Espiando", "Aguardando vaga" e as bolinhas verdes.
- Mantenha a barra de progresso do timer.

## Resultado da Rodada

- Ponha o subtítulo "em comum" em CASA e QUERO, como em LUA. Toda palavra mostra "ÚNICA ×2" ou "em comum".
- Tire a coroa do cartão "DESEMPENHO DA RODADA". Use no lugar um selo grande com a posição, "1º".
- Encurte o texto do cartão "OLHE PARA A TV" para "A revelação está na TV", para não cortar.
- Tire o rótulo "Pontuação" ao lado de "MINHAS PALAVRAS ENCONTRADAS (4)".

## Pódio e Fim de Partida

- Tire o ícone de wi-fi da etiqueta "SALA KBXT".
- A lista "CLASSIFICAÇÃO DA MESA" tem que aparecer inteira, com Duda visível acima dos botões fixos: acrescente um espaço embaixo da lista do tamanho da área dos botões.
- Troque a etiqueta "ANFITRIÃ" por "ANFITRIÃO(Ã)".

## Telas novas que ainda faltam (mesmo estilo, 390 px, tema escuro, sem título de página)

1. **Removido da sala:** um ícone neutro (porta ou mão acenando, em cinza, nada vermelho), o título "Você foi removido da sala" e o botão "Entrar em outra sala".
2. **Sala encerrada:** o título "Ana encerrou a sala", o texto "Obrigado por jogar!" e o botão "Entrar em outra sala".
3. **Reconectando:** a tela do Tabuleiro do Jogador com uma faixa fina no topo, "Reconectando…", com um indicador girando, e o tabuleiro esmaecido.
4. **Sem conexão:** a mesma tela, com a faixa "Sem conexão" e o botão "Tentar de novo" dentro da faixa.
5. **Preferências:** uma folha de baixo sobre o Lobby do Participante, com dois interruptores desligados, "Vibrar" e "Som ao acertar", e o botão "Fechar".
6. **Confirmação de remoção:** um diálogo central sobre o Lobby do Anfitrião, com "Remover Beto? Ele perde os pontos.", "Cancelar" e "Remover" (vermelho).
7. **Confirmação de voltar ao lobby:** um diálogo central sobre o Tabuleiro, com "Cancelar a rodada? O placar será zerado.", "Continuar jogando" e "Voltar ao lobby" (vermelho).
