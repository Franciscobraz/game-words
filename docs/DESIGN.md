# BWords — Documento de Design

Jogo de encontrar palavras em tabuleiro de letras, inspirado no Boggle Party (Netflix). Uma TV ou PC abre o jogo no navegador como **tela principal**; os jogadores entram pelo **celular via QR code** e o usam como controle.

**Objetivo do projeto:** jogar com amigos e família, servir de portfólio e de projeto de estudo. Custo de infraestrutura zero.

---

## 1. Regras do jogo

### 1.1 Modo
- **Simultâneo e competitivo:** todos jogam no mesmo tabuleiro, ao mesmo tempo, durante uma rodada cronometrada.
- Modos cooperativo e por turnos ficam para versões futuras.

### 1.2 Configurações da sala (definidas pelo anfitrião)

| Opção | Valores | Padrão |
|---|---|---|
| Tabuleiro | 4x4, 5x5, 6x6 | 4x4 |
| Tempo da rodada | 30 s a 180 s, de 30 em 30 | 120 s |
| Rodadas por partida | 1 a 5 | **1** |
| Tamanho mínimo de palavra | 3 ou 4 | 3 |
| Filtrar palavrões | ligado / desligado | **ligado** |
| Dicionário (pacote de idioma) | Português (BR) no MVP | pt-BR |
| Volume / mudo da TV | — | ligado |

- A configuração é fixa durante a partida. O anfitrião só pode alterá-la no **lobby**, antes de a partida começar ou depois que ela termina.
- Enquanto o anfitrião edita, as configurações aparecem **espelhadas ao vivo na TV**.

### 1.3 Formação de palavras
- As peças precisam ser adjacentes nas **8 direções** (incluindo diagonais).
- A mesma **peça** (posição) não pode ser usada duas vezes na mesma palavra. Letras repetidas são permitidas desde que venham de peças diferentes (ex.: "ERROS" usa duas peças R vizinhas).
- **Peça composta "Qu"** no pt-BR: conta como 2 letras na pontuação. Cada pacote de idioma pode definir suas próprias peças compostas.
- O tabuleiro exibe só letras sem acento e sem Ç. As palavras são comparadas após a normalização, então "MÃE" é aceita ao formar M-A-E.

### 1.4 Pontuação (igual ao Boggle Party)

| Letras | Pontos |
|---|---|
| 3 | 1 |
| 4 | 2 |
| 5 | 3 |
| cada letra a mais | +1 |

- Uma palavra encontrada por **um único jogador vale o dobro**.
- Não há penalidade por palavra inválida nem bônus de velocidade.
- Não existe "desafio de palavra".

### 1.5 Estrutura da partida
1. **Lobby:** jogadores entram e o anfitrião configura.
2. **Contagem regressiva "3, 2, 1"** na TV e nos celulares. O tabuleiro aparece para todos ao mesmo tempo no "já".
3. **Rodada:** timer controlado pelo servidor. Envios que chegarem até ~300 ms depois do fim ainda valem, para compensar a latência.
4. **Resultado da rodada** (ver §4.3). Entre as rodadas, o anfitrião avança para a próxima.
5. A última rodada encerra a partida sem nenhum toque do anfitrião, e as vitórias já contam (AD-021). O celular vai direto para o **pódio final**, e a TV mostra as palavras e o resultado com o vencedor. As opções são "Jogar de novo" (começa direto uma nova partida com os mesmos jogadores e configurações, placar zerado), "Voltar ao lobby" (placar zerado, para esperar mais gente entrar) ou "Encerrar sala".
6. Durante a partida (contagem, rodada ou resultado), o anfitrião pode **voltar ao lobby** pelo menu: a rodada em andamento é cancelada e o placar zera.

---

## 2. Sala, jogadores e anfitrião

- **Sem contas no MVP.** Abrir `/tv` cria a sala automaticamente e mostra o QR code e um **código de 4 letras**, sem letras ambíguas (O/0, I/1). A TV não precisa de nenhum botão do controle remoto (exceto, se o navegador exigir, um "OK" para liberar o áudio).
- **Até 10 jogadores** por sala.
- **Apelido:** de 2 a 12 caracteres, **único na sala**, com comparação que ignora maiúsculas e acentos ("João" = "joao").
- **Cor:** seletor livre com uma paleta de 10 sugestões e a opção "personalizada".
  - A comparação é por **semelhança perceptual**. Se a cor for parecida demais com a de outro jogador, aparece um aviso e o seletor reabre.
  - O seletor só permite cores legíveis sobre o fundo escuro da TV.
- **Anfitrião:**
  - É o primeiro celular que entra na sala.
  - Pode transferir o papel para outro jogador. Sempre existe exatamente um anfitrião por sala.
  - Se o anfitrião ficar desconectado por ~30 s, o papel passa para o próximo jogador conectado.
  - É quem controla tudo: configurações, iniciar, próxima rodada, jogar de novo, voltar ao lobby, encerrar e expulsar jogador.
- **Entrada atrasada:** quem entra durante uma rodada fica assistindo e joga a partir da próxima, começando com 0 pontos.
- **Reconexão:** um token salvo no celular recupera o nome, a cor, os pontos e as palavras da rodada. Se a TV recarregar a página, ela volta para a mesma sala.
- **Expiração:** configurável em `wrangler.toml`.
  - `ROOM_IDLE_TIMEOUT_MIN` (padrão 30) e `TV_DISCONNECT_TIMEOUT_MIN` (padrão 10).
  - **`0` = nunca expira.**
  - O estado da sala é persistido no storage do Durable Object a cada mudança. Nada se perde se a TV entrar em espera ou se o servidor hibernar.
- **Placar:** fica só na sala no MVP, sem persistência entre salas.
- **Vitórias da sessão:** a sala conta quantas partidas completas cada jogador venceu (maior placar no pódio; empatados vencem todos; partida cancelada não conta). O lobby da TV e dos celulares mostra as vitórias de cada um, e quem tem mais vitórias (todos, no empate) ganha um ícone de coroa ao lado do nome. As vitórias valem enquanto a sala existir.

---

## 3. Celular (controle)

- Mostra o **tabuleiro completo**. O gesto principal é **deslizar** pelas letras e enviar ao soltar; a alternativa é tocar letra por letra e apertar "enviar".
- A palavra em formação aparece no topo, e o jogador vê a lista das próprias palavras.
- **Feedback instantâneo:** "válida ✓", "inválida ✗" ou "já encontrada" (ver §6.2).
- **Preferências locais** (localStorage), ambas **desligadas por padrão**:
  - Vibrar. Só funciona no Android; no iOS o Safari não suporta vibração e a opção fica escondida.
  - Som ao acertar.
- Mantém a tela acesa com a **Screen Wake Lock API** durante o lobby e a rodada.
- O celular do anfitrião tem o menu de controle da sala.
- Tema claro/escuro automático.

---

## 4. TV (tela principal)

### 4.1 Lobby
- QR code grande, código da sala, lista de jogadores com suas cores, vitórias da sessão e coroa (ver §2), e as configurações espelhadas ao vivo. Jogadores desconectados aparecem esmaecidos.

### 4.2 Rodada
- Tabuleiro grande, timer e o **número** de palavras de cada jogador ao vivo, sem revelar quais são.
- O código da sala e um QR pequeno ficam no topo (AD-022). A lista traz só quem joga a rodada, sem os espectadores.
- Quando o tempo acaba, a TV mostra "0:00", o tabuleiro esmaecido e "Tempo!" por 2 s.

### 4.3 Depois da rodada (AD-021)
Toda rodada passa pelo mesmo fluxo, sozinho, a partir do "Tempo!":

1. **Palavras da rodada.** Uma faixa fixa traz o total de palavras possíveis e o de encontradas. Abaixo, a lista rola sozinha: primeiro as **palavras em comum**, depois as **únicas**, com "pontos em dobro".
   - Cada grupo vai da menor palavra para a maior e, no mesmo tamanho, em ordem alfabética.
   - Cada linha traz a palavra com as grafias reais (ver §5.5), um círculo na cor de cada jogador que a achou e os pontos.
   - A rolagem anda a 2 palavras por segundo e acelera para durar no máximo 60 s.
   - Sem nenhuma palavra encontrada, a tela diz "Nenhuma palavra encontrada".
2. **Espera de 5 s** com a última palavra à vista.
3. **Resultado**, numa tela só, que espera o anfitrião.
   - 1º, 2º e 3º em cartões, com os pontos acumulados. Do 4º em diante, uma lista em ordem de pontos.
   - O tabuleiro da rodada, com as peças da **maior palavra** acendendo uma por vez, a cada 400 ms.
   - "A maior palavra do tabuleiro", com as grafias reais, e "Ana encontrou!" ou "Ninguém encontrou". Em caso de empate, aparece uma que alguém encontrou; se ninguém encontrou, a primeira em ordem alfabética. Não há outra lista de "palavras perdidas".
   - O código da sala e um QR pequeno, para quem chegou atrasado.
   - Entre as rodadas, o título é "Resultado · Rodada 1 de 3" e o rodapé, "Aguardando Ana avançar…".
   - Na última rodada, o título é "Ana venceu!", ou "Empate!", com confete, e o rodapé é "Aguardando Ana: jogar de novo ou voltar ao lobby".

Se o anfitrião avançar, jogar de novo ou voltar ao lobby durante a rolagem, ela é interrompida. Recarregar a TV recomeça a rolagem do início.

### 4.4 Áudio
- Efeitos curtos na TV, sintetizados com Web Audio, sem arquivos: início da rodada, últimos 10 s, apito no "Tempo!" e início da rolagem. O volume e o mudo são controlados pelo anfitrião.
- Se o navegador bloquear o som, o lobby pede "OK" no controle.
- Sem música no MVP.

### 4.5 Visual
- Fundo escuro e peças grandes com alto contraste, legíveis a 3 m.
- Base de 1920×1080, responsiva até 720p.
- Tokens de cor centralizados para permitir troca de tema.
- Uma fonte embutida (Nunito ou Inter), reduzida aos caracteres usados.

### 4.6 Fim da sala e conexão
- **Encerrada pelo anfitrião:** a TV abre uma sala nova sozinha.
- **Expirada:** a TV mostra "Sala expirada" e espera "OK" ou uma recarga, sem criar sala.
- **Aberta em outra aba:** a TV só avisa e para de reconectar.
- **Conexão caída:** a tela atual fica, com a faixa "Reconectando…". Depois de 30 s, a faixa vira "Sem conexão", e a TV continua tentando.
- **Espera entre tentativas:** 0,5 s, 1 s, 2 s, 4 s, 8 s, 16 s, 32 s e depois 60 s.
- **Limite:** em 10 min, o mesmo prazo padrão de `TV_DISCONNECT_TIMEOUT_MIN`, a TV para de tentar e pede "OK" para recomeçar.

---

## 5. Dicionário e pacotes de idioma

### 5.1 Separação
- **i18n da interface:** só pt-BR no MVP, mas com todas as strings externalizadas.
- **Pacote de idioma do jogo**, escolhido por sala. Cada pacote define:
  - alfabeto e peças compostas ("Qu");
  - normalização (ex.: remover acentos no pt-BR; o espanhol manteria o Ñ);
  - frequência de letras para o gerador;
  - tamanho mínimo padrão;
  - dicionário compilado.

### 5.2 Fonte pt-BR
O dicionário vem do **Hunspell pt_BR do VERO/LibreOffice** (LGPL/MPL), expandido com `unmunch` e filtrado no build. Ficam só as palavras que:
- estão todas em minúsculas (o que elimina nomes próprios e siglas);
- não têm hífen nem apóstrofo (o que elimina ênclises como "fazê-lo");
- têm de 3 a 16 letras;
- foram normalizadas sem acento.

São aceitas as formas flexionadas: plurais, femininos e conjugações.

### 5.3 Arquivos editáveis pelo desenvolvedor (`languages/pt-BR/`)

| Arquivo | Função |
|---|---|
| `extra.txt` | Palavras do cotidiano ou da cultura popular a **adicionar** ("zap", "rolê", "crush") |
| `blocklist.txt` | Palavras a **remover** |
| `profanity.txt` | Palavrões. Continuam no dicionário, mas marcados, e são rejeitados quando "Filtrar palavrões" está ligado |

- Os `.txt` são só o **formato de edição**: uma palavra por linha, com diffs fáceis no git.
- No build, tudo é compilado num **binário compacto (DAWG/trie)** com as marcações de palavrão.
- O jogo nunca lê os `.txt` em tempo de execução.
- O dicionário fica **somente no servidor**.

### 5.4 Geração do tabuleiro
- As letras são sorteadas pela frequência no dicionário, com um limite de ~3–4 cópias da mesma letra.
- Um solver encontra **todas** as palavras válidas, e tabuleiros com poucas palavras são rejeitados. Os mínimos iniciais, a calibrar, são: 4x4 ≥ 40, 5x5 ≥ 80, 6x6 ≥ 120.
- Com o filtro de palavrões ligado, o gerador evita palavrões óbvios em linha reta.
- O próximo tabuleiro é gerado **enquanto a TV mostra os resultados**.


### 5.5 Grafias de exibição (decisão A1)
- A validação e a pontuação usam só a forma normalizada: "faca" e "faça" são **a mesma palavra**, formada pelas mesmas peças (F-A-C-A), e valem **uma vez**. Os pontos contam as letras da forma normalizada (a peça "Qu" conta 2).
- O build guarda, junto com o binário, um **mapa de grafias**: forma normalizada → grafias originais do dicionário (ex.: `faca` → `faca`, `faça`; `coracoes` → `corações`).
- **Durante a rodada**, o celular mostra a palavra como o jogador a formou, em maiúsculas sem acento ("FACA").
- **No resultado da rodada**, a TV mostra as grafias reais ao lado: "FACA (faca, faça)", "CORACOES (corações)". Quando a única grafia é igual à normalizada, nada é acrescentado.
- O mapa fica só no servidor e é carregado sob demanda para montar os resultados. O tamanho será medido no marco 1.

---

## 6. Arquitetura

### 6.1 Infraestrutura (custo zero)
- **Cloudflare Workers + Durable Objects** (plano Free, backend SQLite), com **um Durable Object por sala** e WebSocket nativo com Hibernation.
- **Arquivos estáticos** (TV e celular) no mesmo domínio, via Workers Static Assets. `npm run assets:build` monta a pasta `packages/server/public/` com os dois clientes e o pacote de idioma. O Worker só serve uma lista fechada de caminhos (`/tv`, `/`, `/<CÓDIGO>` e os arquivos dos clientes), e o pacote de idioma responde 404.
- Subdomínio grátis `bwords.<usuario>.workers.dev`.
- **WebRTC P2P foi descartado:** ainda exige um servidor de sinalização, o suporte nas TVs é incerto e redes 4G/CGNAT precisam de TURN.

### 6.2 Servidor autoritativo e validação
- O celular envia o **caminho** (posições das peças). O servidor verifica três coisas:
  - as peças são adjacentes;
  - nenhuma peça se repete;
  - a palavra está no conjunto de soluções pré-calculado, respeitando o filtro de palavrões.
- Limite de ~10 envios por segundo por jogador.
- **Feedback otimista:** no início da rodada, o celular recebe os **hashes salgados** das soluções (com um sal secreto por rodada). Com eles, mostra ✓/✗ na hora, e o servidor confirma e pontua em seguida.
- O celular nunca recebe o dicionário nem as palavras em texto.
- O timer é transmitido como "termina em T", com o relógio sincronizado via ping. A animação roda localmente, sem mensagens por segundo.
- Heartbeat e reconexão automática com espera progressiva (backoff).

### 6.3 Stack

```
bwords/
├─ packages/core/       # regras puras: normalização, gerador, solver, pontuação, protocolo, tipos;
│                       # em src/client/, a conexão, o relógio e as posições usados pelos dois clientes
├─ packages/server/     # Worker + Durable Object (sala)
├─ packages/phone/      # Preact: cliente do celular
├─ packages/tv/         # Preact: cliente da TV
├─ packages/theme/      # tokens de cor, tipografia e espaços
├─ languages/pt-BR/     # extra.txt, blocklist.txt, profanity.txt, config do pacote
├─ tools/dict-build/    # pipeline VERO → binário compacto
├─ tools/assets-build/  # monta a pasta de assets do Worker
└─ docs/
```

- **TypeScript** em todo o monorepo.
- **Front:** **Preact** + CSS. Sem PixiJS, WebGL nem canvas.
  - As animações usam só `transform`/`opacity`.
  - O build é transpilado para **`chrome53`** (ES2015 + polyfills mínimos).
  - O layout usa flexbox com margens, sem depender de CSS Grid ou flexbox `gap`.
- **TVs-alvo:** modelos de **~2018 em diante** (Tizen 4 / webOS 4).
- O `core` é independente do runtime, o que permite migrar o servidor para Node sem reescrever as regras.

### 6.4 Desempenho
- Validação em O(tamanho da palavra), consultando o conjunto de soluções pré-calculado.
- Celular: touch-action/overscroll bloqueados e área de toque um pouco menor que a peça, para facilitar as diagonais.
- TV: poucos nós no DOM, sem `blur`/`box-shadow` animados e sons sintetizados na hora.
- **Orçamento (critério de pronto, medido no CI):**

| Métrica | Meta |
|---|---|
| Bundle da TV | < 60 KB gzip |
| Tabuleiro visível após o "já" | < 1 s |
| Feedback ✓/✗ no celular | < 50 ms |
| Animações na TV | ≥ 30 fps numa TV de 2018, ou no Chrome com CPU limitada em 4x |

---

## 7. Qualidade e entrega

- **Repositório:** público no GitHub, licença **MIT** para o código. O dicionário mantém a licença do VERO (LGPL/MPL).
- **Testes:**
  - **Vitest** no `core`: gerador, solver, pontuação, normalização e validação.
  - **Playwright** para E2E, com TV + vários celulares como contextos separados. Cobre também reconexão, troca de anfitrião, entrada atrasada e as metas de desempenho.
- **CI/CD:** GitHub Actions com testes e deploy na Cloudflare a cada push na `main`.

---

## 8. Marcos

0. **Protótipo de risco:** gerar o binário do VERO, medir o tamanho e medir o tempo de carga e do solver num 6x6 dentro de um Durable Object no plano Free (limites de CPU). Se estourar, o plano B é um formato que dispensa conversão na carga (o servidor usa o binário direto) ou um dicionário mais enxuto.
1. **Core + dicionário:** pipeline de build, normalização, gerador, solver, pontuação e testes. Jogável sozinho no navegador, para calibrar os tabuleiros.
2. **Servidor:** sala no Durable Object, protocolo, anfitrião, reconexão, persistência e expiração configurável.
3. **Celular:** entrada na sala, apelido e cor, tabuleiro com deslizar, feedback, preferências e menu do anfitrião.
4. **TV:** lobby com QR, rodada, página de palavras, resultado com a maior palavra e o vencedor, áudio e o Worker servindo os dois clientes.
5. **Polimento:** filtro de palavrões no gerador, E2E, CI/deploy, orçamento de desempenho e teste em TV real.

---

## 9. Fora do MVP (versões futuras)

- Conta do anfitrião, com ranking persistente e apelidos/cores salvos por residência. O anfitrião passa a ser o usuário logado.
- Biblioteca gratuita de avatares.
- Modos cooperativo e por turnos.
- Outros idiomas de dicionário e de interface.
- Música de fundo.
