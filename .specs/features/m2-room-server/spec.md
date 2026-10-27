# M2 Room Server Specification

**Approved**: 2026-10-27 - user: "aprovo a spec do M2"

**Amended**: 2026-10-27 - análise de gargalos (ROUND-01 AC 2, 3, 6, 7 e 10; Out of Scope); respostas do user registradas na tabela de Assumptions (M2-Q5 a M2-Q7)

**Amended**: 2026-10-27 - voltar ao lobby e jogar de novo (HOST-01 AC 4; RES-01 AC 7, 9 e 10; PROTO-01 AC 6); decisões M2-Q8 e M2-Q9

**Amended**: 2026-10-27 - vitórias da sessão e coroa no lobby (WINS-01); decisões M2-Q10 a M2-Q13

**Amended**: 2026-10-27 - PROTO-01 AC 8: o pacote de idioma não é servido por HTTP (achado ao rodar `wrangler dev`: `/pt-BR/dict.bin` respondia 200, contra o DESIGN §5.3 e §6.2); user: "faça a correção do dicionario publico a pagina de debug deixa para depois, pois meus tokens estão acabando e so renovam as 17:40"

## Problem Statement

O M1 deixou as regras do jogo prontas no `core` (pacote de idioma, gerador, solver, validação, pontuação e maior palavra), mas só para jogar sozinho numa página local. Ainda não existe sala, nem jeito de vários celulares e uma TV jogarem juntos. O M2 constrói o servidor autoritativo: um Durable Object por sala, que roda a partida inteira e guarda o estado de forma que nada se perca em reconexões, hibernation ou queda da TV. Os marcos 3 (celular) e 4 (TV) passam a ser só clientes desse protocolo.

## Goals

- [ ] Uma TV e até 10 celulares jogam uma partida completa (lobby → rodadas → pódio → jogar de novo) contra o Durable Object real, provada por testes de integração no workerd
- [ ] Toda regra do servidor (entrada, anfitrião, configurações, rodada, resultado, reconexão, expiração) tem um teste que a exercita por WebSocket
- [ ] O estado da sala sobrevive à hibernation e a um Durable Object recriado, sem perder jogadores, pontos ou palavras
- [ ] O protocolo fica tipado no `core`, pronto para o M3 e o M4 usarem

## Out of Scope

| Feature | Reason |
| --- | --- |
| Telas do celular e da TV, QR code, áudio, Wake Lock | Marcos 3 e 4 |
| Uso dos salted hashes no celular (optimistic feedback) | O M2 só os envia; o uso é do M3 |
| Filtro e debounce dos envios no celular | Comportamento do cliente, M3: enviar só caminhos cujo hash bate e ainda não achados, agrupados com debounce de 500 ms, e na hora nos últimos 3 s da rodada (M2-Q5) |
| Desenho da lista do lobby, da coroa e do estado esmaecido | Telas do M3 (celular) e do M4 (TV); o M2 entrega as vitórias, o estado de conexão e a regra da coroa |
| Apresentação do fast mode | O servidor só guarda e transmite a opção; a apresentação é do M4 |
| Deploy na Cloudflare, CI/CD | Marco 5; decisão "Testes no workerd" |
| Página de debug ou cliente manual | Decisão "Testes no workerd" |
| E2E com Playwright | Marco 5 |
| Contas, ranking persistente entre salas, banimento | DESIGN §9; decisão de expulsão "Pode, como novo" |
| Pausar a rodada quando a TV cai | Decisão "Segue normal" |
| Outros idiomas de dicionário | Só o pacote pt-BR existe |
| Push para o GitHub | Só com pedido explícito |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --- | --- | --- | --- |
| M2-Q1 - Escopo | O Durable Object roda o laço completo: lobby, configurações, contagem, rodada com timer, validação do caminho, pontuação, resultado, próxima rodada, pódio e jogar de novo | O servidor é autoritativo (DESIGN §6.2); M3 e M4 viram clientes | y - user: "Laço completo (Recomendado)" |
| M2-Q2 - Prova | Testes de integração com Vitest + `@cloudflare/vitest-pool-workers`, vários WebSockets contra o DO real, com hibernation e alarms; tudo local | Sem tela ainda; sem deploy | y - user: "Testes no workerd (Recomendado)" |
| M2-Q3 - Expulsão | O token do expulso é invalidado e ele perde pontos e palavras; pode entrar de novo como jogador novo; não há banimento | Sem contas, banimento seria burlável | y - user: "Pode, como novo (Recomendado)" |
| M2-Q4 - TV caiu | A rodada segue; o timer não para; a TV recebe o estado atual ao reconectar | Os celulares continuam jogando | y - user: "Segue normal (Recomendado)" |
| Jogador desconectado | Continua na lista e no placar até a sala expirar ou ser expulso, e ocupa vaga no limite de 10 | A reconexão por token precisa do registro | y - user: "concordo com suas suposições" |
| Troca automática de anfitrião | Vai para o próximo jogador conectado na ordem de entrada | Regra determinística e previsível | y |
| Entrada atrasada | Quem entra na contagem, na rodada ou no resultado fica assistindo e joga a partir da próxima rodada, com 0 pontos | DESIGN §2 | y |
| Segunda aba `/tv` | Sem token, cria outra sala; com token válido, retoma a mesma | DESIGN §2 | y |
| Semelhança e legibilidade de cor | CIEDE2000 < 20 é parecida demais; contraste mínimo 3:1 sobre o fundo da TV | Limiar comum de "cores distinguíveis"; 3:1 é o mínimo WCAG para elementos gráficos | y |
| Salted hashes | Entram no protocolo do M2; o uso no celular fica para o M3 | DESIGN §6.2 | y |
| Fundo da TV | `#121417`, exportado pelo `core` como token | O M4 usa o mesmo token; muda num lugar só | y - consequência de "Semelhança e legibilidade de cor" |
| Alfabeto do código da sala | 4 letras de A a Z sem `I` e `O` (24 letras) | DESIGN §2 proíbe letras ambíguas; o código só tem letras | y - consequência do DESIGN |
| Tabuleiro antes do "já" | O tabuleiro vai junto do aviso de contagem com o timestamp de início; envios antes desse timestamp são recusados | Aparece em todos ao mesmo tempo sem depender da latência do "já" | y - consequência do DESIGN §1.5 |
| Sala ociosa | Ociosa = nenhuma ação de jogador ou do anfitrião (entrar, configurar, iniciar, enviar, comandar); heartbeat e clock sync não contam | Senão uma TV ligada manteria a sala viva para sempre | y - consequência do DESIGN §2 |
| Avanço para o pódio | Depois do resultado da última rodada, o anfitrião avança para o pódio, como avança para a próxima rodada | Mesmo gesto do anfitrião em todo resultado | y - consequência do DESIGN §1.5 |
| Anfitrião sem ninguém conectado | Se não houver outro jogador conectado após os 30 s, o papel passa ao primeiro jogador que reconectar | Sempre existe exatamente um anfitrião (DESIGN §2) | y - consequência do DESIGN §2 |
| Conexão duplicada | Uma nova conexão com o mesmo token substitui a anterior, que é fechada | Um token = um dispositivo ativo | y - consequência do DESIGN §2 |
| AD-001 - Idioma do código | Todo o código e o protocolo usam termos em inglês, inclusive o vocabulário do jogo; os documentos explicam em português | O idioma do jogo muda com o pacote de dicionário; o texto exibido vem do i18n | y - user: "o codigo deve ter todos os termos em ingles, mas pode manter a explicação dos documentos em portuguez" |
| M2-Q8 - Voltar ao lobby no meio da partida | Novo comando de anfitrião `back-to-lobby`, válido na contagem, na rodada, no resultado e no pódio: cancela a rodada sem resultado, descarta as palavras e zera o placar | O anfitrião precisa abandonar uma partida e esperar mais gente no lobby | y - user: "Descarta e zera (Recomendado)" |
| M2-Q9 - Jogar de novo | `play-again` continua separado: no pódio, zera o placar e começa direto a contagem de uma nova partida com as mesmas configurações e jogadores | São duas funcionalidades diferentes | y - user: "São duas funcionalidades diferentes, o play-again se mantem como está e começa uma nova rodada com as mesmas configurações atuais e os participantes. o back-to-lobby volta para a pagina de lobby, se existir uma rodada em andamento ela é cancelada e os pontos zerados." |
| M2-Q10 - O que é vitória | Maior placar acumulado ao fim de uma partida completa (pódio); empatados no 1º lugar ganham todos; partida cancelada não conta | Regra simples e justa | y - user: "Maior placar no pódio (Recomendado)" |
| M2-Q11 - Coroa no empate | Todos com o maior número de vitórias têm coroa; ninguém enquanto todos têm 0 | Consistente com a regra de vitória | y - user: "Todos os empatados (Recomendado)" |
| M2-Q12 - Onde aparece | Na lista do lobby da TV e dos celulares | O servidor manda as vitórias para todos | y - user: "TV e celulares (Recomendado)" |
| M2-Q13 - Desconectados no lobby | Continuam na lista, esmaecidos, com as vitórias | Mantém o que a spec já dizia; reconectar não perde nada | y - user: "Sim, esmaecidos (Recomendado)" |
| Partida com placar máximo 0 | Ninguém ganha vitória | Com 0 pontos, todos empatariam e "ganhariam" sem jogar | y - user: "Aprovo as tarefas T27-T30, as decisões da fase 3 e o placar 0 sem vitória. Pode seguir com a fase 4." |
| Vida das vitórias | Valem enquanto a sala existir; somem quando ela fecha ou expira | DESIGN §2: placar só na sala, sem persistência entre salas | y - consequência do DESIGN §2 |
| M2-Q5 - Envios do celular | Uma mensagem leva um ou mais caminhos; o limite é de 10 caminhos/s; o celular (M3) só envia caminhos cujo hash bate e que ainda não achou, com debounce de 500 ms e envio imediato nos últimos 3 s | Com o optimistic feedback, o servidor não precisa responder na hora; menos mensagens ao DO | y - user: "O celular só envia caminhos cujo hash bate e que ainda não achou, agrupados numa mensagem com debounce de 500 ms. No último 3 s da rodada envia na hora. O limite vira 10 caminhos/s." |
| M2-Q6 - Contagem na TV | No máximo 1 atualização por segundo, só quando muda; no fim da rodada, as contagens finais vão antes do resultado | TV antiga re-renderiza no máximo 1x/s, sem perder o último dado | y - user: "No máximo 1x por segundo [...] mas garantindo que ao final da partida não tenha perda de dados." |
| M2-Q7 - Formato dos hashes | Prefixo de 6 bytes do SHA-256 (salt + palavra), em binário (~25 KB num 6x6 com ~4.240 soluções) | SHA-256 completo em hex daria ~270 KB por celular; falso ✓ ≈ 1,5e-11 e o servidor confirma | y - user: "6 bytes binário (Recomendado)" |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Criação da sala e TV ⭐ MVP

**User Story**: Como dono da TV, quero que abrir o jogo crie uma sala com um código curto, para que os celulares entrem nela.

**Why P1**: Toda partida começa por aqui.

**Acceptance Criteria**:

1. WHEN a TV pede uma sala nova sem token THEN o servidor SHALL criar uma sala no lobby e responder com um código de 4 letras do alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ` e um token de TV
2. IF o código sorteado já pertence a uma sala ativa THEN o servidor SHALL sortear outro código até achar um livre
3. WHEN a TV se conecta à sala com um token de TV válido THEN o servidor SHALL enviar a ela o estado completo da sala na fase atual
4. IF uma conexão de TV traz um token que não é o da sala THEN o servidor SHALL recusá-la com o erro `bad-token` e fechá-la
5. WHEN uma TV com o token da sala se conecta enquanto outra conexão de TV da mesma sala está aberta THEN o servidor SHALL fechar a conexão antiga e manter a nova

**Independent Test**: Criar uma sala, conectar a TV, reconectar com o mesmo token e conferir o estado recebido.

---

### P1: Entrada de jogadores ⭐ MVP

**User Story**: Como jogador, quero entrar na sala pelo código com um apelido e uma cor, para jogar com os outros.

**Why P1**: Sem jogadores não há partida.

**Acceptance Criteria**:

1. WHEN um celular entra na sala com apelido e cor válidos THEN o servidor SHALL registrar o jogador, responder com um token de jogador e avisar todas as conexões da sala
2. IF o apelido, sem espaços nas pontas, tiver menos de 2 ou mais de 12 caracteres THEN o servidor SHALL recusar a entrada com o erro `bad-nickname`
3. IF o apelido for igual ao de outro jogador da sala ignorando maiúsculas e acentos ("João" = "joao") THEN o servidor SHALL recusar a entrada com o erro `nickname-taken`
4. IF a cor não for um hexadecimal `#RRGGBB` THEN o servidor SHALL recusar a entrada com o erro `bad-color`
5. IF a cor tiver contraste menor que 3:1 sobre o fundo da TV `#121417` THEN o servidor SHALL recusar a entrada com o erro `color-illegible`
6. IF a cor tiver distância CIEDE2000 menor que 20 da cor de outro jogador da sala THEN o servidor SHALL recusar a entrada com o erro `color-too-similar`
7. IF a sala já tiver 10 jogadores, conectados ou não THEN o servidor SHALL recusar a entrada com o erro `room-full`
8. IF o código não pertencer a uma sala ativa THEN o servidor SHALL recusar a conexão com o erro `room-not-found`
9. WHILE a sala está na contagem, na rodada ou no resultado, WHEN um jogador novo entra THEN o servidor SHALL registrá-lo como espectador com 0 pontos
10. WHEN a próxima contagem começa THEN o servidor SHALL tornar jogadores todos os espectadores
11. The `core` SHALL exportar uma paleta de 10 cores sugeridas, todas com contraste ≥ 3:1 sobre `#121417` e distância CIEDE2000 ≥ 20 entre cada par

**Independent Test**: Conectar celulares com apelidos e cores válidos e inválidos e conferir aceite, erros e o aviso aos outros.

---

### P1: Anfitrião ⭐ MVP

**User Story**: Como anfitrião, quero controlar a sala pelo meu celular, e como grupo queremos que sempre exista alguém nesse papel.

**Why P1**: Só o anfitrião inicia e avança a partida.

**Acceptance Criteria**:

1. WHEN o primeiro jogador entra na sala THEN o servidor SHALL torná-lo anfitrião
2. The servidor SHALL manter exatamente um anfitrião em toda sala com pelo menos um jogador
3. WHEN o anfitrião transfere o papel para outro jogador conectado THEN o servidor SHALL tornar esse jogador o anfitrião e avisar todas as conexões
4. IF um comando de anfitrião (configurar, iniciar, avançar, transferir, expulsar, jogar de novo, voltar ao lobby, encerrar) vem de quem não é anfitrião THEN o servidor SHALL recusá-lo com o erro `not-host` sem mudar o estado
5. WHEN o anfitrião fica desconectado por 30 s THEN o servidor SHALL passar o papel ao próximo jogador conectado na ordem de entrada
6. IF não houver outro jogador conectado quando os 30 s do anfitrião desconectado vencerem THEN o servidor SHALL passar o papel ao primeiro jogador que reconectar
7. WHEN o anfitrião reconecta antes de 30 s THEN o servidor SHALL mantê-lo anfitrião
8. WHEN o anfitrião expulsa um jogador THEN o servidor SHALL remover o jogador, os pontos e as palavras dele, invalidar o token e fechar a conexão dele com o motivo `kicked`
9. WHEN um jogador expulso entra de novo pelo código THEN o servidor SHALL tratá-lo como jogador novo, com 0 pontos
10. IF o anfitrião tenta expulsar a si mesmo THEN o servidor SHALL recusar com o erro `bad-target`

**Independent Test**: Três celulares; transferir, expulsar, derrubar o anfitrião e avançar o alarm de 30 s.

---

### P1: Configurações da sala ⭐ MVP

**User Story**: Como anfitrião, quero ajustar tabuleiro, tempo, rodadas e regras no lobby e ver a TV espelhar na hora.

**Why P1**: As regras da partida vêm daqui (DESIGN §1.2).

**Acceptance Criteria**:

1. WHEN uma sala é criada THEN o servidor SHALL usar os padrões: tabuleiro 4x4, 120 s, 1 rodada, mínimo de 3 letras, filtro de palavrões ligado, fast mode desligado, dicionário pt-BR, som ligado
2. WHILE a sala está no lobby, WHEN o anfitrião muda uma configuração para um valor permitido THEN o servidor SHALL guardá-la e enviar as configurações novas a todas as conexões
3. IF um valor estiver fora do permitido (tabuleiro fora de 4/5/6, tempo fora de 30 a 180 em passos de 30, rodadas fora de 1 a 5, mínimo fora de 3/4, dicionário diferente de pt-BR) THEN o servidor SHALL recusar com o erro `bad-settings` sem mudar nada
4. IF o anfitrião muda uma configuração fora do lobby THEN o servidor SHALL recusar com o erro `wrong-phase`
5. The servidor SHALL aceitar o volume como inteiro de 0 a 100 e o mudo como booleano, e recusar outros valores com `bad-settings`

**Independent Test**: Mudar cada opção no lobby, tentar valores inválidos e tentar mudar durante a rodada.

---

### P1: Rodada ⭐ MVP

**User Story**: Como jogador, quero que a rodada comece ao mesmo tempo para todos, que meus envios sejam validados e que o tempo seja o do servidor.

**Why P1**: É o jogo.

**Acceptance Criteria**:

1. WHEN o anfitrião inicia a partida no lobby THEN o servidor SHALL gerar o tabuleiro com as configurações da sala e enviar a todas as conexões a contagem com o tabuleiro, o timestamp de início (agora + 3 s) e o timestamp de fim (início + tempo da rodada)
2. WHEN a contagem começa THEN o servidor SHALL enviar a cada celular um salt novo da rodada e o prefixo de 6 bytes do SHA-256 (salt + palavra) de cada solução válida com o mínimo e o filtro da sala, em binário, sem nenhuma palavra em texto
3. WHEN um jogador envia uma mensagem com um ou mais caminhos entre o início e o fim + 300 ms THEN o servidor SHALL validar cada caminho, na ordem, com `validateSubmission` do `core` e responder só a ele com uma única mensagem que traz, para cada caminho, a palavra aceita ou o motivo da recusa
4. IF um envio chega antes do timestamp de início ou depois do fim + 300 ms THEN o servidor SHALL recusá-lo com o motivo `round-closed`
5. IF um espectador envia um caminho THEN o servidor SHALL recusá-lo com o motivo `spectator`
6. IF um jogador envia mais de 10 caminhos em qualquer janela de 1 s, somando todas as mensagens THEN o servidor SHALL recusar os caminhos excedentes com o motivo `rate-limited`, sem validá-los
7. WHILE a rodada está aberta, the servidor SHALL enviar à TV a contagem de palavras de cada jogador, sem as palavras, no máximo uma vez por segundo e só quando alguma contagem mudou desde o último envio
8. WHEN o fim + 300 ms chega THEN o servidor SHALL encerrar a rodada e passar ao resultado, mesmo que nenhuma conexão esteja aberta
9. WHEN um cliente envia um clock sync com o seu timestamp THEN o servidor SHALL responder com esse timestamp e o timestamp do servidor
10. WHEN a rodada termina THEN o servidor SHALL enviar à TV as contagens finais de todos os jogadores, incluindo os caminhos aceitos desde o último envio, antes do resultado

**Independent Test**: Iniciar com dois celulares, enviar caminhos válidos, inválidos, repetidos, fora do tempo e em rajada, e avançar o alarm do fim.

---

### P1: Resultado, pódio e jogar de novo ⭐ MVP

**User Story**: Como grupo, queremos ver o que cada um achou, o placar e a maior palavra, e seguir para a próxima rodada ou recomeçar.

**Why P1**: Fecha o laço da partida.

**Acceptance Criteria**:

1. WHEN a rodada termina THEN o servidor SHALL enviar a todas as conexões o resultado com as palavras em comum da menor para a maior, as palavras únicas de cada jogador com os jogadores do menor para o maior placar acumulado, os pontos da rodada e o placar acumulado, calculados com `scoreRound` do `core`
2. WHEN o resultado é montado THEN o servidor SHALL incluir em cada palavra as grafias reais do mapa de grafias, sem nada a acrescentar quando a única grafia é a forma normalizada
3. WHEN o resultado é montado THEN o servidor SHALL incluir a maior palavra escolhida por `pickLongestWord` do `core`, o caminho das peças dela no tabuleiro e os jogadores que a encontraram
4. WHEN o resultado começa e ainda há rodadas THEN o servidor SHALL gerar e guardar o tabuleiro da próxima rodada antes de o anfitrião avançar
5. WHILE ainda há rodadas, WHEN o anfitrião avança no resultado THEN o servidor SHALL começar a contagem da próxima rodada com o tabuleiro já gerado
6. WHILE o resultado é da última rodada, WHEN o anfitrião avança THEN o servidor SHALL enviar a todas as conexões o pódio com os jogadores do maior para o menor placar
7. WHEN o anfitrião escolhe "Jogar de novo" no pódio THEN o servidor SHALL zerar todos os placares e começar a contagem de uma nova partida com os mesmos jogadores, cores, configurações e anfitrião, sem passar pelo lobby
8. WHEN o anfitrião escolhe "Encerrar sala" THEN o servidor SHALL fechar a sala com o motivo `closed-by-host`
9. IF o anfitrião avança, joga de novo, volta ao lobby ou inicia fora da fase em que o comando vale THEN o servidor SHALL recusar com o erro `wrong-phase`
10. WHILE a sala está na contagem, na rodada, no resultado ou no pódio, WHEN o anfitrião escolhe "Voltar ao lobby" THEN o servidor SHALL cancelar a rodada em andamento sem enviar resultado, descartar as palavras dela, zerar todos os placares e voltar ao lobby com os mesmos jogadores, cores, configurações e anfitrião

**Independent Test**: Partida de 2 rodadas com dois jogadores e palavras em comum e únicas; conferir resultados, pódio e o lobby depois de jogar de novo.

---

### P1: Vitórias da sessão ⭐ MVP

**User Story**: Como grupo, queremos ver no lobby quantas partidas cada um ganhou desde que a sala abriu, com uma coroa para quem lidera.

**Why P1**: Pedido do user para a página de lobby; o servidor precisa contar e guardar as vitórias para a TV (M4) e os celulares (M3) mostrarem.

**Acceptance Criteria**:

1. WHEN o pódio de uma partida completa é enviado THEN o servidor SHALL somar 1 vitória a cada jogador com o maior placar acumulado da partida, incluindo todos os empatados no 1º lugar
2. IF o maior placar acumulado da partida é 0 THEN o servidor SHALL não somar vitória a ninguém
3. IF a partida é cancelada com "Voltar ao lobby" antes do pódio THEN o servidor SHALL não somar vitória a ninguém
4. The servidor SHALL incluir o número de vitórias de cada jogador, conectado ou não, em toda lista de jogadores enviada à TV e aos celulares
5. WHEN o anfitrião escolhe "Jogar de novo" ou "Voltar ao lobby" THEN o servidor SHALL zerar os placares e manter as vitórias
6. The `core` SHALL exportar a regra da coroa: os jogadores com o maior número de vitórias da sala, todos os empatados, e nenhum enquanto o maior número for 0
7. WHEN um jogador reconecta ou o Durable Object é reconstruído do storage THEN o servidor SHALL manter as vitórias de cada jogador
8. WHEN um jogador é expulso THEN o servidor SHALL descartar as vitórias dele, e ele volta com 0 se entrar de novo

**Independent Test**: Jogar duas partidas completas com dois jogadores, cancelar uma terceira, e conferir as vitórias na lista de jogadores e a coroa.

---

### P1: Reconexão ⭐ MVP

**User Story**: Como jogador, quero voltar à sala depois de cair sem perder nada.

**Why P1**: Celular perde conexão o tempo todo.

**Acceptance Criteria**:

1. WHEN um celular se conecta com um token de jogador válido THEN o servidor SHALL marcá-lo conectado e enviar a ele o estado completo: apelido, cor, pontos, papel de anfitrião, fase, tabuleiro, timestamps da rodada, as palavras dele na rodada e, durante a rodada, o salt e os hashes
2. IF o token de jogador não pertence à sala THEN o servidor SHALL recusar a conexão com o erro `bad-token` e fechá-la
3. WHEN a conexão de um jogador fecha THEN o servidor SHALL marcá-lo desconectado e avisar todas as conexões, mantendo os pontos e as palavras
4. WHEN um jogador se conecta com um token cuja conexão anterior ainda está aberta THEN o servidor SHALL fechar a conexão antiga e manter a nova
5. WHILE a TV está desconectada, the servidor SHALL seguir a rodada e o timer sem pausa
6. WHEN um cliente envia `ping` THEN o servidor SHALL responder `pong` sem acordar o Durable Object da hibernation

**Independent Test**: Derrubar e reconectar um celular no meio da rodada e conferir pontos, palavras e hashes recebidos.

---

### P1: Persistência e hibernation ⭐ MVP

**User Story**: Como grupo, queremos que a sala sobreviva à TV em espera e ao servidor em hibernation.

**Why P1**: DESIGN §2: nada se perde.

**Acceptance Criteria**:

1. WHEN o estado da sala muda THEN o servidor SHALL gravá-lo no storage do Durable Object antes de avisar as conexões
2. WHEN um Durable Object novo assume uma sala existente THEN o servidor SHALL reconstruir do storage a fase, as configurações, os jogadores, os tokens, o anfitrião, o tabuleiro, as palavras e os placares
3. The servidor SHALL usar a WebSocket Hibernation API, mantendo os sockets abertos enquanto o Durable Object hiberna
4. The servidor SHALL agendar o fim da rodada, a troca de anfitrião e a expiração com alarms do Durable Object, sem in-memory timers

**Independent Test**: Gravar uma sala no meio da rodada, recriar o objeto a partir do storage e conferir o estado e o alarm.

---

### P1: Expiração ⭐ MVP

**User Story**: Como desenvolvedor, quero que salas abandonadas se apaguem sozinhas, com tempos configuráveis.

**Why P1**: DESIGN §2.

**Acceptance Criteria**:

1. The servidor SHALL ler `ROOM_IDLE_TIMEOUT_MIN` (padrão 30) e `TV_DISCONNECT_TIMEOUT_MIN` (padrão 10) das vars do Worker
2. WHEN se passam `ROOM_IDLE_TIMEOUT_MIN` minutos sem nenhuma ação de jogador ou do anfitrião THEN o servidor SHALL fechar a sala com o motivo `idle`
3. WHEN a TV fica sem conexão aberta por `TV_DISCONNECT_TIMEOUT_MIN` minutos THEN o servidor SHALL fechar a sala com o motivo `tv-gone`
4. WHERE uma das variáveis vale `0`, the servidor SHALL nunca fechar a sala pela regra correspondente
5. WHEN a sala fecha THEN o servidor SHALL enviar o motivo a todas as conexões, fechá-las, apagar o storage e liberar o código
6. IF uma variável não for um inteiro ≥ 0 THEN o servidor SHALL usar o padrão dela

**Independent Test**: Com tempos curtos de teste, avançar os alarms e conferir o fechamento; com `0`, conferir que nada fecha.

---

### P1: Protocolo ⭐ MVP

**User Story**: Como desenvolvedor do celular e da TV, quero um protocolo tipado e estrito.

**Why P1**: M3 e M4 dependem dele.

**Acceptance Criteria**:

1. The `core` SHALL exportar os tipos de todas as mensagens de cliente e de servidor, os códigos de erro e os motivos de recusa usados pelo servidor
2. IF uma mensagem não for JSON válido, não tiver um tipo conhecido ou tiver campos fora do formato THEN o servidor SHALL responder com o erro `bad-message` sem mudar o estado
3. IF um cliente manda um comando que não vale na fase atual THEN o servidor SHALL recusar com o erro `wrong-phase` sem mudar o estado
4. IF uma mensagem tiver mais de 4 KB THEN o servidor SHALL recusá-la com o erro `bad-message` sem processá-la
5. The servidor SHALL nunca enviar aos celulares as palavras da rodada em texto antes do resultado, exceto a palavra aceita do próprio envio
6. The protocolo SHALL usar só termos em inglês nos tipos de mensagem, nomes de campo, códigos de erro e motivos (ex.: `join`, `start`, `play-again`, `back-to-lobby`, `close-room`, `kicked`, `closed-by-host`)
7. The servidor SHALL nunca enviar texto para exibição ao jogador; os clientes traduzem os códigos pelo i18n da interface
8. IF alguém pede por HTTP um arquivo do pacote de idioma (dicionário, comuns, palavrões, grafias ou metadados) THEN o servidor SHALL responder 404, e só o Durable Object lê o pacote pelo binding `ASSETS`

**Independent Test**: Enviar lixo, tipos desconhecidos, campos errados e mensagens grandes e conferir os erros e o estado inalterado.

---

## Edge Cases

- WHEN dois jogadores enviam a mesma palavra THEN o servidor SHALL aceitá-la para os dois e contá-la como palavra em comum no resultado
- WHEN um jogador envia uma palavra que já encontrou THEN o servidor SHALL recusá-la com o motivo `already-found`
- WHEN um jogador é expulso durante a rodada THEN o servidor SHALL tirar as palavras dele do resultado dessa rodada
- WHEN todos os jogadores desconectam durante a rodada THEN o servidor SHALL encerrar a rodada no fim + 300 ms normalmente
- IF o tabuleiro não tem nenhuma solução válida THEN o resultado SHALL vir sem maior palavra
- WHEN um jogador sai do lobby desconectando THEN o servidor SHALL mantê-lo na lista como desconectado

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| --- | --- | --- | --- |
| ROOM-01 | P1: Criação da sala e TV (AC 1-5) | Design | Pending |
| JOIN-01 | P1: Entrada de jogadores (AC 1-11) | Design | Pending |
| HOST-01 | P1: Anfitrião (AC 1-10) | Design | Pending |
| CFG-01 | P1: Configurações da sala (AC 1-5) | Design | Pending |
| ROUND-01 | P1: Rodada (AC 1-10) | Design | Pending |
| RES-01 | P1: Resultado, pódio e jogar de novo (AC 1-10) | Design | Pending |
| RECON-01 | P1: Reconexão (AC 1-6) | Design | Pending |
| PERSIST-01 | P1: Persistência e hibernation (AC 1-4) | Design | Pending |
| EXP-01 | P1: Expiração (AC 1-6) | Design | Pending |
| PROTO-01 | P1: Protocolo (AC 1-8) | Design | Pending |
| WINS-01 | P1: Vitórias da sessão (AC 1-8) | Design | Pending |

**Coverage:** 10 total, 0 mapped to tasks, 10 unmapped ⚠️ (mapeados na fase Tasks)

### Implicit-requirement dimensions

| Dimension | Coverage |
| --- | --- |
| Input validation & bounds | JOIN-01 AC 2-7, CFG-01 AC 3 e 5, PROTO-01 AC 2 e 4 |
| Failure / partial-failure states | PERSIST-01 AC 1 (gravar antes de avisar), RECON-01 AC 3 |
| Idempotency / retry / duplicate handling | ROOM-01 AC 5, RECON-01 AC 4, `already-found` em Edge Cases |
| Auth boundaries & rate limits | Tokens (ROOM-01 AC 4, RECON-01 AC 2), HOST-01 AC 4, ROUND-01 AC 6 |
| Concurrency / ordering | O Durable Object processa uma mensagem por vez; a janela de 300 ms é ROUND-01 AC 3-4 |
| Data lifecycle / expiry | EXP-01 |
| Observability | N/A because o MVP não tem infraestrutura de métricas; o `wrangler tail` basta até o deploy do marco 5 |
| External-dependency failure | N/A because o único recurso externo é o pacote nos Static Assets do mesmo Worker; sem ele o Worker não sobe |
| State-transition integrity | PROTO-01 AC 3, CFG-01 AC 4, RES-01 AC 9 |

---

## Sources

- `docs/DESIGN.md` §1.2-1.5, §2, §5.4-5.5, §6.1-6.2 - regras, sala, anfitrião, expiração e servidor autoritativo
- `docs/m0-results.md` - DAWG como asset carrega em ~17 ms no DO; solver 6x6 com p95 de 17 ms de CPU
- `.specs/features/m2-room-server/context.md` - respostas M2-Q1 a M2-Q4 e suposições confirmadas (2026-10-27)
- `packages/core/src/` - `validateSubmission`, `boardSolutions`, `scoreRound`, `pickLongestWord`, `generateBoard`, `LanguagePack`

---

## Success Criteria

- [ ] Um teste de integração joga uma partida de 2 rodadas com uma TV e 3 celulares, do lobby ao "jogar de novo"
- [ ] Um teste recria a sala do storage no meio da rodada e termina a partida sem perder pontos
- [ ] Nenhuma mensagem enviada a um celular antes do resultado contém uma palavra da rodada em texto, exceto a aceita no próprio envio
