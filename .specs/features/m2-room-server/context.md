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
