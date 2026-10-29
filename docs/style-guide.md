# BWords — Style Guide

Regras de código e de estrutura para todo o repositório. Valem para código novo e para o código que uma tarefa tocar. Onde este guia e o código existente divergem, o guia vence; onde o guia não diz nada, siga o vizinho.

O guia descreve o que o código do M0 ao M2 já faz e acrescenta as regras dos clientes Preact (M3 e M4).

---

## 1. Princípios

1. **Regras no `core`, efeitos nas pontas.** O jogo é um *functional core* com uma *imperative shell* em volta:
   - toda regra que decide algo fica em funções puras do `@bwords/core`;
   - o servidor e os clientes só ligam essas funções ao mundo: socket, storage, relógio, DOM.
2. **Toda regra que muda o que o usuário vê roda numa camada que os testes alcançam.** Filtrar, ordenar, contar, pontuar e formatar ficam em funções puras testadas com Vitest, nunca dentro de um componente ou de um handler de evento.
3. **Baixo acoplamento.** Os pacotes conversam só por tipos e funções exportadas. O protocolo (`packages/core/src/room/protocol.ts`) é o único contrato entre servidor e clientes.
4. **O simples primeiro.** Não crie abstração para um uso só, nem configuração para um valor que nunca muda. Três linhas repetidas são melhores que uma abstração prematura.
5. **Código em inglês, documentos em português** (AD-001). Todo identificador, tipo de mensagem, código de erro e nome de arquivo fica em inglês. O texto que o jogador vê sai da tabela de strings, nunca do código nem do protocolo.
6. **Código escrito para humanos lerem.** Quem abre um arquivo deve entender o que ele faz lendo de cima para baixo, sem decifrar truques. Na dúvida entre o mais curto e o mais claro, escolha o mais claro. As regras práticas estão na seção 3.1.

---

## 2. Estrutura do monorepo

```
packages/
  core/      regras do jogo e da sala; puro, sem DOM nem Node
  theme/     tokens.css: paleta, tipografia, raios e espaços de todas as telas (AD-017)
  server/    Worker + Durable Object; casca fina sobre o core
  phone/     cliente do celular (M3), Preact + Vite
  tv/        cliente da TV (M4), Preact + Vite
tools/       ferramentas de desenvolvimento (dict-build, play, debug)
spikes/      experimentos descartáveis; nada em packages/ importa daqui
languages/   arquivos de edição dos dicionários (.txt)
docs/        documentos de projeto
.specs/      specs, tarefas e decisões (tlc-spec-driven)
```

**Direção das dependências** (uma seta = "pode importar de"):

```
phone ─┐
tv ────┼──▶ core
server ┘
tools ────▶ core
```

- O `core` não importa nada do repositório nem tipos de DOM ou Node (`"types": []` no tsconfig).
- `phone`, `tv` e `server` nunca importam uns dos outros. O que dois deles precisam compartilhar sobe para o `core`.
- Importe um pacote só pela entrada pública (`@bwords/core`), nunca por caminho interno (`@bwords/core/src/room/...`).
- Um pacote novo entra em `tsconfig.json` (`references`) e nos `workspaces` do `package.json` raiz.

### 2.1 Dentro de um cliente Preact (`packages/phone`, `packages/tv`)

```
src/
  main.tsx          monta o app; nenhuma regra aqui
  app.tsx           escolhe a tela pela fase e pelo papel
  net/              socket, reconexão, clock sync; fala o protocolo do core
  state/            store do cliente em @preact/signals: signals + ações que aplicam funções de model/ (AD-015)
  model/            funções puras de view-model (ordenar, formatar, somar); testadas com Vitest
  screens/          uma tela por arquivo (Lobby, Board, Results...); compõe componentes
  components/       peças reutilizáveis sem conhecimento de rede (Tile, PlayerRow, Chip, Sheet)
  strings/pt-BR.ts  tabela de textos exibidos
  styles/
    tokens.css      só o que é do pacote (alvo de toque, tipografia fluida), sobre o @bwords/theme
    *.css           um arquivo por tela ou componente
e2e/                testes Playwright
```

- `components/` não importa de `net/` nem de `state/`. Recebe dados e callbacks por props.
- `screens/` lê o store e repassa dados e ações para os componentes. Uma tela não abre socket.
- `net/` não conhece telas. Ele entrega mensagens ao `state/` e expõe `send`.
- `model/` não importa Preact nem `@preact/signals`.
- **Estado com Signals (AD-015):** o estado vive em signals dentro de `state/`. Uma ação calcula o próximo valor com uma função pura de `model/` e atribui ao signal (`room.value = applyServerMessage(room.value, msg)`). Valores derivados usam `computed`, nunca um `useEffect` que copia estado. Componentes leem signals só em `screens/`; os de `components/` recebem valores por props.

---

## 3. TypeScript

O `tsconfig.base.json` já liga `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` e `erasableSyntaxOnly`. Escreva código que passa nele sem afrouxar nenhuma opção.

- **Imports:**
  - com a extensão `.ts`/`.tsx` (`import { step } from './machine.ts'`);
  - tipos com `import type` ou `type` inline;
  - sem `default export`, exceto onde a ferramenta exige (`vite.config.ts`, o Worker).
- **Sem `enum`, `namespace` nem parameter properties** (`erasableSyntaxOnly`). Use uniões de literais e um array `as const` quando precisar iterar:
  ```ts
  export const CLOSE_REASONS = ['kicked', 'closed-by-host', 'idle', 'tv-gone', 'replaced'] as const;
  export type CloseReason = (typeof CLOSE_REASONS)[number];
  ```
- **Uniões discriminadas para estado e mensagens**, com `type` ou `kind` como discriminante, e `switch` exaustivo (`const never: never = x`) no lugar de cadeias de `if`.
- **Sem `any`.** Entrada desconhecida é `unknown`, validada antes de virar tipo (como `parseClientMessage`).
- **`!` só depois de uma checagem que o compilador não enxerga**, nunca para silenciar um índice que pode faltar.
- **Imutabilidade:**
  - parâmetros e campos `readonly` quando a função não muda o dado;
  - estado novo com spread (`{ ...state, players: [...] }`), nunca mutação do estado recebido.
- **Funções e objetos no lugar de classes.** Classe só onde o runtime exige (`DurableObject`).
- **Constantes de regra com nome e unidade**, ao lado da regra que usam: `MAX_PLAYERS = 10`, `SUBMIT_DEBOUNCE_MS = 500`. Nunca um número solto no meio do código.

### 3.1 Legibilidade

- **Nomes que dizem a intenção:** `remainingSeconds`, não `rs`; `isNeighbor(a, b)`, não `chk(a, b)`. Abreviação só para as consagradas (`id`, `ms`, `msg`).
- **Funções curtas, com um nível de abstração:** se uma função mistura "o que" e "como", extraia o "como" para uma função com nome. Uma função que não cabe numa tela (~40 linhas) é sinal para dividir.
- **Pouco aninhamento:** use *early return* e cláusulas de guarda; mais de três níveis de `if`/`for` aninhados pede uma função extraída.
- **Uma ideia por linha:** sem ternários encadeados, sem expressões que fazem três coisas. Um valor intermediário com nome vale mais que uma linha esperta.
- **Ordem de leitura:** o arquivo começa pelo que importa (tipos e o export principal) e segue para os detalhes (funções auxiliares). Funções relacionadas ficam perto umas das outras.
- **Arquivos pequenos e focados:** um arquivo com mais de ~300 linhas ou com responsabilidades misturadas deve ser dividido.
- **Sem números mágicos:** todo número com significado de regra tem uma constante com nome e unidade.
- **Dados de exemplo e testes também se leem:** um teste mostra entrada, ação e resultado esperado em blocos separados, com nomes de jogadores e palavras que expliquem o caso.

---

## 4. SOLID, aplicado a este código

| Princípio | Como aparece aqui |
| --- | --- |
| **S** - responsabilidade única | Um módulo por regra (`join.ts`, `scoring.ts`, `wins.ts`). Uma função faz uma coisa: valida **ou** decide **ou** aplica efeito. Um componente desenha **ou** busca dados, nunca os dois. |
| **O** - aberto/fechado | Comportamento novo entra como uma entrada nova numa tabela, não como outro `if` num handler grande. O `machine.ts` mapeia cada tipo de mensagem para um `Handler`; uma mensagem nova é um handler novo. O mesmo vale para telas: `app.tsx` mapeia fase → tela. |
| **L** - substituição | Toda implementação de um contrato o cumpre por inteiro: um `LanguagePack` de outro idioma, um `RoomDeps` falso nos testes, um transporte de socket falso no cliente. Os testes usam os mesmos contratos que a produção. |
| **I** - segregação de interfaces | Interfaces pequenas, do tamanho do uso. Um componente recebe só as props que desenha (`PlayerRow` recebe `player` e `crowned`, não o estado inteiro da sala). Um handler recebe `HandlerContext`, não o Durable Object. |
| **D** - inversão de dependência | Relógio, aleatoriedade, storage e socket entram como dependência (`RoomDeps`, `now`), nunca chamados direto dentro de uma regra. No cliente, `net/` recebe a fábrica de WebSocket e o `state/` recebe o relógio; os testes passam versões falsas. |

---

## 5. Componentização (Preact)

- **Componentes de função** com hooks. Uma tela por arquivo; componentes pequenos podem dividir um arquivo quando só servem àquela tela.
- **Props explícitas e tipadas** numa `interface` com o nome `<Componente>Props`. Sem espalhar objetos inteiros (`{...state}`) em props.
- **Apresentação separada de dados:**
  - componentes em `components/` são puros: mesma prop, mesmo HTML;
  - eventos saem por callbacks nomeados pela intenção (`onSubmitPath`, `onKick`), não pelo gesto (`onClick2`).
- **Nenhuma regra dentro do JSX.** Ordenar a classificação, achar a coroa, somar o resumo do pódio, formatar "M:SS" ficam em `model/` (testado) e chegam prontos ao componente.
- **Tamanho:** se um componente passa de ~150 linhas ou tem mais de um `useEffect` com propósitos diferentes, divida-o.
- **Efeitos:** `useEffect` só para sincronizar com algo fora do Preact (Wake Lock, listeners de toque, timers), sempre com limpeza.
- **Texto exibido** vem de `strings/pt-BR.ts` por chave. Nenhuma string de interface escrita direto no JSX.
- **Acessibilidade mínima:** botões são `<button>`, ícones sem texto têm `aria-label`, alvos de toque com 48 px ou mais.

### 5.1 CSS

- **Cores, espaços, raios e fontes** só pelas variáveis de `packages/theme/tokens.css` (`@bwords/theme`, AD-017), importado por todo cliente e ferramenta. Nenhuma cor literal fora dele, exceto a cor do jogador, que vem do dado. Telas usam os nomes de significado (`--color-valid`, `--color-invalid`, `--color-already-found`, `--color-action`, `--color-crown`); os papéis da paleta (`--color-primary-container`, `--color-surface-container`...) servem para superfícies e texto. Um pacote pode ter um `tokens.css` próprio só para o que é dele (alvo de toque, tipografia fluida), sempre a partir das variáveis do tema.
- **Layout:** só flexbox e margens, sem CSS Grid e sem `gap`. A TV-alvo roda navegadores antigos (DESIGN §4.5).
- **Responsividade primeiro (AD-016):** layouts fluidos, nunca presos à largura de uma capture. Containers só com `%`, `flex`, `vw`/`vh`, `clamp()` e `min()`; px só em detalhes de até 64 px (ícones, bordas, avatares, o alvo de 48 px). Tipografia com `clamp()`. O celular funciona de 320 a 480 px de largura e de 568 a 932 px de altura; a TV, de 1280×720 a 1920×1080. As captures servem para conferir composição, não pixels.
- **Animações:** só com `transform` e `opacity`. Sem `blur`, `backdrop-filter` nem `box-shadow` animado.
- **Classes:** em inglês, no formato `bloco__elemento--modificador` (`player-row__name--muted`). Sem estilo inline, exceto valores dinâmicos (cor do jogador, posição do caminho).
- **Só tema escuro** (AD-010), mas sempre por tokens, para que um tema novo troque só o `packages/theme/tokens.css`.

---

## 6. Nomes

| O quê | Formato | Exemplo |
| --- | --- | --- |
| Arquivo de módulo | `kebab-case.ts`, curto | `pack-loader.ts`, `colors.ts` |
| Arquivo de componente | `PascalCase.tsx` | `PlayerRow.tsx`, `BoardScreen.tsx` |
| Teste | ao lado do módulo, `.test.ts` / `.test.tsx` | `scoring.test.ts` |
| Função, variável | `camelCase`, verbo para ação | `handleJoin`, `crownedPlayers` |
| Tipo, interface, componente | `PascalCase` | `RoomState`, `PlayerInfo` |
| Constante de regra | `UPPER_SNAKE_CASE` | `MAX_MESSAGE_BYTES` |
| Código de protocolo e erro | `kebab-case` em string | `'nickname-taken'`, `'back-to-lobby'` |
| Booleano | pergunta | `connected`, `isHost`, `hasToken` |

Use o vocabulário do jogo em inglês de forma consistente: `room`, `host`, `player`, `spectator`, `round`, `board`, `tile`, `path`, `podium`, `wins`.

---

## 7. Comentários e documentação

- **JSDoc em todo export**, dizendo o que a função garante e por quê, não como. Cite o requisito que ela cumpre: `/** Most players in a room, connected or not (JOIN-01 AC 7). */`.
- **Comentário no meio do código só para o porquê** que o código não mostra: uma regra de negócio, um limite de plataforma, uma decisão (`AD-NNN`).
- **Sem código comentado e sem `TODO`** sem dono. Pendência vira tarefa em `.specs/`.

---

## 8. Erros

- **Erros de regra viram valores, não exceções:** uma função de regra devolve o resultado ou um código (`ColorError`, `SubmitResult`), e quem chama decide o que fazer.
- **`throw` só para erro de programação** (estado impossível, entrada que já devia ter sido validada).
- **O servidor só manda códigos;** o cliente traduz o código para o texto da tabela de strings. Todo código do protocolo tem uma entrada na tabela.
- **Nada falha calado:** um `catch` registra ou converte o erro, nunca o engole.

---

## 9. Testes

- **Os testes nascem dos critérios do spec** e conferem o resultado que o critério define, não a implementação. O nome do teste diz o comportamento: `test('refuses a nickname already in the room, ignoring case and accents')`.
- **Onde cada teste fica:**
  - **Vitest** para tudo que é puro: `core`, `model/` e `state/` dos clientes;
  - **`@cloudflare/vitest-plugin`** para o servidor no workerd;
  - **Playwright** (`e2e/`) para fluxos que precisam de navegador, com vários contextos para TV e celulares.
- **Use fakes, não mocks:** dependências falsas que cumprem o contrato (`fakeDeps()`, um socket em memória), em vez de espiar chamadas internas.
- **Todo limite tem um teste no valor exato do limite** (L-001), e todo ramo de uma tabela tem o seu caso (L-007).
- **Testes determinísticos:** relógio e aleatoriedade sempre injetados. Nada de `sleep`; espere pela condição.

---

## 10. Formatação e lint

- Os clientes Preact rodam ESLint 9 com `eslint-config-preact` e `typescript-eslint` (AD-015). Lint sem erros faz parte do gate de cada tarefa desses pacotes.
- Enquanto o repositório não tiver formatador, siga o que o código já usa:

- 2 espaços de indentação, aspas simples, ponto e vírgula, vírgula no fim de listas multilinha;
- linhas de até ~130 colunas;
- `if` de uma linha sem chaves só quando cabe numa linha e termina em `return`.

---

## 11. Commits

- Um commit atômico por tarefa, com a mensagem no formato *conventional commits* em inglês:
  - `feat(phone): ...`, `fix(core): ...`, `test(play): ...`, `docs: ...`;
  - o escopo é o pacote ou a ferramenta.
- Nunca enfraqueça, pule ou apague um teste para passar o gate.
- Push só com pedido explícito.
