# Prompt de correção para o Stitch - telas da TV

Refaça as telas de TV abaixo para caberem exatamente em 1920x1080. Mantenha o design system "BWords Party System", as cores, a fonte Nunito e o tema escuro. Cada tela é uma única imagem 16:9.

## Regras para todas as telas de TV

1. **Tamanho fixo:** cada tela tem 1920 px de largura e 1080 px de altura, e todo o conteúdo cabe nela. Sem rolagem e sem nada abaixo de 1080 px. A altura da tela é fixa (`h-screen overflow-hidden`). Se faltar espaço, reduza os cartões, nunca aumente a página.
2. **Margem de segurança:** deixe 96 px livres nas laterais e 54 px em cima e embaixo. Nenhum texto fica nessa faixa.
3. **Sem interação:** a TV não tem botões, cursor nem foco. Não desenhe botões, abas, menus nem ícone de perfil.
4. **Legível a 3 metros:** nenhum texto menor que 24 px. Pouca informação por tela, letras grandes.
5. **Nenhum texto ou ícone de enfeite.** Não use "ARENA TV", "AO VIVO", "TEMPO REAL", "TRANSMISSÃO", "EDIÇÃO FESTA EM FAMÍLIA", "Display 1080p", "Sem controle remoto", "Servidor Conectado", "60 FPS", "10-Foot Experience", "Visualização Segura", "Tabuleiro sincronizado", "Conectados à rede local", "PARTIDA RÁPIDA", "Pronto", "Pronta", "Instável", "Estreante", "Entrou atrasada", "Descobrindo conexões", "Digita rápido" nem frases de incentivo.
6. **Peças sem pontos:** as peças do tabuleiro mostram só a letra, sem número no canto. A peça "Qu" é igual às outras, sem borda ou cor especial.
7. **Gênero neutro:** use "ANFITRIÃO(Ã)" e "ESPECTADOR(A)". Nunca "anfitriã" nem "espectadora". O rodapé é sempre "Aguardando Ana…", sem dizer "a anfitriã".
8. **Coroa:** o ícone 👑 marca só quem tem mais vitórias na sessão. Aparece uma vez, ao lado do apelido. Nunca indica posição nem placar.
9. **Sem desfoque:** sem `backdrop-blur` nem manchas com `blur`. Fundos sólidos ou semitransparentes.
10. **Logo igual em todas as telas:** o quadrado laranja com "B" e o texto "BWords". Sala sempre em "SALA KBXT".
11. **Endereço:** onde houver endereço, escreva `bwords.exemplo`. Nunca "bwords.live" nem "bwords.app".
12. **Sem regras inventadas:** nada de "Pontuação em dobro nos 30s finais", "Agilidade", "Combo Máximo", "Potencial teórico", "% no tabuleiro" nem "Vocabulário Oficial".

## Dados de exemplo (use exatamente estes em todas as telas)

- **Jogadores:** Ana laranja, anfitrião(ã), 2 vitórias, com coroa. Beto azul-claro, 1 vitória. Caio verde, 0 vitórias, desconectado. Duda rosa, 0 vitórias, espectador(a).
- **Tabuleiro 4x4:**
  ```
  C  A  S  A
  Qu E  R  O
  T  I  N  S
  L  U  A  M
  ```
- **Regras da sala:** 4x4, 120 s, 3 rodadas, mínimo de 3 letras, palavrões filtrados, Português (BR).
- **Palavras em comum:** LUA +1 (Ana, Beto e Caio), CASA +2 (Ana e Beto), QUERO +3 (Ana e Beto).
- **Palavras únicas:** Caio: TIA +2. Beto: NUA +2, RINS +4. Ana: SERIA +6, com as grafias "(seria, séria)", e TERNOS +8.
- **Placar da rodada 1:** Ana +20, total 34. Beto +12, total 25. Caio +3, total 16.

## TV - Lobby da Sala

Duas colunas, sem cabeçalho alto.

- **Esquerda (~40%):** "Entre pelo celular", o QR grande num cartão branco, com um "B" laranja no centro, e o código "K B X T" em letras enormes numa única linha. Embaixo, "ou acesse bwords.exemplo e digite o código".
- **Direita (~60%):**
  - "Jogadores" e "4 / 10".
  - Duas colunas de 5 cartões baixos, 10 no total. Ana com coroa, "ANFITRIÃO(Ã)" e "🏆 2 vitórias". Beto com "🏆 1 vitória". Caio esmaecido, com "DESCONECTADO". Duda com "ESPECTADOR(A)". Os outros 6 são vagas pontilhadas, com "Vaga Livre #5" e assim por diante, sem subtítulo.
  - Painel "Configurações" em chips de uma ou duas linhas: Grade 4x4, Tempo 2 min, 3 rodadas, Mín. 3 letras, Palavrões filtrados, Português (BR).
- **Rodapé:** "Aguardando Ana iniciar a partida…".

## TV - Rodada em Andamento

- **Esquerda:** o tabuleiro quadrado, ocupando quase toda a altura disponível (~900 px).
- **Direita:**
  - **No topo:** "RODADA 1 DE 3" e o timer "1:44" grande, com anel de progresso.
  - **Lista "Jogadores":** só com quem está jogando. Cada linha tem círculo, apelido e número grande com "palavras": Ana 14, com coroa e "ANFITRIÃO(Ã)"; Beto 11; Caio 8, esmaecido com "DESCONECTADO". Sem apelido riscado.
  - **Grupo "Assistindo":** só "Duda", com o círculo dela.
- **Canto inferior:** "SALA KBXT" pequeno. Sem QR nesta tela e sem cabeçalho com logo grande.

## TV - Resultado da Rodada

Uma tela só, com todo o resultado à vista de uma vez, como na versão atual desta tela. Sem etapas: tire "ETAPA ATIVA EM APURAÇÃO", "ETAPA 1", "(CONCLUÍDA)", "A seguir" e "BÔNUS ATIVO".

- **Topo:** "Resultado · Rodada 1 de 3" e "SALA KBXT". Sem abas e sem um segundo cabeçalho.
- **Esquerda (~35%):**
  - O tabuleiro em tamanho médio, com as peças T, E, R, N, O, S acesas em laranja e uma linha ligando nessa ordem (T da linha 3, E e R da linha 2, N da linha 3, O da linha 2, S da linha 3).
  - Abaixo, o cartão "A maior palavra do tabuleiro": TERNOS e "Ana encontrou!" em laranja.
- **Direita (~65%), de cima para baixo:**
  - **Placar:** um cartão por jogador, na ordem do placar, com a faixa superior na cor do jogador. Ana "1º", "+20 na rodada", 34 pts; Beto "2º", "+12 na rodada", 25 pts; Caio "3º", "+3 na rodada", 16 pts. Duda não aparece.
  - **"Palavras únicas" e "pontos em dobro":** um bloco por jogador: círculo, apelido e chips na cor dele. Ana: "SERIA (seria, séria) +6", "TERNOS +8". Beto: "NUA +2", "RINS +4". Caio: "TIA +2".
  - **"Palavras em comum":** chips da menor para a maior, cada um com a palavra, as bolinhas nas cores de quem achou e os pontos. LUA +1, CASA +2, QUERO +3.
- **Canto inferior direito:** QR pequeno com "Chegou agora? Entre para a próxima rodada" e "KBXT".
- **Rodapé:** "Aguardando Ana avançar…".

## TV - Pódio e Fim de Partida

- **Título numa linha só:** "Ana venceu!". Sem o emoji de confete 3D. Confete simples em volta do 1º lugar.
- **Três blocos de alturas diferentes:** 1º no meio, 2º à esquerda, 3º à direita. Cada um com círculo grande, apelido e pontos: Ana 54 pts, com a coroa; Beto 42 pts; Caio 28 pts. Nos blocos, só a posição: sem "Vencedora Supremo", sem contagem de palavras e sem barras de progresso.
- **Abaixo:** uma linha compacta "4º Duda 16 pts".
- **Faixa "Vitórias da sessão":** Ana 🏆 3 com coroa, Beto 🏆 1, Caio 🏆 0, Duda 🏆 0, em uma única linha. Tire "RODADA 4 DE 5".
- **Rodapé:** "Aguardando Ana: jogar de novo, voltar ao lobby ou encerrar".
- **Tire:** "RESULTADO FINAL DA RODADA", "Que disputa eletrizante...", "MAIOR PALAVRA ENCONTRADA", "TOTAL DA SESSÃO CONJUNTA" e "CONTROLE NO CELULAR".

## Telas novas (mesmo estilo, 1920x1080)

1. **TV - Contagem Regressiva:** tela cheia, "RODADA 1 DE 3" no topo e o número "3" gigante (~500 px) no centro. Sem tabuleiro. "SALA KBXT" pequeno no canto.
2. **TV - Tempo Esgotado:** a Rodada em Andamento com o timer em "0:00", o tabuleiro esmaecido e "Tempo!" grande sobre ele.
3. **TV - Lobby Vazio:** o Lobby da Sala sem jogadores: "0 / 10", as 10 vagas pontilhadas, "Ninguém entrou ainda" e o rodapé "O primeiro a entrar vira anfitrião(ã)".
4. **TV - Áudio Bloqueado:** o Lobby da Sala com um aviso discreto em um canto: "Aperte OK no controle para liberar o som".
5. **TV - Reconectando:** a Rodada em Andamento com uma faixa fina no topo, "Reconectando…", com um indicador girando.
6. **TV - Sala Expirada:** só o logo, "Sala expirada" e "Aperte OK no controle para abrir uma sala nova".
