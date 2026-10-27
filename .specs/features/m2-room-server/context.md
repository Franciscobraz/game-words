# M2 Room Server Context

**Gathered:** 2026-10-27
**Spec:** `.specs/features/m2-room-server/spec.md` (aprovada em 2026-10-27)
**Status:** Spec aprovada; pronto para Design

---

## Feature Boundary

Servidor autoritativo do jogo: um Durable Object por sala, protocolo WebSocket, anfitrião, reconexão, persistência e expiração configurável (DESIGN §2, §6), mais o laço completo da partida. Sem telas: celular é o M3, TV é o M4.

---

## Implementation Decisions

### Escopo do M2

- O DO roda o laço completo: lobby, configurações, contagem regressiva, rodada com timer, validação do caminho, pontuação, resultado, próxima rodada, pódio e "jogar de novo". O M3 e o M4 são só clientes.
- user: "Laço completo (Recomendado)"

### Prova do M2

- Testes de integração com Vitest + `@cloudflare/vitest-pool-workers`: vários WebSockets simulando TV e celulares contra o DO real, com hibernation e alarms. Tudo local, sem deploy e sem página de debug.
- user: "Testes no workerd (Recomendado)"

### Expulsão

- O token do expulso é invalidado e ele perde pontos e palavras. Se escanear o QR de novo, entra como jogador novo. Não há banimento.
- user: "Pode, como novo (Recomendado)"

### TV desconectada durante a rodada

- A rodada segue: o timer continua e os celulares jogam. Ao reconectar, a TV recebe o estado atual. A sala só expira depois de `TV_DISCONNECT_TIMEOUT_MIN`.
- user: "Segue normal (Recomendado)"

### Idioma do código (AD-001)

- Todo o código e o protocolo usam termos em inglês, inclusive o vocabulário do jogo; os documentos explicam em português, com termos técnicos em inglês. O texto exibido ao jogador vem do i18n.
- user: "o codigo deve ter todos os termos em ingles, mas pode manter a explicação dos documentos em portuguez"

### Análise de gargalos de uma partida (2026-10-27)

Pedido do user: "identifique possíveis gargalos ao rodar uma partida, os celulares podem ter uma espécie de debounceTime para agrupar acertos [...] podemos explorar que os celulares normalmente tem mais poder de processamento que o browser de tvs antigas".

Cenário de referência: 10 celulares, 6x6, 120 s, até ~4.240 soluções (M0).

| # | Gargalo | Onde dói | Proposta |
| --- | --- | --- | --- |
| G1 | Payload de salted hashes no início da rodada: SHA-256 completo em hex = 64 B por palavra, ~270 KB por celular num 6x6 rico | Rede 4G e o "já" < 1 s | Prefixo de 6 bytes do SHA-256 em binário (~25 KB). Colisão com palavra inválida ≈ 1,5e-11; o servidor confirma de qualquer jeito |
| G2 | Envios inválidos e repetidos chegam ao servidor | Mensagens e CPU do DO | O celular só envia caminhos cujo hash bate e que ele ainda não achou; o ✓/✗ já é local |
| G3 | Rajadas de acertos | Mensagens ao DO | Uma mensagem leva vários caminhos; o celular agrupa com debounce curto e envia na hora no último segundo da rodada |
| G4 | Contagem ao vivo na TV a cada acerto: com 10 jogadores, várias mensagens e re-render por segundo | CPU da TV antiga | O servidor agrupa e manda à TV no máximo 1 atualização por intervalo fixo |
| G5 | Trabalho de montagem na TV (ordenar, agrupar, achar caminho da maior palavra) | CPU da TV antiga | O servidor manda o resultado pronto para renderizar; a TV nunca recebe hashes nem soluções |
| G6 | Gravar o estado inteiro a cada acerto | Storage do DO | Gravar só o delta (a palavra nova do jogador); o output gate do DO segura o envio até a gravação |
| G7 | Wake da hibernation recarrega o pacote (~17 ms, M0) | Latência do primeiro envio | As soluções da rodada ficam no storage; validar não exige recarregar o dicionário |

Decisões (2026-10-27):

- G1: prefixo de 6 bytes em binário. user: "6 bytes binário (Recomendado)"
- G2/G3: o celular só envia caminhos cujo hash bate e ainda não achados, com debounce de 500 ms e envio imediato nos últimos 3 s; limite de 10 caminhos/s. user: "O celular só envia caminhos cujo hash bate e que ainda não achou, agrupados numa mensagem com debounce de 500 ms. No último 3 s da rodada envia na hora. O limite vira 10 caminhos/s."
- G4: TV recebe a contagem no máximo 1x/s; as contagens finais vão antes do resultado. user: "No máximo 1x por segundo [...] mas garantindo que ao final da partida não tenha perda de dados."
- G5-G7: decisões de Design, sem mudança de comportamento na spec.

Não é gargalo: CPU da validação (O(tamanho da palavra)), geração do próximo tabuleiro durante o resultado (p95 14 ms no M0), clock sync e heartbeat (poucas mensagens; `ping`/`pong` não acorda o DO). Os limites exatos do plano Free (requests, duration, rows written) são conferidos no Design.

### Agent's Discretion

Nenhuma área delegada até agora.

### Declined / Undiscussed Gray Areas → Assumptions

Defaults confirmados em 2026-10-27, user: "concordo com suas suposições e pode escrever o spec":

- Jogador desconectado continua na lista e no placar até a sala expirar ou o anfitrião expulsá-lo; ocupa vaga no limite de 10.
- "Próximo jogador conectado" na troca automática de anfitrião = ordem de entrada.
- Quem entra durante a contagem, a rodada ou o resultado fica assistindo e joga a partir da próxima rodada, com 0 pontos.
- Uma segunda aba `/tv` sem token cria outra sala; com token válido, retoma a mesma.
- Semelhança de cor: distância CIEDE2000 < 20 conta como parecida; legibilidade: contraste ≥ 3:1 sobre o fundo da TV.
- Os salted hashes das soluções (§6.2) entram no protocolo do M2; o uso no celular fica para o M3.

---

## Specific References

- `docs/DESIGN.md` §1.2-1.5, §2, §5.4-5.5, §6.1-6.2.
- `docs/m0-results.md`: o DAWG servido como asset carrega em ~17 ms no DO; o solver 6x6 tem p95 de 17 ms de CPU.

---

## Deferred Ideas

Nenhuma; a discussão ficou dentro do escopo.
