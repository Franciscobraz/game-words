# M4 TV verification

**Verdict**: FAIL
**Mutations**: 3 - probed C3 (afterWelcome, not killed), C18 (run_worker_first, killed), C7 (awardWins, killed)
**Proofs**: `proofs.md` at 642f998
**Verifier**: independent sub-agent (author != verifier)

## Mutações

| Mutação | Local | Prova | Killed |
| --- | --- | --- | --- |
| Quem conecta durante uma rodada também recebe o `round-results` guardado | `packages/core/src/room/machine.ts:198` | `npx vitest run packages/core/src/room` (a pasta inteira, de propósito) | **não** |
| Assets respondem antes do Worker (`run_worker_first: false`), e a lista fechada de rotas deixa de proteger o pacote | `packages/server/wrangler.jsonc:9` | C18 | sim |
| Vitórias contadas ao fim de toda rodada, não só da última | `packages/core/src/room/results.ts:74` | `npx vitest run packages/core/src/room` | sim |

## Exemplos próprios

Rodados em HEAD com um teste descartável em `packages/tv/src/state/`, já apagado.

1. **Um jogador só, com 0 pontos, na última rodada** (TVRES-01 AC 9 com PROTO-02 AC 7): `resultHeader` devolve "Ana venceu!" com confete, e o servidor não conta vitória. Quebra; ver a primeira linha de Findings.
2. **Reconexão numa partida nova que terminou no mesmo índice** (TVEXIT-01 AC 7): com a TV fora do ar enquanto a sala joga outra partida de mesmo `index`, `reveal.results` continua com as palavras antigas. Quebra; ver a segunda linha de Findings.

Valor a mais do mesmo teste: o relógio da TV adiantado ou atrasado 120 s numa recarga (terceira e quarta linhas de Findings).

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| A TV declara vencedor numa partida em que ninguém venceu: um jogador com 0 pontos vê "Ana venceu!" e confete, enquanto o servidor não conta vitória (C7: "numa partida com 0 pontos ninguém vence"). O spec não diz o título desse caso; com 2 ou mais jogadores em 0 o título sai "Empate!", também com confete | `packages/tv/src/model/result-header.ts:40`, `packages/core/src/room/flow.ts:17`; exemplo próprio 1 | Decisão do user para o título e o confete com placar máximo 0; novo critério em TVRES-01 e um caso em `result-header.test.ts` | `b66d0ec` - C113, C114 |
| Reconexão mostra o resultado de outra partida: o `reveal` compara só `results.index`. Se a TV cai no pódio ou no resultado da rodada N e volta com a sala de novo no resultado de uma rodada N de outra partida (jogar de novo, ou voltar ao lobby e iniciar), ela mantém o plano e as palavras antigas, e acende o caminho antigo no tabuleiro novo; contraria TVEXIT-01 AC 7. As esperas de até 60 s entre tentativas tornam o caso alcançável | `packages/tv/src/state/reveal.ts:39`; exemplo próprio 2 | Identificar a rodada planejada por `round.id` (o `welcome` traz) em vez do `index`, com um teste em `reveal.test.ts` | `ba3e5c9` - C109 |
| Numa recarga, o plano da revelação usa o relógio local: `round-results` chega antes da primeira amostra de `time`, porque a resposta ao `hello` vem primeiro. Com a TV 120 s adiantada, o resultado fica em "Tempo!" por 120 s; com 120 s de atraso, a rolagem é pulada e a tela vai direto ao resultado, contrariando TVWORDS-01 AC 11. O E2E não vê isso, porque a TV e o Worker dividem o mesmo relógio | `packages/tv/src/state/reveal.ts:41`, `packages/core/src/client/room-connection.ts:152-153`, `packages/core/src/room/machine.ts:197-199` | Adiar o plano até a primeira amostra de relógio, ou recalcular `wordsStartAt` quando ela chegar, com um teste de relógio defasado | `1d1c32a` - C110 |
| O relógio local da primeira leitura também trava os sons: `tick` guarda o maior `now` já visto, e a leitura feita na montagem, antes de qualquer amostra, ainda vale. Com a TV adiantada X s, nenhum efeito toca nos próximos X s do servidor (TVAUDIO-01 AC 1, 6) | `packages/tv/src/state/sound.ts:43`, `packages/tv/src/app.tsx:36`; teste descartável com 120 s: `round-start` não tocou | Só começar a contar os cruzamentos depois da primeira amostra de relógio, com um teste em `sound.test.ts` | `1d1c32a` - C111 |
| C3 não prova "só em `round-results`" a partir da segunda rodada: o `state.results` da rodada anterior continua guardado durante a rodada seguinte (`beginRound` não o limpa), e nada falha se ele for reenviado a quem conecta. A TV ou o celular nessa situação iria para a fase `results` com a rodada correndo | mutação `machine.ts:198` não morta; `packages/core/src/room/results.test.ts:185` parte do lobby sem resultado anterior; `packages/core/src/room/round.ts:39-50` | Um caso em `machine.test.ts`: `hello` de TV, jogador e convidado na rodada 2 com `results` preenchido só recebe o `welcome`; opcionalmente limpar `results` em `beginRound` | `9e26660` - C112 |
| C51 e C61 não seguram a velocidade que TVWORDS-01 AC 6 fixa: conferem só a duração (N / 2 s) e a posição final. A lista anda apenas o que não cabe no painel durante essa duração inteira, então a velocidade real fica abaixo de 2 palavras/s: pela composição de `tv-words.png`, cerca de 10 linhas visíveis, 13 palavras andam cerca de 5 linhas em 6,5 s (cerca de 0,8 linha/s) | `packages/tv/src/components/WordScroll.tsx:23,32`, `packages/tv/e2e/words.spec.ts:73-80`, `packages/tv/src/model/reveal.ts:27` | Decisão do user: ou calcular a duração pelo que falta rolar e medir a velocidade no E2E, ou emendar o critério para "a lista dura N / 2 s" | `773a45c` - C51, C61, C115 (critério emendado pelo user) |
| Resta um ramo que AD-023 aboliu: o lobby ainda sabe mostrar "ESPECTADOR(A)". O servidor zera a marca ao voltar ao lobby, então o ramo é código morto, com testes próprios | `packages/tv/src/model/lobby-rows.ts:63-66`, `packages/tv/src/components/LobbySlotRow.tsx:15`, `packages/tv/src/model/lobby-rows.test.ts:42-49` | Remover o status `spectator`, `spectatorTag` e os dois testes, e registrar no commit que o critério AD-023 os substitui | `8e7d43e` - C116 |

## O que foi conferido sem achado

- **Spec contra as captures:** rótulos e composição de `tv-lobby`, `tv-round`, `tv-words` e `tv-round-result` batem com os critérios e com `## Differences from the source`; nenhum controle desenhado ficou sem critério.
- **Rotas:** `clientAsset` é uma lista fechada, e `run_worker_first` é provado de verdade por C18 contra `wrangler dev`.
- **Quem recebe o quê:** `foundBy` e `possibleWords` só existem em `round-results`; `welcomeBase` não leva `solutions` nem `results`.
- **Limites:** 10 s do alerta, 60 s da rolagem, 3 e 4 no resultado, 5 e 6 na rodada, e 2 s de "Tempo!" têm check no valor exato, com a prova passando em `proofs.md`.
