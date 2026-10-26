# M0 Dictionary Spike Specification

**Approved**: 2026-10-26 - user: "sim"

## Problem Statement

O BWords valida palavras e gera tabuleiros no servidor, dentro de um Durable Object no plano Free da Cloudflare (128 MB de memória por isolate, 30 s de CPU por mensagem, 1 s de inicialização do escopo global). Antes de construir o resto, precisamos saber se o dicionário pt-BR completo (VERO expandido) cabe nesse ambiente e se carregar o dicionário, rodar o solver e gerar tabuleiros 6x6 ficam dentro de um orçamento aceitável. Se não couber, o plano B (outro formato ou um dicionário enxuto) precisa ser decidido agora, antes do marco 1.

## Goals

- [ ] Gerar um binário compacto e determinístico do dicionário pt-BR a partir do VERO, numa versão fixada
- [ ] Medir na Cloudflare real o tamanho, a memória, a carga a frio, o solver 6x6 e a geração de tabuleiro 6x6, contra os limites de D3
- [ ] Entregar `docs/m0-results.md` com um veredito por critério e a recomendação de seguir com o plano ou adotar o plano B

## Out of Scope

| Feature | Reason |
| --- | --- |
| `extra.txt`, `blocklist.txt`, `profanity.txt` | Ficam para o marco 1 (D6) |
| Pontuação, salas, WebSocket, protocolo | Ficam para os marcos 1 e 2 |
| Interface de TV e celular | Ficam para os marcos 3 e 4 |
| CI/CD e deploy permanente | Fica para o marco 5; o deploy do M0 é temporário (D1) |
| Push para o GitHub | Só quando o usuário pedir (D7) |
| Evitar palavrões no gerador | Depende do `profanity.txt` (marco 1) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| D1 - Deploy de teste | Publicar `bwords-m0-spike` no workers.dev da conta do usuário, medir e remover com `wrangler delete` | Medir de verdade exige a Cloudflare real; o simulador local não reproduz os limites | y |
| D2 - O que é descartável | `tools/dict-build/` e `packages/core` (formato do dicionário, solver, gerador) com qualidade de produção; `spikes/m0/` descartável | O pipeline, o formato e o solver são peças do marco 1 | y |
| D3 - Limites de aprovação | Binário ≤ 10 MB; memória ≤ 64 MB; carga a frio ≤ 500 ms (mediana de 5 amostras, E2); solver 6x6 p95 ≤ 50 ms de CPU; geração 6x6 ≤ 1 s | Metade do limite de memória dá margem para o estado da sala; carga e geração imperceptíveis para os jogadores | y |
| D4 - Versionamento | VERO baixado no build numa versão fixada por commit; binário gerado no `.gitignore` | Repositório leve; build reproduzível | y |
| D5 - Relatório | `docs/m0-results.md` com números, veredito por critério, contagens por filtro e amostras | Deixa a decisão do plano B auditável | y |
| D6 - Filtros no M0 | Só os filtros base; o solver já trata "Qu" | A peça "Qu" muda a contagem de palavras do tabuleiro | y |
| D7 - Git | Commits locais por tarefa, sem push | Ação remota só com pedido explícito | y |
| Gerenciador do monorepo | npm workspaces, TypeScript, Vitest | Já vem com o Node 24; pnpm não está instalado. Recomendação aceita com "pode seguir" | y |
| Medição de CPU | CPU por invocação lida dos dados da própria Cloudflare (`wrangler tail` / analytics), com uma operação por requisição | No runtime de Workers, `performance.now()` não avança durante execução síncrona, então não dá para cronometrar CPU por dentro | y - fato de plataforma |
| Medição de memória | O Workers não expõe uso de heap. A memória é medida no Node (`process.memoryUsage()` após carregar), e na Cloudflare se comprova que carrega sem erro de memória | Única medida disponível; o Node usa o mesmo V8 | y - fato de plataforma |
| Cópias por letra no gerador | Máximo de 4 cópias da mesma letra | DESIGN §5.4 fala em "~3–4"; 4 dá mais chance a pares como RR e SS | y - delegado ("você decide" nos defaults do DESIGN) |
| Mínimo de palavras por tabuleiro | 4x4 ≥ 40, 5x5 ≥ 80, 6x6 ≥ 120, com tamanho mínimo de palavra 3 | Valores iniciais do DESIGN §5.4, a calibrar com o relatório | y |
| E1 - Flags UTF-8 do VERO | O build trata cada flag do `.aff`/`.dic` como um caractere UTF-8 inteiro antes ou durante a expansão | O `unmunch` lia as flags byte a byte e gerava formas falsas ("heptaugadora", "zooorganica"); 11,6 M palavras infladas | y - user: "sim para E1 e E2" (2026-10-26) |
| E2 - Amostragem da carga a frio | 5 cargas a frio, cada uma num Durable Object novo, após uma requisição que aquece o asset; veredito pela mediana; novo deploy temporário removido ao final | A amostra única de 688 ms foi feita com o asset fora do cache, logo após o deploy, com 4 ms de CPU | y - user: "sim para E1 e E2" (2026-10-26) |
| Tentativas do gerador | Até 200 tentativas antes de falhar | Limite que evita laço infinito; o relatório mostra a média real | y - delegado |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Build do dicionário ⭐ MVP

**User Story**: Como desenvolvedor, quero um comando que transforme o VERO pt_BR num binário compacto e reproduzível, para que o servidor valide palavras sem depender de arquivos de texto.

**Why P1**: Sem o binário não há nada para medir.

**Acceptance Criteria**:

1. WHEN o desenvolvedor executa `npm run dict:build` THEN o sistema SHALL baixar `pt_BR.dic` e `pt_BR.aff` do repositório LibreOffice/dictionaries no commit fixado em `tools/dict-build/source.json`
2. WHEN o build expande o dicionário THEN o sistema SHALL gerar as formas com o `unmunch` executado no WSL (Windows) ou nativamente (Linux)
11. WHEN o `.aff` declara `FLAG UTF-8` THEN o sistema SHALL tratar cada flag como um caractere UTF-8 inteiro, de modo que duas flags que compartilham o primeiro byte nunca apliquem as regras uma da outra (E1)
3. IF uma forma expandida contém uma letra maiúscula THEN o sistema SHALL descartá-la
4. IF uma forma expandida contém um caractere que não é letra (hífen, apóstrofo, dígito, ponto) THEN o sistema SHALL descartá-la
5. The system SHALL normalizar cada forma mantida para letras `a`–`z`, removendo diacríticos e convertendo `ç` em `c`
6. IF uma forma normalizada tem menos de 3 ou mais de 16 letras THEN o sistema SHALL descartá-la
7. WHEN duas formas resultam na mesma palavra normalizada THEN o sistema SHALL guardá-la uma única vez
8. WHEN o build termina THEN o sistema SHALL gravar `tools/dict-build/dist/pt-BR.dict.bin` e `tools/dict-build/dist/pt-BR.stats.json` com a contagem de formas após cada filtro
9. WHEN o build roda duas vezes sobre o mesmo commit fixado THEN o sistema SHALL produzir binários idênticos byte a byte
10. IF o download falha ou o `unmunch` não é encontrado THEN o sistema SHALL encerrar com código diferente de zero e uma mensagem que nomeia o que faltou

**Independent Test**: Rodar `npm run dict:build`, conferir que o `.bin` e o `stats.json` existem e que um segundo build gera o mesmo hash.

---

### P1: Consulta ao dicionário ⭐ MVP

**User Story**: Como servidor do jogo, quero carregar o binário e consultar palavras e prefixos, para validar envios e alimentar o solver.

**Why P1**: É a operação que o Durable Object executa ao acordar e o solver usa a todo momento.

**Acceptance Criteria**:

1. WHEN o binário é carregado de um `ArrayBuffer` THEN `has(word)` SHALL retornar `true` para toda palavra gravada pelo build
2. WHEN `has(word)` recebe uma palavra que o build não gravou THEN o sistema SHALL retornar `false`
3. WHEN `hasPrefix(prefix)` recebe o prefixo de alguma palavra gravada THEN o sistema SHALL retornar `true`, e `false` caso contrário
4. IF o `ArrayBuffer` não começa com o cabeçalho e a versão do formato esperados THEN o sistema SHALL lançar um erro que nomeia o problema

**Independent Test**: Montar um binário a partir de uma lista fixa de palavras e consultar palavras, não-palavras e prefixos.

---

### P1: Solver ⭐ MVP

**User Story**: Como servidor do jogo, quero encontrar todas as palavras válidas de um tabuleiro, para validar envios e escolher a maior palavra.

**Why P1**: O solver é o que roda a cada tabuleiro gerado e um dos números a medir.

**Acceptance Criteria**:

1. WHEN o solver recebe um tabuleiro NxN (N = 4, 5 ou 6) e um tamanho mínimo THEN o sistema SHALL retornar exatamente o conjunto de palavras do dicionário formáveis ligando peças adjacentes nas 8 direções
2. The system SHALL usar cada peça no máximo uma vez por palavra
3. WHEN uma peça é "Qu" THEN o sistema SHALL tratá-la como a sequência `qu` na palavra formada
4. IF uma palavra tem menos letras que o tamanho mínimo THEN o sistema SHALL deixá-la fora do resultado
5. IF o tabuleiro não é quadrado de lado 4, 5 ou 6, ou contém uma peça fora do alfabeto do idioma THEN o sistema SHALL lançar um erro

**Independent Test**: Resolver tabuleiros 4x4 montados à mão com um dicionário pequeno e comparar com a lista esperada.

---

### P1: Gerador de tabuleiros ⭐ MVP

**User Story**: Como servidor do jogo, quero gerar tabuleiros com palavras suficientes, para que toda rodada seja jogável.

**Why P1**: O tempo de geração do 6x6 é um dos critérios de D3.

**Acceptance Criteria**:

1. The system SHALL sortear as letras com pesos iguais à frequência de cada letra nas palavras do dicionário
2. The system SHALL limitar a 4 o número de cópias de uma mesma letra no tabuleiro
3. The system SHALL representar o Q apenas como a peça "Qu"
4. WHEN o gerador recebe um tamanho N e uma semente THEN o sistema SHALL retornar um tabuleiro cujo solver encontre pelo menos 40 (4x4), 80 (5x5) ou 120 (6x6) palavras de 3 ou mais letras
5. WHEN o gerador recebe a mesma semente e o mesmo dicionário THEN o sistema SHALL retornar o mesmo tabuleiro
6. IF 200 tentativas não produzem um tabuleiro válido THEN o sistema SHALL lançar um erro com o número de tentativas

**Independent Test**: Gerar tabuleiros com sementes fixas e conferir as contagens, o limite de cópias e a repetibilidade.

---

### P1: Medição na Cloudflare ⭐ MVP

**User Story**: Como desenvolvedor, quero medir dicionário, solver e gerador dentro de um Durable Object real no plano Free, para decidir se o plano se mantém.

**Why P1**: É o objetivo do marco.

**Acceptance Criteria**:

1. WHEN o Durable Object do spike recebe a primeira requisição após ser criado THEN o sistema SHALL buscar o binário nos static assets do Worker, carregá-lo e responder com o tempo de parede da carga
7. WHEN o script de medição mede a carga a frio THEN o sistema SHALL registrar 5 amostras, cada uma num Durable Object novo, depois de uma requisição de aquecimento do asset, e o veredito SHALL usar a mediana (E2)
2. WHEN o script de medição roda contra o spike publicado THEN o sistema SHALL executar uma operação por requisição (carga a frio, 100 resoluções de 6x6 e 20 gerações de 6x6, cada uma isolada)
3. WHEN as requisições terminam THEN o sistema SHALL registrar o tempo de CPU de cada uma a partir dos dados de invocação da Cloudflare
4. WHEN o script de medição local roda no Node THEN o sistema SHALL registrar o heap usado depois de carregar o dicionário
5. IF a Cloudflare rejeitar a carga do binário (por exemplo, por excesso de memória) THEN o sistema SHALL registrar o erro como FALHA do critério de memória
6. WHEN as medições terminam THEN o sistema SHALL remover o Worker `bwords-m0-spike` com `wrangler delete`

**Independent Test**: Publicar o spike, rodar o script e verificar que cada operação gerou um registro de CPU.

---

### P1: Relatório de resultados ⭐ MVP

**User Story**: Como dono do projeto, quero um relatório objetivo, para decidir entre seguir com o plano ou adotar o plano B.

**Why P1**: O relatório é a entrega do marco.

**Acceptance Criteria**:

1. WHEN as medições terminam THEN `docs/m0-results.md` SHALL listar, para cada critério de D3, o valor medido, o limite e o veredito PASSA ou FALHA
2. The system SHALL incluir no relatório a contagem de formas após cada filtro do build
3. The system SHALL incluir no relatório 50 palavras aceitas e 50 formas descartadas, sorteadas com semente fixa
4. IF algum critério FALHA THEN o relatório SHALL recomendar uma alternativa de plano B ligada àquele critério
5. The system SHALL registrar no relatório o commit do VERO usado e a confirmação de que o Worker foi removido

**Independent Test**: Abrir o relatório e conferir que cada critério de D3 tem valor, limite e veredito.

---

## Edge Cases

- IF a saída do `unmunch` passar de 1 GB THEN o build SHALL processá-la em streaming, sem guardar a saída bruta na memória
- IF o `.dic` ou o `.aff` usarem uma codificação diferente de UTF-8 THEN o build SHALL convertê-los conforme a diretiva `SET` do `.aff`
- WHEN um tabuleiro tem várias peças com a mesma letra THEN o solver SHALL tratá-las como peças distintas (ex.: "erros" usa duas peças R)

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DICT-01 | P1: Build do dicionário (AC 1-2, 11) | Tasks | Pending |
| DICT-02 | P1: Build do dicionário (AC 3-7) | Tasks | Pending |
| DICT-03 | P1: Build do dicionário (AC 8-10) | Tasks | Pending |
| LOOK-01 | P1: Consulta ao dicionário (AC 1-4) | Tasks | Pending |
| SOLV-01 | P1: Solver (AC 1-5) | Tasks | Pending |
| GEN-01 | P1: Gerador de tabuleiros (AC 1-6) | Tasks | Pending |
| BENCH-01 | P1: Medição na Cloudflare (AC 1-7) | Tasks | Pending |
| REP-01 | P1: Relatório de resultados (AC 1-5) | Tasks | Pending |

**Coverage:** 8 total, 0 mapped to tasks, 8 unmapped ⚠️ (mapeados na fase Tasks)

---

## Sources

- `docs/DESIGN.md` §5.2, §5.4, §6.1, §8 - fonte do dicionário, filtros, gerador, infraestrutura e o marco 0
- Respostas D1-D7 do usuário nesta sessão (2026-10-26): "sim para todos"
- https://developers.cloudflare.com/workers/platform/limits/ - 128 MB por isolate, 1 s de inicialização, 25 MiB por asset
- https://developers.cloudflare.com/durable-objects/platform/limits/ - 30 s de CPU por requisição ou mensagem

---

## Success Criteria

- [ ] `docs/m0-results.md` traz um veredito PASSA/FALHA para cada um dos 5 critérios de D3
- [ ] O Worker `bwords-m0-spike` não existe mais na conta ao final
- [ ] O build do dicionário é reproduzível byte a byte
