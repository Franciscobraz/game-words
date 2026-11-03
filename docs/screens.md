# BWords — Descrição das telas para gerar o layout

Este documento descreve o layout das telas para servir de prompt a uma IA geradora de telas. Ele segue o [DESIGN.md](DESIGN.md). Itens marcados com **(sugestão)** não estão no DESIGN e podem ser trocados.

**Como usar:** cole a seção **Base visual** junto com a seção da tela que você quer gerar. Cada tela traz o objetivo, a área de tela, as regiões de cima para baixo, os estados e dados de exemplo.

---

## Base visual (vale para todas as telas)

- **Jogo:** BWords, de encontrar palavras num tabuleiro de letras. Uma TV mostra o jogo, e cada jogador usa o próprio celular como controle. O clima é de festa em família: alegre, letras grandes, pouca informação por tela.
- **Idioma da interface:** português do Brasil.
- **TV:**
  - Base de 1920×1080, que precisa funcionar também em 1280×720.
  - Fundo escuro, alto contraste, legível a 3 metros de distância. Não há interação: a TV não tem botões, cursor nem foco.
  - Margem de segurança de ~5% nas bordas (algumas TVs cortam a borda da imagem).
- **Celular:**
  - Retrato, entre 360 e 430 px de largura. Controle com o polegar: botões grandes (mínimo de 48 px), ações principais na metade de baixo.
  - Tema claro e escuro automáticos (gerar os dois).
- **Cor do jogador:** cada jogador tem uma cor própria, escolhida por ele. Ela aparece como uma bolinha ou etiqueta ao lado do apelido em todas as telas, e no tabuleiro marca o caminho que ele está formando. As cores são sempre legíveis sobre o fundo escuro.
- **Peças do tabuleiro:** quadradas, com cantos arredondados e uma letra maiúscula grande, centralizada, sem acento nem Ç. Existe a peça composta "Qu", que mostra as duas letras na mesma peça.
- **Coroa:** um ícone de coroa ao lado do nome de quem tem mais vitórias na sessão (todos, se houver empate).
- **Tipografia:** uma única fonte arredondada e amigável (Nunito, ou Inter como alternativa).
- **Restrições técnicas** (para quando a IA gerar código):
  - Preact + CSS. Layout só com flexbox e margens: sem CSS Grid e sem a propriedade `gap`.
  - Animações só com `transform` e `opacity`. Sem `blur` nem `box-shadow` animados.
  - Cores centralizadas em tokens (variáveis CSS), para permitir trocar o tema.

**Dados de exemplo** (usar em todas as telas):

| Jogador | Cor | Vitórias | Observação |
|---|---|---|---|
| Ana | laranja | 2 (coroa) | anfitriã |
| Beto | azul-claro | 1 | |
| Caio | verde | 0 | desconectado |
| Duda | rosa | 0 | entrou atrasada (espectadora) |

- Código da sala: **KBXT**.
- Tabuleiro 4x4: `C A S A / Qu E R O / T I N S / L U A M`.
- Configurações: 4x4, 120 s, 3 rodadas, mínimo de 3 letras, filtro de palavrões ligado, Português (BR).

---

## 1. Lobby da TV

**Objetivo:** convidar as pessoas a entrar e mostrar quem já está na sala e como a partida está configurada.

**Layout (1920×1080), em duas colunas:**

- **Coluna da esquerda (~40%): entrada.**
  - Título curto: "Entre pelo celular".
  - **QR code grande** (~420 px), em um cartão branco para garantir a leitura.
  - Embaixo, o **código da sala** em letras enormes e espaçadas ("K B X T"), com o texto "ou acesse <host>/KBXT", com o host em que a TV está aberta (AD-025).
- **Coluna da direita (~60%): sala.**
  - **Lista de jogadores** (até 10), um por linha: bolinha da cor, apelido, número de vitórias (ex.: "🏆 2") e a coroa para quem lidera. A anfitriã tem uma etiqueta "anfitriã".
  - Jogador desconectado aparece **esmaecido** (opacidade baixa), com um ícone de sinal cortado.
  - Contador "4 / 10 jogadores".
  - Linhas vazias (pontilhadas) até 10, para mostrar que ainda cabe gente **(sugestão)**.
  - **Painel de configurações** (abaixo da lista, ou como uma faixa no rodapé): tabuleiro, tempo, rodadas, mínimo de letras, palavrões, idioma. Os valores ficam em "chips" grandes. Quando o anfitrião muda um valor no celular, o chip correspondente pisca ou pulsa por um instante.
- **Rodapé:** "Aguardando a anfitriã (Ana) iniciar a partida".

**Estados:**

- **Sala vazia:** a lista mostra "Ninguém entrou ainda", e o rodapé, "Quem entrar primeiro vira anfitrião(ã)".
- **Áudio bloqueado pelo navegador:** um aviso discreto: "Aperte OK no controle para liberar o som".
- **Depois de uma partida** (voltando ao lobby): as vitórias e a coroa já estão atualizadas.

---

## 2. Lobby do celular (participante)

**Objetivo:** entrar na sala com apelido e cor, e depois esperar a partida começar.

### 2a. Entrada (antes de entrar na sala)

- **Topo:** logo pequeno do BWords e o código da sala ("Sala KBXT"). Quem abriu `/join`, sem o QR, vê antes a entrada pelo código (§11).
- **Campo "Seu apelido"**, de 2 a 12 caracteres, com um contador. Erro embaixo do campo: "Esse apelido já está em uso".
- **Seletor de cor:**
  - Uma linha de 10 bolinhas sugeridas e uma 11ª, "personalizada" (abre a roda de cores).
  - Cores já usadas por outros jogadores aparecem riscadas ou esmaecidas.
  - Se a cor escolhida for parecida demais com a de alguém, aparece o aviso "Muito parecida com a cor de Beto", e o seletor fica aberto.
- **Prévia:** como o nome vai aparecer na TV (bolinha + apelido).
- **Botão principal fixo embaixo:** "Entrar".

### 2b. Esperando no lobby

- **Topo:** "Sala KBXT" e um ícone de engrenagem que abre as **preferências** (vibrar e som ao acertar). A opção de vibrar não aparece no iPhone.
- **Cartão "Você":** bolinha da cor, apelido grande, vitórias. Botão pequeno "Editar" para trocar o apelido ou a cor **(sugestão)**.
- **Lista de jogadores:** a mesma da TV, em versão compacta (cor, apelido, vitórias, coroa, desconectados esmaecidos).
- **Configurações da partida:** só leitura, em uma linha de chips ("4x4 · 2 min · 3 rodadas · mín. 3 letras").
- **Mensagem central:** "Aguardando Ana iniciar a partida…", com uma animação leve.

A contagem regressiva e as telas de passagem do celular (código digitado, removido da sala, sala encerrada, reconectando) estão nas seções 10 e 11.

---

## 3. Lobby do anfitrião (celular)

**Objetivo:** tudo o que o participante vê, e mais o controle da sala.

- **Topo:** igual ao do participante, com uma etiqueta "Você é o anfitrião".
- **Painel de configurações editável**, com controles grandes para o polegar:
  - Tabuleiro: botões segmentados 4x4 / 5x5 / 6x6.
  - Tempo da rodada: um seletor de 30 s a 180 s, de 30 em 30 (botões − e + com o valor no meio, ex.: "2:00").
  - Rodadas por partida: − / + de 1 a 5.
  - Tamanho mínimo da palavra: segmentado 3 / 4.
  - Filtrar palavrões: interruptor (ligado).
  - Dicionário: um seletor com "Português (BR)" (a única opção no MVP).
  - Volume da TV: um controle deslizante e um botão de mudo.
  - Música: interruptor, ligado numa sala nova; desliga as músicas da TV, e os efeitos continuam (AD-028).
- **Lista de jogadores com ações:** ao tocar num jogador, abre uma folha de baixo (bottom sheet) com "Tornar anfitrião" e "Remover da sala". Remover pede confirmação ("Remover Beto? Ele perde os pontos.").
- **Botão principal fixo embaixo:** "Iniciar partida". Fica desabilitado com uma dica se não houver jogadores suficientes **(sugestão: definir o mínimo)**.
- **Menu (⋮) no topo:** "Encerrar sala", com confirmação.

---

## 4. Rodada em andamento na TV

**Objetivo:** mostrar o tabuleiro grande e a tensão da disputa sem revelar as palavras.

**Antes da rodada:** a contagem "3, 2, 1" em tela cheia, com números gigantes. O tabuleiro aparece no "já!".

**Layout (1920×1080):**

- **Centro-esquerda: tabuleiro grande**, ocupando quase toda a altura (~900 px num 4x4; as peças diminuem no 5x5 e no 6x6). Na TV não há caminho desenhado: as peças ficam paradas.
- **Topo, sobre o tabuleiro ou à direita:**
  - **Timer** grande, em contagem regressiva ("1:47"), com uma barra ou um anel de progresso. Nos **últimos 10 s**, ele muda para uma cor de alerta e pulsa.
  - "Rodada 1 de 3".
- **Coluna da direita: jogadores ao vivo.** Uma linha por jogador: cor, apelido e o **número de palavras** encontradas ("12 palavras"), sem mostrar quais são. O número dá um "pulo" quando aumenta. A lista traz só quem joga a rodada, sem os espectadores. Desconectados ficam esmaecidos.
- **Topo:** o código da sala e um QR pequeno (AD-022).

**Estado de fim:** quando o tempo acaba, o timer mostra "0:00", o tabuleiro fica esmaecido e "Tempo!" aparece sobre ele, por 2 s. Depois a tela vai sozinha para a página de palavras (§8), e os celulares mostram "Olhe para a TV" (§13).

---

## 5. Tabuleiro no celular (ativo, anfitrião e espectador)

**Objetivo:** formar palavras deslizando o dedo pelas letras, com resposta instantânea.

**Layout (retrato), de cima para baixo:**

1. **Barra superior:**
   - Timer ("1:47"), que fica na cor de alerta nos últimos 10 s.
   - "Rodada 1/3".
   - Contador próprio: "12 palavras · 18 pts".
2. **Palavra em formação:** em letras grandes e maiúsculas ("CASA"). Ao soltar o dedo, a palavra vira o **feedback**, e o fundo pisca por ~0,5 s:
   - **✓ válida**, em verde, com os pontos ("+2");
   - **✗ inválida**, em vermelho, com uma leve tremida;
   - **"já encontrada"**, em amarelo ou cinza.
3. **Tabuleiro:**
   - Quadrado, com a largura da tela menos as margens.
   - Durante o deslize, as peças tocadas ficam acesas na **cor do jogador**, e uma linha liga os centros das peças, mostrando o caminho (incluindo diagonais).
   - A área de toque de cada peça é um pouco menor que a peça, para facilitar as diagonais.
   - Não pode rolar a tela nem dar zoom.
4. **Modo tocar letra por letra (alternativa):** ao tocar em vez de deslizar, a palavra vai se formando e aparecem os botões "Apagar" e **"Enviar"** logo abaixo do tabuleiro.
5. **Minhas palavras:** uma lista rolável embaixo (ou uma gaveta que sobe), da mais recente para a mais antiga: "CASA +2", "REIS +1".

### Variante: anfitrião

- Tudo igual ao jogador ativo, e mais um **menu (⋮) discreto** no topo com "Voltar ao lobby".
- Ao tocar, pede confirmação: "Cancelar a rodada? O placar será zerado."

### Variante: espectador (entrou durante a rodada)

- O tabuleiro aparece **esmaecido e travado**, sem reagir ao toque.
- Uma faixa sobre ele: "Você entra na próxima rodada. Assistindo…".
- O timer continua visível. No lugar de "Minhas palavras", aparece a lista de jogadores com o número de palavras de cada um, igual à da TV **(sugestão)**.

---

## 6. Pódio na TV

Esta tela saiu (AD-021). O fim da partida na TV é o resultado da última rodada (§8), com o vencedor e o confete.

---

## 7. Pódio no celular (todos)

**Objetivo:** mostrar ao jogador como ele foi, e ao anfitrião, o que fazer em seguida. Abre quando o anfitrião toca "Ver resultado" na última rodada, na mesma hora que o resultado na TV (AD-026), com o resumo pessoal somando também essa rodada.

**Para todos:**

- **Destaque pessoal no topo:** a posição do jogador em letras grandes ("Você ficou em 2º!"), com os pontos e as vitórias da sessão. Quem ganhou ganha confete.
- **Mini pódio:** uma lista dos três primeiros e depois os demais (posição, cor, apelido, pontos), com a linha do próprio jogador destacada.
- **Resumo pessoal (sugestão):** total de palavras e a maior palavra encontrada.
- **Espectador** (não jogou essa partida): só o pódio, sem o destaque pessoal, com a mensagem "Você joga na próxima partida".

**Só para participantes (não anfitriões):** a mensagem embaixo "Aguardando Ana decidir…".

**Só para o anfitrião:** três botões fixos embaixo, em ordem de importância:

1. **"Jogar de novo"** (principal): começa uma nova partida já, com os mesmos jogadores e configurações, e o placar zerado.
2. **"Voltar ao lobby"** (secundário): para esperar mais gente ou mudar as configurações.
3. **"Encerrar sala"** (texto vermelho, com confirmação).

---

## 8. Depois da rodada na TV (AD-021, AD-024)

**Objetivo:** mostrar todas as palavras encontradas e quem achou cada uma, e depois o placar. O mesmo fluxo vale para toda rodada. A lista anda sozinha, e o anfitrião conduz pelo celular: ▲ e ▼ movem a lista, e "Ver resultado" abre o resultado na TV e nos celulares. As captures binding são `tv-words.png` e `tv-round-result.png`, em `.specs/features/m4-1-playtest/captures/`.

**Grafias reais:** as palavras aparecem em maiúsculas sem acento, seguidas das grafias do dicionário em letra menor e mais clara: "FACA (faca, faça)", "CORACOES (corações)". Quando a única grafia é igual à palavra, não aparece nada a mais.

### 8a. Palavras da rodada

- **Topo:** o logo, "Palavras · Rodada 1 de 3", o código da sala e um QR pequeno.
- **Faixa que não rola:** o total de palavras possíveis e o de palavras encontradas.
- **Lista:** primeiro "Palavras em comum", depois "Palavras Únicas", com "pontos em dobro". Cada grupo vai da menor palavra para a maior e, no mesmo tamanho, em ordem alfabética.
- **Cada linha:** a palavra, as grafias reais, um círculo na cor de cada jogador que a achou, com a inicial, e os pontos ("+1").
- **Velocidade:** a lista sobe a altura de uma linha por segundo, sem limite de duração; uma lista que cabe no painel fica parada. Ela para com a última palavra inteira na tela e espera o anfitrião.
- **Destaque:** uma palavra por vez, a que passa pela linha de leitura no terço de cima do painel, fica destacada só com cor e escala, com um "check" curto. Numa lista parada, o destaque desce de palavra em palavra, uma por segundo. Quando o anfitrião toca ▲ ou ▼, o destaque some até o fim da lista.
- **Painel "Jogadores", à direita (AD-030):** um card por jogador da rodada, com o círculo e a borda na cor dele, o apelido, "14 palavras" da rodada inteira e os pontos, que começam em 0 e somam a cada palavra destacada, com uma animação na linha de quem pontuou. O painel se ordena pelos pontos, e cada card desliza inteiro até a posição nova. O 1º tem o fundo mais claro. Desconectado leva "DESCONECTADO" e fica esmaecido.
- **Ninguém achou nada:** "Nenhuma palavra encontrada", até o anfitrião tocar "Ver resultado".

### 8b. Resultado

Uma tela só, aberta pelo "Ver resultado" do anfitrião, que espera o anfitrião avançar.

- **Topo:** o logo, o título e o código da sala com um QR pequeno, sem rótulo.
- **Esquerda:** o cartão "A maior palavra do tabuleiro", com a palavra, as grafias reais e "Ana encontrou!" ou "Ninguém encontrou", e abaixo dele o tabuleiro da rodada, com as peças da maior palavra acendendo uma por vez, a cada 400 ms, sem linha ligando. Se o tabuleiro não tem palavra mais longa, não há peças acesas nem esse cartão.
- **Direita:** 1º, 2º e 3º em cartões da mesma altura e, do 4º em diante, uma lista, com posição, círculo, apelido, palavras e pontos: "14 plvrs · 34 pts", "1 plvr · 1 pt". Com até 3 jogadores, a lista some. Quem está desconectado leva "(desconectado)" ao lado do apelido.
- **Entre as rodadas:** "Classificação da Rodada 1", com as palavras e os pontos da rodada e a ordem por eles (AD-027). O título é "Resultado · Rodada 1 de 3", e o rodapé é "Aguardando Ana avançar…".
- **Última rodada:** "Classificação da Partida", com a soma da partida. O título é "Ana venceu!", ou "Empate!" se a partida empatar, com confete. O rodapé é "Aguardando Ana: jogar de novo ou voltar ao lobby".

---

## 9. Resultado da rodada no celular

**Objetivo:** enquanto a TV mostra o resultado, mostrar ao jogador o resumo dele e, ao anfitrião, o botão de avançar. A tela abre com o "Ver resultado" do anfitrião, junto com a TV (AD-026); antes dele, o celular mostra "Olhe para a TV" (§13). **(sugestão:** o DESIGN não detalha esta tela.)

**Para todos:**

- **Topo:** "Rodada 1 de 3 · Resultado".
- **Cartão pessoal:** os pontos da rodada em destaque ("+18 pts"), o total acumulado e a posição atual ("Você está em 2º").
- **Minhas palavras**, numa lista: cada palavra com os pontos, e as que eram só do jogador marcadas com uma estrela e "×2". As palavras aparecem com as grafias reais, como na TV.
- Um lembrete: "Olhe a TV para ver a revelação".

**Variante espectador:** no lugar do cartão pessoal, aparece "Você joga na próxima rodada!", com o placar dos jogadores.

**Só para o anfitrião:**

- **Botão principal fixo embaixo:** "Próxima rodada". Na última rodada esta tela não aparece: o "Ver resultado" abre o pódio (§7).
- Menu (⋮) com "Voltar ao lobby", que pede confirmação (cancela a partida e zera o placar).

**Só para participantes:** a mensagem embaixo "Aguardando Ana avançar…".

---

## 10. Contagem regressiva (TV e celular)

**Objetivo:** criar expectativa e garantir que todos vejam o tabuleiro ao mesmo tempo.

- **TV:** tela cheia, com "Rodada 1 de 3" no topo e os números **3, 2, 1** gigantes (~500 px) no centro, um por segundo. Cada número entra crescendo e some com fade. No `startsAt`, a tela vira a da rodada, sem um quadro "Já!" à parte.
- **Celular:** a mesma contagem, em tela cheia, com números grandes, e a lembrança "Prepare o dedo!" **(sugestão)**. No "Já!", o tabuleiro aparece.
- O tabuleiro **não pode aparecer antes do "Já!"**, nem na TV nem no celular.
- **Espectador:** vê a contagem e, depois, a sua tela de espectador.

---

## 11. Telas de passagem do celular

**Entrada pelo código digitado** (quem abriu `/join` sem escanear o QR, e quem toca "Entrar em outra sala"):

- Logo do BWords no topo e o título "Entrar numa sala".
- **Quatro caixas grandes**, uma por letra, que avançam sozinhas a cada letra digitada e abrem o teclado em maiúsculas.
- Botão "Continuar", que leva à tela de entrada (2a).
- Erro embaixo das caixas: "Sala não encontrada" ou "Essa sala está cheia (10 jogadores)".

**Removido da sala:**

- Ícone neutro (nada de alerta vermelho), com o título "Você foi removido da sala".
- Botão "Entrar em outra sala", que leva à entrada pelo código.

**Sala encerrada:**

- Título "A anfitriã encerrou a sala", com um "Obrigado por jogar!".
- Botão "Entrar em outra sala".

**Reconectando:**

- Uma faixa fina no topo, "Reconectando…", com um indicador girando.
- O jogador continua na tela em que estava (com o tabuleiro travado, se estiver numa rodada), sem perder o que já fez.
- Quando a conexão volta, a faixa fica verde por um instante ("Conectado") e some.
- Se demorar muito, a faixa vira "Sem conexão", com o botão "Tentar de novo".

---

## 12. Telas de passagem da TV

A TV não tem botões: tudo aqui acontece sozinho ou com "OK" no controle. As fotos estão em `.specs/features/m4-tv/captures/uncaptured/`.

**Não foi possível abrir a sala:** o texto no centro, e a TV tenta de novo a cada 5 s.

**Sala expirada:** logo no topo, "Sala expirada" no centro e "Aperte OK no controle para abrir uma sala nova". Sem rodapé, código nem QR. A TV não cria sala até alguém apertar uma tecla ou clicar.

**Sala encerrada pelo anfitrião:** a TV abre uma sala nova sozinha, sem tela própria.

**Aberta em outra aba:** logo no topo e "A TV foi aberta em outra aba" no centro. A TV para de reconectar, e nenhuma tecla muda nada.

**Conexão caída:**

- A tela atual fica, e o timer continua pelo relógio do servidor, com uma faixa fina no topo: "Reconectando…". Na rodada, a faixa fica logo abaixo do cartão do código, que continua inteiro à vista.
- Depois de 30 s sem reconectar, a faixa fica vermelha e vira "Sem conexão". A TV continua tentando, com esperas de 0,5 s, 1 s, 2 s, 4 s, 8 s, 16 s, 32 s e depois 60 s.
- Depois de 10 min, a TV para de tentar, e a faixa acrescenta "Aperte OK no controle para tentar de novo". Uma tecla ou um clique recomeçam as tentativas do início.
- Quando a conexão volta, a faixa some e a tela mostra o estado atual da sala.

---

## 13. Olhe para a TV (celular)

**Objetivo:** levar os olhos da sala para a TV enquanto as palavras da rodada passam lá (AD-026), e dar ao anfitrião o controle da lista (AD-024).

- Abre no "Tempo!" e fica durante toda a lista de palavras, para jogadores, espectadores e o anfitrião. Quem conecta ou reconecta nesse intervalo cai nela.
- **Centro:** "Olhe para a TV" em letras grandes e, abaixo, "As palavras da rodada estão passando lá".
- **Só para o anfitrião:** ▲ e ▼, que param a rolagem automática da TV e movem a lista meia altura do painel, e o botão principal "VER RESULTADO", que abre o resultado ou, na última rodada, o pódio, na TV e nos celulares ao mesmo tempo. Todos os alvos têm 48 px ou mais.
- O celular nunca recebe as palavras da rodada nesta tela.
