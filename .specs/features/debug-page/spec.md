# Debug Page Specification

**Approved**: 2026-10-27 - user: "Fechar o M2 e logo após pode criar uma pagina de debug para eu ir usando durante o desenvolvimento, aceito suas sugestões para a pagina de debug"

## Problem Statement

O M2 entregou o servidor da sala, mas as telas de TV e celular só chegam no M3 e no M4. Para ver o servidor funcionando durante o desenvolvimento, o user precisa de uma página local que faça o papel da TV e de alguns celulares ao mesmo tempo, contra o `wrangler dev`.

## Goals

- [ ] Um comando sobe o servidor local e a página de debug
- [ ] Na página, dá para jogar uma partida inteira (lobby, contagem, rodada, resultado, pódio, jogar de novo, voltar ao lobby) com uma TV e até 4 celulares

## Out of Scope

| Feature | Reason |
| --- | --- |
| Visual de produto (TV a 3 m, gesto de deslizar, áudio) | M3 e M4 |
| Deploy da página | Ferramenta local de desenvolvimento |
| Regras de jogo na página | As regras ficam no `core` e no servidor; a página só mostra o que recebe e usa funções do `core` (ex.: `crownedPlayers`) |
| Verifier e mutações | Ferramenta de desenvolvimento fora dos marcos; a prova é o teste de fumaça e a visita do orquestrador |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| Conteúdo | Coluna da TV e colunas de celulares (adicionar até 4), com entrar, iniciar, enviar palavras clicando no tabuleiro, comandos do anfitrião e log das mensagens | Sugestões aceitas pelo user | y - user: "aceito suas sugestões para a pagina de debug" |
| Onde fica | `tools/debug`, Vite + Preact como o `tools/play`, porta 5174, com proxy de `/api` (HTTP e WebSocket) para o `wrangler dev` em 8787 | Mesma origem, sem CORS; mesmo padrão do M1 | y - consequência das sugestões |
| Comando | `npm run debug` sobe o `wrangler dev` do servidor e o Vite da página juntos | Um comando só | y - consequência das sugestões |

**Open questions:** none.

---

## User Stories

### P1: Partida local na página de debug ⭐ MVP

**User Story**: Como desenvolvedor, quero jogar uma partida contra o servidor local numa página só, para ver o M2 funcionando antes das telas reais.

**Acceptance Criteria**:

1. WHEN o desenvolvedor roda `npm run debug` THEN o sistema SHALL subir o `wrangler dev` em 8787 e a página em `http://localhost:5174`
2. WHEN o desenvolvedor clica em "Criar sala" THEN a página SHALL criar uma sala, conectar a coluna da TV e mostrar o código, a fase, as configurações e a lista de jogadores com vitórias e coroa
3. WHEN o desenvolvedor adiciona um celular e entra com apelido e cor THEN a página SHALL mostrar a coluna desse celular com o resultado da entrada (token ou código de erro)
4. WHILE a rodada está aberta, WHEN o desenvolvedor clica peças adjacentes no tabuleiro de um celular e envia THEN a página SHALL mandar o caminho e mostrar o `submit-result`
5. The página SHALL mostrar, para cada coluna, o log das mensagens recebidas e enviadas, com o frame binário dos hashes resumido
6. WHERE o celular é o anfitrião, the página SHALL mostrar os comandos de anfitrião (configurações, iniciar, avançar, jogar de novo, voltar ao lobby, transferir, expulsar, encerrar)
7. WHEN o desenvolvedor desconecta e reconecta um celular THEN a página SHALL reconectar com o token salvo e mostrar o `welcome`

**Independent Test**: `npm run debug`, criar sala, adicionar 2 celulares, jogar uma rodada e voltar ao lobby.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| DBG-01 | P1: Partida local na página de debug (AC 1-7) | Execute | Pending |

---

## Checks

**C1** - Com o servidor e a página no ar, criar sala, entrar com 2 celulares, iniciar, enviar uma palavra e voltar ao lobby funciona pela página (DBG-01, AC 1-7)
Proof: walk - visita do orquestrador no browser, registrada no relatório
Walked: 2026-10-27 sobre `f7bb7e4`. Worker: sala, 2 celulares, rodada com "DOCE" aceita, reconexão com hashes, resultado, pódio, voltar ao lobby e coroa com 1 vitória. Orquestrador: sala `VWBM`, Ana (anfitriã, com comandos) e Bruno entraram, ambos no lobby com vitórias 0

## Success Criteria

- [ ] O user joga uma partida local com TV e 2 celulares pela página
