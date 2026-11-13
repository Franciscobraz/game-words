# STATE

## Decisions

Decisões de projeto ficam em `docs/DESIGN.md` (inclui A1, §5.5) e nas tabelas de Assumptions de cada `spec.md`.

### AD-001 - Código em inglês, documentos em português

- **Data:** 2026-10-27
- **Decisão:** todo o código usa termos em inglês, inclusive o vocabulário do jogo: identificadores, tipos de mensagem, campos do protocolo, códigos de erro e motivos (`host`, `round`, `lobby`, `kicked`). Os documentos (`docs/`, `.specs/`) explicam em português, com os termos técnicos em inglês.
- **Motivo:** o idioma do jogo muda com o pacote de dicionário (pt-BR hoje, EN depois). O texto que o jogador vê sai do i18n da interface (DESIGN §5.1), nunca do código nem do protocolo.
- user: "o codigo deve ter todos os termos em ingles, mas pode manter a explicação dos documentos em portuguez"

### AD-002 - Sem barra de abas no celular (active)

- **Data:** 2026-10-29
- **Decisão:** as telas do Stitch desenham uma barra de abas embaixo (Jogo/Placar/Letras/Chat; Sala/Placar/Perfil/Regras). Ela sai: essas telas não existem e chat não está no MVP.
- **Motivo:** Pergunta 1 do M3: "Barra de abas embaixo [...] Tirar." Opção escolhida: tirar.
- user: "os outros ponto eu concordo"

### AD-003 - Sem pontos nas peças (active)

- **Data:** 2026-10-29
- **Decisão:** as peças do tabuleiro não mostram número de pontos. A pontuação é pelo tamanho da palavra (DESIGN §1.4).
- **Motivo:** Pergunta 2 do M3: "Pontos em cada peça do tabuleiro [...] Tirar." Opção escolhida: tirar.
- user: "os outros ponto eu concordo"

### AD-004 - Inicial na cor no lugar do avatar (active)

- **Data:** 2026-10-29
- **Decisão:** onde as telas do Stitch desenham foto de avatar, o celular mostra um círculo na cor do jogador com a inicial do apelido. Avatares estão fora do MVP (DESIGN §9).
- **Motivo:** Pergunta 3 do M3: "Avatares com foto [...] Trocar por um círculo na cor do jogador com a inicial." Opção escolhida: a recomendada.
- user: "os outros ponto eu concordo"

### AD-005 - Sem textos de enfeite (active)

- **Data:** 2026-10-29
- **Decisão:** todo texto das telas do Stitch sem dado por trás sai: "Party Game", "Competidor Oficial", "Modo Casual", o cartão "Próxima batalha · Caça-Palavras", "ONLINE", "TV Conectada", "Conexão estável com a TV da sala", "Comando total da TV", "Edição ao vivo", "Pronto", "Toque para gerenciar", "Torcendo da TV", "ritmo médio", "Top 1 da Rodada", "Espetacular, Ana!...", "Partida concluída" e "Sinal fraco / Reconectando ping alto" (vira "desconectado").
- **Motivo:** Pergunta 4 do M3: "Textos de enfeite sem dado por trás [...] Tirar todos." Opção escolhida: tirar todos, inclusive o indicador ONLINE.
- user: "Os textos de enfeite devem ser todos removidos"

### AD-006 - Sem títulos de tela no celular (active)

- **Data:** 2026-10-29
- **Decisão:** as telas do celular não têm título de página ("Sala De Espera", "Game Controller", "Placar Da Rodada"). O topo mostra só a etiqueta da sala.
- **Motivo:** Pergunta 5 do M3: "Títulos com defeito de geração [...] Tirar, ou usar o título certo de cada tela." Opção escolhida: tirar.
- user: "esses titutos nem precisam existir no celular como por exemplo \"placar da rodada\" , \"sala de espera\", \"game controller\""

### AD-007 - Resumo pessoal do pódio somado no celular (active)

- **Data:** 2026-10-29
- **Decisão:** o pódio do celular mostra o total de palavras e a maior palavra do jogador na partida, somados no próprio celular a partir dos resultados de cada rodada. A maior palavra aparece em peças sem acento, com a grafia real ao lado.
- **Motivo:** Pergunta 6 do M3: "Somar no celular a partir dos resultados de cada rodada e mostrar a maior palavra sem acento nas peças, com a grafia real ao lado." Opção escolhida: a recomendada.
- user: "os outros ponto eu concordo"

### AD-008 - "em comum" sem número de jogadores (active)

- **Data:** 2026-10-29
- **Decisão:** no resultado da rodada, palavra achada por mais de um jogador mostra só "em comum", sem "(3 jogadores)" nem "(todos)". O protocolo não diz quantos acharam.
- **Motivo:** Pergunta 7 do M3: "Mostrar só 'em comum'." Opção escolhida: a recomendada.
- user: "os outros ponto eu concordo"

### AD-009 - Só deslizar; envio ao soltar (active)

- **Data:** 2026-10-29
- **Decisão:** o celular forma palavras só deslizando o dedo; a palavra é validada e enviada ao soltar. Não existem os botões "Apagar" e "Enviar Palavra" nem o modo tocar letra por letra nesta primeira versão (diverge do DESIGN §3).
- **Motivo:** Pergunta 8 do M3: "Seguir a capture (sempre visíveis) e a lista de palavras em chips na horizontal." O user escolheu outra opção: tirar os botões e o modo tocar.
- user: "o apagar e o enviar palavra não precisam existir, assuma que o envio/validação da palavra ocorra ao tirar o dedo da tela, apenas o modo deslizar sobre a tela ficará disponivel nessa primeira versão."

### AD-010 - Só tema escuro (active)

- **Data:** 2026-10-29
- **Decisão:** o celular tem só o tema escuro, com as cores em tokens CSS. O tema claro automático do DESIGN §3 não é feito.
- **Motivo:** Pergunta 9 do M3: "Só escuro no M3, com cores em tokens. O tema claro vira pendência do M5." Opção escolhida: só escuro.
- user: "seguimos apenas com o tema escuro."

### AD-011 - Espectador sem contagem de palavras (active)

- **Data:** 2026-10-29
- **Decisão:** o celular do espectador mostra a lista de jogadores sem o número de palavras de cada um; o servidor continua mandando as contagens só para a TV.
- **Motivo:** Pergunta de escopo do M3: "mostrar a lista de jogadores sem os números, em vez de mudar o servidor no M3." Opção escolhida: a recomendada.
- user: "os outros ponto eu concordo"

### AD-012 - Telas atuais do Stitch como base (active)

- **Data:** 2026-10-29
- **Decisão:** as telas de celular do Stitch, como estão depois da rodada 2 de correções, viram as captures do M3. O que ainda diverge do spec é corrigido na implementação e fica listado em `## Differences from the source`: a faixa de reconexão sobre o tabuleiro, "JÁ ENCONTRADA" em amarelo, peças sem pontos nos feedbacks, o selo de posição sem coroa no resultado, "em comum" em toda palavra compartilhada, o topo com a etiqueta da sala no pódio e as telas de saída sem textos e botões a mais. O Resultado da Rodada usa a versão da rodada 1, porque a da rodada 2 trouxe de volta a barra de abas e os títulos.
- **Motivo:** pedir correções ao Stitch não converge; cada rodada volta com erros novos.
- user: "nós conseguimos seguir utilizando o layout atual como base, sem esperar que o stitch faça o layout perfeito, infelizmente não tem sido muito efetivo pedir as melhorias ele sempre retorna com alguns erros."

### AD-013 - Gênero neutro nos textos (active)

- **Data:** 2026-10-29
- **Decisão:** os textos do celular usam a forma neutra: "Anfitrião(ã)", "Espectador(a)", "VOCÊ É O(A) ANFITRIÃO(Ã)". O apelido não diz o gênero de ninguém.
- **Motivo:** pergunta da análise da rodada 1: "Recomendo a forma neutra 'Anfitrião(ã)', igual ao 'Espectador(a)'." O user aprovou o prompt da rodada 2, que pedia essa forma, e o mandou ao Stitch.
- user: "Gerar o prompt"

### AD-014 - Style guide do projeto (active)

- **Data:** 2026-10-29
- **Decisão:** as regras de código e de estrutura ficam em `docs/style-guide.md`. O `CLAUDE.md` da raiz importa o guia (`@docs/style-guide.md`), e assim toda sessão nova carrega o guia sem que ninguém precise pedir. O guia parte das convenções do M0 ao M2 e acrescenta a estrutura dos clientes Preact.
- **Motivo:** o projeto não tinha guia, e as tarefas futuras precisam segui-lo automaticamente.
- user: "O projeto está sem um Style Guide para codigo e estruturação de projeto, defina um para os projetos de acordo com as tecnologias utilizadas, utilizando boas praticas de programação, princípios do SOLID, Componentização e baixo acoplamento. Qual seria o melhor lugar para manter essas especificações para que em tasks futuras sejam escritas seguindo o style guide do projeto sem que eu precise pedir ?"
- Complemento (2026-10-29): o guia ganhou o princípio 6 e a seção 3.1 (legibilidade). user: "Lembre-se que todo codigo deve ser organizado para que humanos possam ler"

### AD-015 - Signals e eslint-config-preact nos clientes Preact (active)

- **Data:** 2026-10-29
- **Decisão:** o estado dos clientes Preact (`packages/phone`, depois `packages/tv`) fica em `@preact/signals`. As regras que mudam o estado continuam em funções puras (`model/`) testadas com Vitest, e os signals só guardam o resultado. Os clientes usam ESLint 9 (flat config) com `eslint-config-preact`, mais `typescript-eslint` como parser dos arquivos `.ts`/`.tsx`, porque o `eslint-config-preact` 2.0.0 usa o parser do Babel.
- **Motivo:** Signals atualizam só os componentes que leem o dado alterado, o que ajuda celulares e TVs mais fracos. O `eslint-config-preact` é a configuração mantida pelo time do Preact, com as regras de hooks.
- user: "ok vamos começar o design, pode definir o eslint-config-preact  no /phone utilize o Preact Signals."

### AD-016 - Responsividade acima da largura das captures (active)

- **Data:** 2026-10-29
- **Decisão:** as captures são conferidas a 390 px, mas o front-end é fluido: funciona de 320 a 480 px de largura e de 568 a 932 px de altura, sem largura fixa em containers (só `%`, `flex`, `vw`/`vh`, `clamp()` e `min()`; px apenas em detalhes de até 64 px, como ícones, bordas e o alvo mínimo de 48 px). O tabuleiro se ajusta ao menor lado disponível e sempre cabe na tela sem rolagem. A comparação com a capture julga composição e proporção nas outras larguras, não pixels.
- **Motivo:** 390 px é só o tamanho em que as captures foram desenhadas; os celulares dos jogadores variam.
- user: "Nessas telas tenha cuidado com a resolução fixa em 390px, para os testes pode ser adotado esse padrão mas para o resultado final a Responsividade é adaptabilidade do front-end deve ser prioridade."
- Complemento (2026-10-29): celular deitado e tablets não têm layout próprio. Fora da faixa de retrato, a tela só ocupa o espaço proporcionalmente; objetos grandes e rolagem vertical são aceitos. user: "não, a aplicação não deve da suporte a celular deitado e ou tablets, via apenas ocupar o espaço proporcionalmente, provavelmente ficara com objetos bem grande e barra de rolagem vertical mas tudo bem."

### AD-017 - Paleta única em @bwords/theme (active)

- **Data:** 2026-10-29
- **Decisão:** cores, tipografia, raios e espaçamentos do design system "BWords Party System" do Stitch (projeto 13555119467933870727, `assets/30f0ebaaa1e44d198703efbf9bf46822`) ficam em variáveis CSS no pacote `packages/theme/tokens.css` (`@bwords/theme`). É a única fonte: o celular, a TV e as ferramentas `tools/debug` e `tools/play` importam esse arquivo, e nenhum outro CSS escreve uma cor literal. As telas usam os nomes de significado (`--color-valid`, `--color-already-found`, `--color-action`...), que apontam para os papéis da paleta. As cores dos jogadores continuam no `PALETTE` do `core`. As ferramentas de desenvolvimento passaram do tema claro próprio para o tema escuro da paleta. Os defaults de cor da fase 1 (#ffd23f, #a8a6b4, #2e1500) foram trocados pelas cores do design system (ouro #ffd027, texto secundário #9ca3af, texto sobre laranja #5c2800).
- **Motivo:** uma paleta só, tirada do design system das captures, reaproveitada em todo o projeto.
- user: "Aceito seguir, mas antes disso, registre a paleta de cores do projeto de acordo com as cores que tem definidas no MCP do layout, crie as variaveis css e reutilize em todo o projeto"
- Complemento (2026-10-29): o `TV_BACKGROUND` do `core`, usado para julgar a legibilidade das cores dos jogadores, passou de `#121417` para `#12131a`, o fundo do design system; o spec do M2 foi emendado. user: "alinhe as cores ao design system."

### AD-018 - Etiquetas do jogador como no lobby do participante (active)

- **Data:** 2026-10-29
- **Decisão:** em toda linha de jogador do celular (lobby do participante, lobby do anfitrião, pódio), a etiqueta "ANFITRIÃO(Ã)" vem primeiro, em laranja, e "VOCÊ" depois, em azul, como em `phone-lobby.png`; "VOCÊ" fica ao lado ou desce de linha conforme o espaço da linha (no pódio fica ao lado, porque a linha de baixo traz as vitórias). A arrumação de `phone-host-lobby.png` ("VOCÊ" laranja ao lado, "ANFITRIÃO(Ã)" cinza embaixo) não é seguida.
- **Motivo:** as duas captures se contradizem; uma arrumação só, a que o app já usa.
- user: "Manter como está" (resposta à pergunta "Qual arrumação das etiquetas da Ana vale para todas as telas?")

### AD-019 - Resultado da rodada na TV numa tela só (superseded by AD-021)

- **Data:** 2026-10-30
- **Decisão:** a TV mostra o resultado da rodada de uma vez, numa tela só, como na capture: placar, palavras únicas, palavras em comum e a maior palavra do tabuleiro. Não há as quatro etapas em sequência de DESIGN §4.3 e `docs/screens.md` §8.
- **Motivo:** Pergunta 3 do M4: "Seguir as 4 etapas automáticas [...] Uma tela só, como a capture." O user escolheu a segunda opção.
- user: "no item 3 da revelação do resultado, mantenha uma tela só como no capture. o resultado pode ser mostrado de uma vez"

### AD-020 - Sem fast mode (active)

- **Data:** 2026-10-30
- **Decisão:** o fast mode sai do jogo: a configuração `fastMode`, o controle no lobby do anfitrião e os chips. Com o resultado numa tela só (AD-019), ele não tem mais função. Diverge de DESIGN §1.2 e §4.3 e de `docs/screens.md`; a remoção do código entra no M4.
- **Motivo:** pergunta do M4 sobre o fast mode depois do AD-019: "Tirar a opção [...] Manter a opção". O user escolheu tirar.
- user: "o fast mode pode ser removido."

### AD-021 - Palavras em rolagem e depois resultado final na TV (superseded by AD-024)

- **Data:** 2026-10-30
- **Decisão:** ao fim da rodada a TV abre sozinha uma página com a quantidade de palavras possíveis e a rolagem automática de todas as palavras encontradas: primeiro as em comum, depois as únicas, cada grupo da menor para a maior, com a pontuação e um círculo na cor de quem achou. Cinco segundos depois da última palavra, vai para o resultado final, sem lista de palavras: pódio com 1º, 2º e 3º maiores, os outros jogadores abaixo em ordem de pontos e o tabuleiro com a palavra mais longa marcada. Essa página espera o anfitrião escolher jogar novamente ou voltar ao lobby. Substitui AD-019 e diverge de DESIGN §4.3 e de `docs/screens.md` §6 e §8.
- **Motivo:** pedido direto do user, depois da análise das telas do Stitch.
- user: "Adicione uma nova pagina para a tv que vai mostrar a quantidade de palavras possíveis  e vai apresentar uma rolagem automática na tela da televisão com todas as palavras encontradas da menor para maior com a pontuação ao lado, ao lado de cada palavra terá sinalizado com um circulo da cor da pessoa que achou aquela palavra, mostrando antes as palavras em comum e depois as palavras únicas, essa pagina irá aparecer logo após o fim da rodada automaticamente, após mostrar a ultima palavra vai esperar 5s e irá para pagina de resultados final, que não vai mais precisar mostrar as palavras, vai mostrar apenas o podio,  1° 2° 3° maior e todos os outros jogadores em ordem de pontos abaixo, o tabuleiro com a palavra mais longa marcada nele, e essa sim irá esperar o anfitrião clicar em jogar novamente ou voltar para o lobby"

### AD-022 - Telas da TV como base do M4 (active)

- **Data:** 2026-10-30
- **Decisão:** as telas de TV do Stitch como estão hoje viram as captures do M4, em 1920x1080: rodada, resultado, palavras da rodada e lobby (a tela "TV - Áudio Bloqueado"). O que ainda diverge é corrigido na implementação e fica em `## Differences from the source`. Lobby vazio, contagem, tempo esgotado, reconectando e sala expirada saem só no código, com o visual aprovado por foto da tela rodando. Na tela de palavras ficam o contador de palavras encontradas e os números maiores, e sai "APENAS 1 JOGADOR".
- **Motivo:** pergunta sobre seguir com o spec: "Escrevo o spec do M4 com as recomendações para as telas restantes?" Opção escolhida: escrever o spec.
- user: "Sim, escrever spec"

### AD-023 - Sem espectador no lobby (active)

- **Data:** 2026-10-31
- **Decisão:** a TV não mostra "ESPECTADOR(A)" no lobby: ali todo jogador é jogador. A marca de espectador só existe em quem entrou durante a rodada ou o resultado, e a volta ao lobby a zera. A linha da Duda em `tv-lobby.png` não é seguida.
- **Motivo:** pergunta do round 1 de telas: "O que fazer com a linha da Duda (espectador no lobby)? [...] Recomendo registrar que não existe espectador no lobby, sem mudar a regra." Opção escolhida: a recomendada.
- user: "Não existe espectador no lobby"

### AD-024 - Lista de palavras conduzida pelo anfitrião (active)

- **Data:** 2026-11-03
- **Decisão:** a lista de palavras rola sozinha a 1 palavra por segundo, sem limite de duração; ▲ e ▼ no celular do anfitrião assumem o controle; a TV só mostra o resultado quando o anfitrião toca "Ver resultado". Substitui a ida automática ao resultado de AD-021, que vale no resto (lista de palavras e depois resultado).
- **Motivo:** teste em TV real. user: "Navegar automaticamente para a pagina de resultados não foi uma boa decisão, devemos dá o controle de rolar a lista de palavras ao anfitrião e a funcionalidade de ir para tela de resultados manualmente."; recomendações aceitas: "concordo com o recomendado"

### AD-025 - A TV na raiz e a entrada por código em /join (active)

- **Data:** 2026-11-03
- **Decisão:** `/` e `/tv` abrem a TV, `/join` abre a entrada por código, `/<CÓDIGO>` abre o celular, e a TV mostra o endereço completo da sala. Muda SERVE-01 do M4, que servia o celular em `/`.
- **Motivo:** o celular chega quase sempre pelo QR. user: "A rota padrão \"/\" pode ser o \"/tv\""; "a tela de entrar com codigo pode virar \"/join\""

### AD-026 - Resultado e pódio na mesma hora na TV e nos celulares (active)

- **Data:** 2026-11-03
- **Decisão:** enquanto a TV mostra "Tempo!" e a lista de palavras, os celulares mostram "Olhe para a TV"; o resultado e o pódio abrem nos celulares junto com a TV, no "Ver resultado" do anfitrião. Substitui o pódio direto no celular ao fim da última rodada (M4, PHONE-01 AC 1).
- **Motivo:** user: "Sincronize a exibição do pódio no mesmo momento entre a tv e os celulares para manter a atenção dos jogadores na tela da tv na hora que as palavras estiverem sendo exibidas"

### AD-027 - Resultado da rodada com pontos e palavras da rodada (active)

- **Data:** 2026-11-03
- **Decisão:** entre as rodadas, o resultado mostra palavras e pontos da rodada, ordenados pelos pontos da rodada, sob "Classificação da Rodada N"; no da última rodada, a soma da partida, sob "Classificação da Partida". Diverge da capture do Stitch, que traz "Classificação da Partida" em todo resultado, e de TVRES-01 AC 2 do M4 (pontos acumulados).
- **Motivo:** pergunta: "Entre as rodadas, o placar ordena pelos pontos da rodada?" user: "Sim, pela rodada"; e "Mantenha coerencia entre pontos e palavras, deve ser mostrados pontos e palavras por rodada, na rodada final mostrar o somatorio dos 2 valores."

### AD-028 - Música de fundo e vinheta do resultado (active)

- **Data:** 2026-11-03
- **Decisão:** a TV toca uma música original, calma, gerada no navegador, da primeira contagem até a lista da última rodada, e uma vinheta animada de cerca de 30 s em loop em todo resultado; o lobby do anfitrião tem a opção "Música". Diverge de DESIGN §4.4 (sem música no MVP).
- **Motivo:** teste em família. user: "o silencio na sala pode ser um problema"; "Mantenha a mesma vinheta em todas as salas, ela deve ser mais longa, pode ter 30s e ficar rodando em looping."
- Complemento (2026-11-03): música em todas as telas da TV, com quatro músicas (lobby; partida, 1,5x mais rápida nos últimos 15 s de cada rodada; vinheta entre as rodadas; partida finalizada no pódio), a 50% do volume dos efeitos, e nenhuma no celular. user: "Certifique-se que em todas as telas tenham algum musica tocando, nós temos musica do lobby, musica de partida em progresso que deve ser acelerada em 1.5x nos últimos 15s da partida e a musica de partida finalizada no pódio. o volume da musica pode ser 50% do volume dos efeitos."; user: "quando falei \"todas as telas agora\" quis dizer \"todas as telas da TV\""; user: "Mantenha o recomendado para as três"

### AD-029 - Sem "Após Rodada N" no resultado (active)

- **Data:** 2026-11-03
- **Decisão:** o resultado da TV não mostra "Após Rodada N" ao lado do título; "Classificação da Rodada N" já diz a rodada (AD-027). Diverge de `m4-1-playtest/captures/tv-round-result.png`.
- **Motivo:** pergunta: "\"Após Rodada N\" sai do resultado? [...] Recomendo tirar, porque o título \"Classificação da Rodada N\" já diz a rodada." user: "Sim, aprovo"

### AD-030 - Jogadores ao lado da lista de palavras (active)

- **Data:** 2026-11-03
- **Decisão:** a lista de palavras da TV ganha uma coluna com os jogadores da rodada, na ordem de entrada, com as palavras da rodada completas e os pontos somando a cada palavra destacada, com uma animação na linha de quem pontuou. Diverge da composição de `m4-tv/captures/tv-words.png`, que só tem a lista.
- **Motivo:** pergunta: "Na lista de palavras, ficaria muita informação, permanecer mostrando os participantes [...]?" Recomendação: totais que crescem com o destaque, na ordem de entrada. user: "Aplique a recomendação mas adicione uma animação simples aos jogadores que receberam algum ponto no mesmo momento do check da palavra, a quantidade de palavras nessa pagina ja deve vir com valor da rodada completo, apenas os pontos vão somando."
- Complemento (2026-11-03): o painel fica à direita, como na tela "TV - Palavras da Rodada" do Stitch, e se reordena pelos pontos a cada palavra computada, com o card inteiro deslizando até a posição nova, em tamanho fixo; "N palavras" por extenso; sem quem entrou atrasado; "DESCONECTADO" no desconectado. Os círculos das palavras seguem na cor do jogador e a tela ocupa a janela inteira, sem a margem do HTML. user: "a listagem de jogadores na pagina de lista de palavras, toda vez que uma palavra for \"computada\" ou seja os pontos forem aplicados aos jogadores que acharam aquela palavra, a lista deve ficar alterando a posição dos usuários com uma animação suave. veja o layout da pagina Plaavras da Rodada no stitch"; user: "1. Concordo. 2. Concordo, ajustado no stitch tabém 3. Concordo, ajustado no stitch também 4. Ajustado no Stitch 5. O card todo deve fazer a animação de troca de posições quando necessario. A lista deve maner um tamanho fixo para evitar comportamentos e ou glitchs indejados e os itens da lista se ordenam de acordo com os pontos"

### AD-031 - Contexto e skills legíveis por qualquer ferramenta de AI (active)

- **Data:** 2026-11-13
- **Decisão:** as instruções do projeto ficam em `AGENTS.md` (antes `CLAUDE.md`), o padrão aberto que várias ferramentas de AI leem; o Claude Code o lê sozinho quando não há `CLAUDE.md`. As skills do projeto ficam só em `.agents/skills/` (hoje, `tlc-spec-driven`); `.claude/skills/` é git-ignored e gerada pelo `npm install` com links para lá (`npm run skills:link`), porque o Claude Code só lê skills de `.claude/skills/`. Skills pessoais, como `grill-me` e `grilling`, ficam na máquina de cada um, fora do repositório. Atualiza o AD-014: o guia continua importado, agora pelo `AGENTS.md`.
- **Motivo:** quem baixar o projeto sem usar o Claude precisa achar as instruções e as skills. user: "a skill grill-me deve ficar na minha maquina como todo, e não dentro do projeto, apenas a skill do tlc-spec-driven deve ser está no projeto, execute as outras mudanças necessarias para deixar o projeto mais generico para qualquer ferramente de AI utilizar, como renomear claude.md para agents.md e fazer o script para gerar a pasta de skills para que o claude funcione."

## Handoff

- **Data:** 2026-11-03
- **Marcos concluídos:** M0, M1, M2, M3, M4 e M4.1 (`m4-1-playtest`).
- **M4.1:** 48 tarefas, walk sem problema (`fd31734`), telas `matches` no round 1, Verifier com 1 achado fechado (`264b1ab`) e 3 mutações killed. Fechamento aprovado pelo user com uma falha do Build na suíte E2E do celular, que passa sozinha: user: "não precisa ficar rerodando por causa desse erro, pode aprovar essa finalização, iremos resolver esses erros de E2E ajustando os prints do stitch depois". O gate (`validate_verification.py`) fica com esse erro registrado.
- **Próximo passo do user:** push e deploy feitos por ele, à mão; depois, as caminhadas em aparelho real (C108 TV LG sem descanso, C109 iPhone sem zoom, C110 músicas e "check" na sala), com o resultado registrado no `**Walked:**` do `m4-1-playtest`.
- **Melhorias futuras no processo (anotadas, sem tarefa):**
  1. Uma ferramenta no projeto que gere as captures do Stitch pelo HTML da tela, sempre a 1920x1080 na TV e 390 px no celular, em escala 2, sem a margem externa e escalando o que vier em outro tamanho; o Stitch não obedece as medidas. user: "Infelizmente eu não consegui fazer o stitch obedecer as medidas das telas [...] então precisamos resolver no codigo e do nosso lado."; "deixe apenas anotado como melhorias futuras no processo"
  2. A instabilidade dos E2E no Windows: no Build serial, uma suíte do celular ou da TV cai uma vez (Vite recusando a conexão, ou o teste de feedback em 100 ms) e passa sozinha; o user vai tratar junto com os ajustes das captures.
- **Ideias para outra versão:** dicas de palavras, significado das palavras (Wikcionário pelo Worker, com cache), a vitória que pareceu indevida numa partida em família (o user volta ao caso se ele se repetir).
- **Depois:** o M5, com a lista de palavrões vazia.
- **Branch:** `main`. Push só com pedido; o user fará este.
- **Modo de execução preferido pelo usuário:** subagentes, um batch por vez, parando para mostrar o resultado e perguntar antes do próximo.
- **Teste manual:** `npm run assets:build`, depois `npm run dev -w @bwords/server`; TV em `http://localhost:8787/` ou `/tv`, celular em `/<CÓDIGO>`, entrada por código em `/join`.
- **Ambiente Windows:** os scripts da skill precisam de `PYTHONUTF8=1`; `check_proofs.py` também precisa de `PYTHONPATH` apontando para uma pasta com um `sitecustomize.py` que mapeia `signal.SIGHUP` para `SIGTERM` e resolve launchers `.cmd` (como o `npx`) via `shutil.which`. Recriar no scratchpad da sessão se sumir. Em node e Playwright, nunca caminhos `/c/...`: criam a pasta `C:\c\`.
