# M1 Dictionary Pack and Game Rules Specification

**Approved**: 2026-10-26 - user: "aprovo"

## Problem Statement

O marco 0 provou que o dicionário pt-BR completo cabe e roda rápido na Cloudflare, mas ainda falta transformá-lo num **pacote de idioma** do jogo. Hoje o build não aceita palavras extras nem remoções, não marca palavrões, não guarda as grafias com acento para exibição (A1), deixa passar formas espúrias do VERO e trata como iguais palavras comuns e raríssimas, o que leva a "maior palavra possível" a ser quase sempre uma palavra obscura. A pontuação ainda não existe em código, e os mínimos do gerador (40/80/120) nunca barram nenhum tabuleiro, porque um 6x6 tem de 408 a 4.240 palavras válidas. Sem uma página para jogar sozinho, não há como sentir e calibrar os tabuleiros antes de construir as salas.

## Goals

- [ ] Gerar `dist/pt-BR/` a partir de `languages/pt-BR/` com o dicionário, os conjuntos de palavras comuns e de palavrões, o mapa de grafias e os metadados de calibração
- [ ] Ter no `core` a pontuação, a escolha da maior palavra e a validação de envios com o filtro de palavrões e o tamanho mínimo
- [ ] Rejeitar no gerador os 10% de tabuleiros mais pobres em palavras comuns
- [ ] Jogar sozinho numa página local de desenvolvimento para calibrar

## Out of Scope

| Feature | Reason |
| --- | --- |
| Salas, WebSocket, protocolo, anfitrião | Marco 2 |
| Telas de TV e celular | Marcos 3 e 4 |
| Deploy da página solo ou do pacote | A página é só para desenvolvimento (M1-Q2); deploy fica para o marco 5 |
| Conteúdo do `profanity.txt` | O usuário define depois: "deixe o profanity vazio por enquanto" (M1-Q11) |
| Curadoria de palavrões a partir da LDNOOBW | "Pode permitir palavrões por enquanto" (M1-Q10) |
| Hashes salgados das soluções para o celular (DESIGN §6.2) | Pertence ao protocolo da sala, marco 2 |
| Outros idiomas | O pacote fica preparado para eles, mas só o pt-BR é construído |
| Push para o GitHub | Só com pedido explícito |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| M1-Q1 - Escopo | Pacote de idioma, `.txt`, grafias, limpeza do VERO, pontuação, gerador com filtro, página solo | Acabamento do dicionário e das regras antes das salas | y - user: "a especificação está boa" |
| M1-Q2 - Página solo | `tools/play`, Preact + Vite, `npm run play`, sem deploy | Calibração e base de front para os marcos 3 e 4 | y |
| M1-Q3 - Palavras comuns | Todas as palavras valem; as comuns são marcadas para escolher a maior palavra, calibrar e destacar na página solo | Evita que o resultado mostre palavras obscuras | y |
| M1-Q4 - Filtro de palavrões | Com o filtro ligado, palavrões não valem, não contam e nunca são a maior palavra; o gerador descarta tabuleiros com palavrão de 4+ letras em linha reta | Jogo de família | y |
| M1-Q5 - Calibração | Mínimo por tamanho = percentil 10 da contagem de palavras comuns em 1.000 tabuleiros sorteados no build | Rejeita os 10% mais pobres de forma objetiva | y |
| M1-Q6 - Formato do pacote | `languages/pt-BR/pack.json` (configuração) + `.txt` (listas); saída em `dist/pt-BR/` | JSON para configuração, texto para listas | y |
| M1-Q7 - Regras dos `.txt` | Uma palavra por linha, `#` comenta; `extra.txt` aceita acento e passa pelos filtros; `blocklist.txt` remove a forma normalizada exata; palavra nas duas listas faz o build falhar | Edição simples e sem ambiguidade | y |
| M1-Q8 - Limpeza do VERO | Remover as entradas `FORBIDDENWORD` e as formas que o VERO só gera como pedaço de ênclise/mesóclise; o relatório do build conta cada remoção com exemplos | Formas espúrias ("enfronhamo") e palavras proibidas | y |
| M1-Q9 - Fonte de frequência | FrequencyWords `pt_br_full`, commit `525f9b560de45753a5ea01069454e72e9aa541c6`; comuns = top 50.000 formas; `NOTICE` com atribuição CC-BY-SA 4.0 (Hermit Dave, OpenSubtitles 2018) | Única fonte pt-BR estável e fixável; no rank 100 mil já domina lixo | y - user: "SIM" |
| M1-Q10/Q11 - Palavrões | `profanity.txt` existe e fica vazio; todo o mecanismo (marcação, filtro, gerador) é construído e testado com fixtures | O usuário define a lista depois; quando ela existir, basta preencher o arquivo | y - user: "deixe o profanity vazio por enquanto" |
| Filtro com lista vazia | O filtro continua ligado por padrão (DESIGN §1.2) e, com a lista vazia, não muda nada | Mantém o padrão do DESIGN sem efeito até a lista existir | y - consequência direta de M1-Q11 |
| Colisões na frequência | Formas que viram a mesma palavra sem acento somam as contagens antes do ranking | Recomendação da pesquisa; "faca" e "faça" contam juntas | y - delegado |
| Maior palavra sem comuns | Se o tabuleiro não tiver nenhuma palavra comum, a maior palavra sai do conjunto inteiro, com as mesmas regras de desempate | Garante que sempre exista uma maior palavra | y - delegado |
| Grafias guardadas | Só as palavras com alguma grafia diferente da normalizada entram no mapa | Mapa menor; a ausência significa "grafia = forma normalizada" | y - delegado |
| Página solo e filtro | A página solo usa o tamanho mínimo e o filtro escolhidos nela, com 3 letras e filtro ligado como padrão | Reproduz as opções da sala | y - delegado |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Pacote de idioma ⭐ MVP

**User Story**: Como desenvolvedor, quero descrever um idioma em `languages/<id>/` e gerar o pacote com um comando, para que o jogo carregue qualquer idioma do mesmo jeito.

**Why P1**: Todo o resto do marco lê o pacote.

**Acceptance Criteria**:

1. WHEN o desenvolvedor executa `npm run dict:build -- pt-BR` THEN o sistema SHALL ler `languages/pt-BR/pack.json` e gravar `dist/pt-BR/` com o dicionário, os conjuntos de comuns e de palavrões, o mapa de grafias, `meta.json` e `stats.json`
2. The system SHALL ler de `pack.json` o alfabeto, as peças compostas, a regra de normalização, o tamanho mínimo padrão e as fontes fixadas por commit (VERO e FrequencyWords)
3. IF `pack.json` não tiver um campo obrigatório THEN o sistema SHALL encerrar com código diferente de zero e uma mensagem que nomeia o campo
4. WHEN o build roda duas vezes sobre as mesmas entradas THEN o sistema SHALL produzir todos os arquivos de `dist/pt-BR/` idênticos byte a byte, exceto os tempos registrados em `stats.json`
5. The system SHALL incluir na raiz do repositório um `NOTICE` com a atribuição da FrequencyWords (CC-BY-SA 4.0, Hermit Dave, OpenSubtitles 2018) e do VERO (LGPLv3/MPL)

**Independent Test**: Rodar o build e conferir os arquivos de `dist/pt-BR/` e o hash de dois builds.

---

### P1: Listas editáveis ⭐ MVP

**User Story**: Como desenvolvedor, quero adicionar e remover palavras com arquivos de texto, para corrigir o dicionário sem mexer no código.

**Why P1**: É a manutenção do dicionário prevista no DESIGN §5.3.

**Acceptance Criteria**:

1. WHEN uma linha de um `.txt` do pacote começa com `#` ou está em branco THEN o sistema SHALL ignorá-la
2. WHEN `extra.txt` contém uma palavra THEN o sistema SHALL normalizá-la, aplicar os filtros de tamanho e de letras e gravá-la no dicionário
3. WHEN uma palavra de `extra.txt` tem acento THEN o sistema SHALL gravar a grafia original no mapa de grafias da forma normalizada
4. IF uma palavra de `extra.txt` não passa nos filtros THEN o sistema SHALL encerrar com código diferente de zero e uma mensagem com a palavra, a linha e o motivo
5. WHEN `blocklist.txt` contém uma palavra THEN o sistema SHALL remover do dicionário a forma normalizada exata, com todas as suas grafias
6. IF a mesma forma normalizada está em `extra.txt` e em `blocklist.txt` THEN o sistema SHALL encerrar com código diferente de zero e uma mensagem com a palavra e as duas linhas
7. WHEN o build termina THEN `stats.json` SHALL registrar quantas palavras `extra.txt` acrescentou e quantas `blocklist.txt` removeu

**Independent Test**: Com fixtures, adicionar "rolê", bloquear uma palavra do VERO e conferir o dicionário e o mapa de grafias.

---

### P1: Limpeza do VERO ⭐ MVP

**User Story**: Como jogador, quero que só palavras reais sejam aceitas, para que ninguém ganhe pontos com formas que não existem.

**Why P1**: Formas espúrias e palavras proibidas quebram a confiança no jogo.

**Acceptance Criteria**:

1. WHEN uma entrada do `.dic` carrega a flag `FORBIDDENWORD` declarada no `.aff` THEN o sistema SHALL excluir do dicionário a forma dessa entrada
2. WHEN o VERO gera uma forma apenas como pedaço de ênclise ou mesóclise THEN o sistema SHALL excluí-la do dicionário
3. WHEN o build termina THEN `stats.json` SHALL registrar a contagem e até 20 exemplos de cada limpeza

**Independent Test**: Conferir que "enfronhamo" e as 12 palavras proibidas não estão no dicionário e que "enfronhamos" está.

---

### P1: Palavras comuns ⭐ MVP

**User Story**: Como jogador, quero que o resultado destaque palavras que eu conheço, para que a "maior palavra possível" faça sentido.

**Why P1**: A maior palavra e a calibração dependem disso.

**Acceptance Criteria**:

1. The system SHALL marcar como comum toda palavra do dicionário que esteja entre as 50.000 formas mais frequentes da FrequencyWords depois da normalização
2. WHEN duas formas da FrequencyWords viram a mesma palavra normalizada THEN o sistema SHALL somar as contagens antes do ranking
3. IF uma forma da lista de frequência não está no dicionário THEN o sistema SHALL ignorá-la
4. WHEN o pacote é carregado THEN `isCommon(word)` SHALL retornar `true` para as palavras comuns e `false` para as demais

**Independent Test**: Conferir que "casa" e "celular" são comuns e que "heptassilabo" não é.

---

### P1: Palavrões ⭐ MVP

**User Story**: Como anfitrião, quero que palavrões não valham quando o filtro está ligado, para jogar com a família.

**Why P1**: O filtro é uma opção da sala (DESIGN §1.2); a lista fica vazia por ora (M1-Q11).

**Acceptance Criteria**:

1. WHEN `profanity.txt` contém uma palavra THEN o sistema SHALL marcá-la como palavrão no pacote, sem removê-la do dicionário
2. WHEN o pacote é carregado THEN `isProfane(word)` SHALL retornar `true` para as palavras marcadas e `false` para as demais
3. IF uma palavra de `profanity.txt` não está no dicionário THEN o sistema SHALL encerrar o build com código diferente de zero e uma mensagem com a palavra
4. WHILE o filtro de palavrões está ligado o sistema SHALL tratar palavrões como inválidos na validação, na contagem do tabuleiro e na escolha da maior palavra
5. WHILE o filtro de palavrões está desligado o sistema SHALL tratar palavrões como palavras comuns do dicionário
6. WHILE o filtro de palavrões está ligado, WHEN o gerador sorteia um tabuleiro com um palavrão de 4 ou mais letras legível em linha reta (linha, coluna ou diagonal, nos dois sentidos) THEN o sistema SHALL descartá-lo e sortear de novo
7. The system SHALL publicar o pacote pt-BR com `profanity.txt` vazio

**Independent Test**: Com uma fixture de palavrões, validar uma palavra com o filtro ligado e desligado e gerar tabuleiros sem palavrão em linha reta.

---

### P1: Grafias de exibição ⭐ MVP

**User Story**: Como jogador, quero ver no resultado as palavras com acento, para reconhecer "faça" e "corações".

**Why P1**: Decisão A1 (DESIGN §5.5).

**Acceptance Criteria**:

1. WHEN uma forma normalizada tem alguma grafia diferente dela no VERO ou em `extra.txt` THEN o sistema SHALL guardar todas as suas grafias distintas no mapa, em ordem alfabética
2. WHEN `spellings(word)` recebe uma palavra com entrada no mapa THEN o sistema SHALL retornar as grafias guardadas
3. WHEN `spellings(word)` recebe uma palavra do dicionário sem entrada no mapa THEN o sistema SHALL retornar uma lista com a própria palavra
4. WHEN o build termina THEN `stats.json` SHALL registrar o tamanho em bytes do mapa e o número de entradas

**Independent Test**: `spellings("faca")` retorna `["faca", "faça"]` e `spellings("casa")` retorna `["casa"]`.

---

### P1: Validação e pontuação ⭐ MVP

**User Story**: Como servidor do jogo, quero validar envios e pontuar a rodada com uma função pura, para que salas, testes e página solo usem as mesmas regras.

**Why P1**: É a regra central do jogo (DESIGN §1.3-1.4).

**Acceptance Criteria**:

1. WHEN um envio traz um caminho de peças adjacentes, sem repetir peça, que forma uma palavra das soluções do tabuleiro com pelo menos o tamanho mínimo da sala THEN o sistema SHALL aceitá-lo
2. IF o caminho repete uma peça, tem peças não adjacentes ou sai do tabuleiro THEN o sistema SHALL rejeitá-lo com o motivo `invalid-path`
3. IF a palavra formada é menor que o tamanho mínimo da sala THEN o sistema SHALL rejeitá-la com o motivo `too-short`
4. IF a palavra formada não está entre as soluções válidas com o filtro atual THEN o sistema SHALL rejeitá-la com o motivo `not-a-word`
5. IF o jogador já tinha a palavra THEN o sistema SHALL rejeitá-la com o motivo `already-found`
6. The system SHALL pontuar cada palavra pelo número de letras da forma normalizada: 3 = 1, 4 = 2, 5 = 3 e +1 por letra a mais
7. WHEN só um jogador encontrou uma palavra THEN o sistema SHALL dar a ele o dobro dos pontos dela
8. WHEN dois ou mais jogadores encontraram a mesma palavra THEN o sistema SHALL dar a cada um os pontos simples dela e listá-la como palavra em comum
9. The system SHALL não descontar pontos por envios rejeitados

**Independent Test**: Pontuar uma rodada de 3 jogadores com palavras únicas e em comum e conferir os totais.

---

### P1: Maior palavra possível ⭐ MVP

**User Story**: Como jogador, quero ver no resultado a maior palavra do tabuleiro, para saber o que deixei passar.

**Why P1**: Faz parte do resultado da rodada (DESIGN §4.3).

**Acceptance Criteria**:

1. WHEN o tabuleiro tem palavras comuns válidas THEN o sistema SHALL escolher a maior palavra entre as comuns
2. WHEN várias candidatas empatam no tamanho THEN o sistema SHALL preferir uma que algum jogador encontrou
3. WHEN o empate continua THEN o sistema SHALL escolher a primeira em ordem alfabética
4. IF o tabuleiro não tem nenhuma palavra comum válida THEN o sistema SHALL escolher a maior entre todas as soluções válidas, com os mesmos desempates
5. WHEN a maior palavra foi encontrada THEN o sistema SHALL informar quais jogadores a encontraram

**Independent Test**: Com soluções e envios montados à mão, conferir cada desempate.

---

### P1: Calibração do gerador ⭐ MVP

**User Story**: Como jogador, quero tabuleiros com palavras conhecidas suficientes, para que toda rodada seja divertida.

**Why P1**: Os mínimos atuais não barram nenhum tabuleiro.

**Acceptance Criteria**:

1. WHEN o build termina THEN o sistema SHALL sortear 1.000 tabuleiros de cada tamanho com sementes fixas e gravar em `meta.json` o percentil 10 da contagem de palavras comuns válidas como mínimo daquele tamanho
2. WHEN o gerador sorteia um tabuleiro com menos palavras comuns válidas que o mínimo de `meta.json` THEN o sistema SHALL descartá-lo e sortear de novo
3. WHEN o build termina THEN `stats.json` SHALL registrar, por tamanho, o mínimo, a mediana e o máximo de palavras comuns dos 1.000 tabuleiros
4. IF 200 tentativas não produzem um tabuleiro válido THEN o sistema SHALL lançar um erro com o número de tentativas

**Independent Test**: Gerar 200 tabuleiros 4x4 e conferir que todos atingem o mínimo de `meta.json`.

---

### P2: Página de jogo solo

**User Story**: Como desenvolvedor, quero jogar sozinho no navegador, para sentir os tabuleiros e calibrar as regras.

**Why P2**: Ajuda a calibrar, mas as regras já são testadas pelo core.

**Acceptance Criteria**:

1. WHEN o desenvolvedor executa `npm run play` THEN o sistema SHALL servir a página solo em `http://localhost:5173` com o pacote pt-BR carregado
2. WHEN o desenvolvedor escolhe tamanho e semente e usa "Novo tabuleiro" THEN a página SHALL mostrar o tabuleiro gerado com aquela semente
3. WHEN o desenvolvedor arrasta o mouse ou o dedo por peças adjacentes e solta THEN a página SHALL enviar o caminho para a validação do core
4. WHEN um envio é aceito THEN a página SHALL acrescentá-lo à lista de palavras encontradas com sua grafia de exibição e seus pontos, e atualizar o total
5. IF um envio é rejeitado THEN a página SHALL mostrar o motivo (`invalid-path`, `too-short`, `not-a-word` ou `already-found`)
6. WHEN o desenvolvedor usa "Mostrar soluções" THEN a página SHALL listar todas as soluções válidas com as comuns destacadas e indicar a maior palavra possível
7. The system SHALL mostrar na página o número de soluções válidas, o número de comuns e o mínimo de `meta.json` para aquele tamanho
8. WHEN o desenvolvedor muda o tamanho mínimo (3 ou 4) ou o filtro de palavrões THEN a página SHALL recalcular as soluções e a validação com a nova opção
9. WHILE o pacote ainda está carregando a página SHALL mostrar "Carregando dicionário…" e desabilitar o tabuleiro
10. IF o pacote não carregar THEN a página SHALL mostrar a mensagem "Não foi possível carregar o dicionário. Rode `npm run dict:build -- pt-BR`."

**Independent Test**: Abrir a página, gerar um 5x5, formar três palavras (uma inválida) e abrir as soluções.

---

## Edge Cases

- WHEN uma palavra comum também é palavrão e o filtro está ligado THEN o sistema SHALL tratá-la como inválida e não contá-la como comum
- WHEN a peça "Qu" faz parte da palavra THEN a pontuação SHALL contar as duas letras `q` e `u`
- IF o caminho de um envio tem uma única peça ou está vazio THEN o sistema SHALL rejeitá-lo com o motivo `invalid-path`

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| PACK-01 | P1: Pacote de idioma (AC 1-5) | Tasks | Pending |
| LIST-01 | P1: Listas editáveis (AC 1-7) | Tasks | Pending |
| CLEAN-01 | P1: Limpeza do VERO (AC 1-3) | Tasks | Pending |
| FREQ-01 | P1: Palavras comuns (AC 1-4) | Tasks | Pending |
| PROF-01 | P1: Palavrões (AC 1-7) | Tasks | Pending |
| SPELL-01 | P1: Grafias de exibição (AC 1-4) | Tasks | Pending |
| SCORE-01 | P1: Validação e pontuação (AC 1-9) | Tasks | Pending |
| LONG-01 | P1: Maior palavra possível (AC 1-5) | Tasks | Pending |
| CAL-01 | P1: Calibração do gerador (AC 1-4) | Tasks | Pending |
| PLAY-01 | P2: Página de jogo solo (AC 1-10) | Tasks | Pending |

**Coverage:** 10 total, 0 mapped to tasks, 10 unmapped ⚠️ (mapeados na fase Tasks)

---

## Sources

- `docs/DESIGN.md` §1.2-1.4, §4.3, §5 - regras do jogo, resultado da rodada e pacote de idioma
- `docs/m0-results.md` - 2.328.458 palavras; de 408 a 4.240 soluções por 6x6; limitações do VERO
- Respostas M1-Q1 a M1-Q11 do usuário nesta sessão (2026-10-26)
- https://github.com/hermitdave/FrequencyWords - `content/2018/pt_br/pt_br_full.txt`, CC-BY-SA 4.0
- https://github.com/LibreOffice/dictionaries - VERO pt_BR, commit `67032ee957631908098a72edf48dc81cac27e369`

---

## Success Criteria

- [ ] `npm run dict:build -- pt-BR` gera `dist/pt-BR/` reproduzível byte a byte
- [ ] A maior palavra de 20 tabuleiros 6x6 sorteados é uma palavra comum em todos eles
- [ ] Nenhum tabuleiro gerado fica abaixo do mínimo de palavras comuns do seu tamanho
- [ ] É possível jogar uma rodada solo completa na página local
