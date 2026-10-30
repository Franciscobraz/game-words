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

## Handoff

- **Data:** 2026-10-30
- **Marcos concluídos:** M0, M1, M2 e M3 (`m3-phone`, Done, verificados).
- **Fechamento do M3:** T47 `128bb09` (lista do espectador cabe em 390x884, SPEC-01 AC 4, C135) e T48 `9736ad1` (a grafia real não quebra no meio a 320 px, UI-01 AC 12, C136). O "Placar rápido" sob os botões `sticky` de `phone-round-result` fica como está, por decisão do user: os botões continuam à vista e o placar aparece ao rolar. `check_proofs.py --mutations` em 9736ad1: 142 pass, 0 fail, 12 mutações mortas. `validate_verification.py` deu exit 0 em 9736ad1, com o `proofs.md` ainda fora do commit. Lições L-011 a L-015 registradas.
- **Gate e `proofs.md`:** o gate compara o HEAD de `proofs.md` com o HEAD atual. A ordem é rodar `check_proofs.py`, rodar o gate e só então commitar `proofs.md`. Depois desse commit de docs o gate acusa outro HEAD; isso é esperado e não é regressão.
- **Próximo passo:** M4 (cliente da TV), a começar pelo Specify, com a skill `tlc-spec-driven`.
- **Branch:** `main`. `origin/main` está em `47801cc`; nada depois disso foi enviado. Push só com pedido.
- **Modo de execução preferido pelo usuário:** subagentes, uma fase por vez, parando para mostrar o resultado e perguntar antes da próxima fase.
- **Teste manual:** o user testou o M3 só no navegador do computador (`npm run debug` como TV em 5174, `npm run dev -w @bwords/phone` em 5175, o segundo celular em janela anônima porque o token fica no `localStorage`). Teste no celular de verdade e produção ficam para depois do M4; não preparar HTTPS na rede local antes disso.
- **Ambiente Windows:** os scripts da skill precisam de `PYTHONUTF8=1`; `check_proofs.py` também precisa de `PYTHONPATH` apontando para uma pasta com um `sitecustomize.py` que mapeia `signal.SIGHUP` para `SIGTERM` e resolve launchers `.cmd` (como o `npx`) via `shutil.which`. Recriar no scratchpad da sessão se sumir.
