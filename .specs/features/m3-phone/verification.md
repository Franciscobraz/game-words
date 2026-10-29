# M3 Phone verification

**Verdict**: FAIL
**Mutations**: 12 - probed C43, C49, C57, C106 and PLAY-01 AC 8, 13, 17, 20; RES-01 AC 5; COUNT-01 AC 1; RECON-01 AC 3; POD-01 AC 4 (11 killed, 1 survived)
**Proofs**: `proofs.md` at a2984ce (HEAD a6e7f1a só acrescenta docs)
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| Medium - PLAY-01 AC 8: o `recheckFound` (uma palavra listada por um deslize mais rápido enquanto esta era julgada vira "JÁ ENCONTRADA") não tem teste; tirá-lo deixa tudo verde | mutation `recheckFound -> return judged` em `packages/phone/src/state/round.ts:257` not killed por `round.test.ts` inteiro. Exemplo próprio em HEAD: dois `releasePath()` de CASA sem `await` entre eles dão "JÁ ENCONTRADA" e um só `submit`; com a mutação o segundo vira "VÁLIDA" e a palavra entra duas vezes, com os pontos em dobro | teste em `state/round.test.ts`: dois deslizes de CASA soltos antes do primeiro julgamento terminar; espera `feedback` `already-found`, `found` = `['casa']` e um `submit` com um caminho | |
| Minor - PLAY-01 AC 7-10 fixam a cor de cada feedback (verde, amarelo, vermelho, cinza) e a tremida da "INVÁLIDA", e AC 6 cita `phone-feedbacks.png`; nenhuma prova segura isso | C52-C55 (`judge.test.ts`, `round.test.ts`) conferem só o `kind`; C51 confere só os 100 ms; não há check `browser captures/phone-feedbacks.running.png` em `## Checks`, então a foto existe mas o gate não a exige. A tremida está em `styles/word-rack.css:50` (`word-rack-shake`) sem teste | acrescentar o check `browser captures/phone-feedbacks.running.png` para PLAY-01 AC 6-10, ou um E2E que confira a classe `feedback-pill--<kind>` de cada veredito e o `animation-name` da palavra inválida | |
| Minor - checks cuja prova é uma foto carregam uma metade de comportamento que uma foto não mostra: C95 e C97 ("apaga o token", EXIT-01 AC 1-2) e C68 ("sem reagir ao toque", SPEC-01 AC 1) | `tasks.md` C68, C95, C97: `Proof: browser captures/...`. Os testes existem mas nenhum check os nomeia: `state/room.test.ts:113` (`drops the saved token when closed with %s`), `e2e/exit.spec.ts:37,53`, `model/board-lock.test.ts:41` | separar cada um em dois checks: a foto para a tela e um check com a prova Vitest/E2E que já existe para o token e para o tabuleiro travado do espectador | |
| Minor - cores literais fora de `packages/theme/tokens.css` (CLAUDE.md, AD-017), invisíveis à auditoria da C114, que só lê `src/styles/*.css` | `packages/phone/index.html:6` `<meta name="theme-color" content="#12131a">` (duplica `--color-background`); `packages/phone/src/screens/JoinScreen.tsx:20` `CUSTOM_COLOR_START = '#ffffff'` | tirar o `theme-color` ou gerá-lo do token; levar a cor inicial do seletor para um valor nomeado no core/tema; estender a auditoria a `index.html` e `*.tsx` (hex/rgb/hsl fora de dado do jogador) | |
| Minor - o dicionário pt-BR é servido por HTTP pelo dev server do celular (regra do CLAUDE.md, PROTO-01 AC 8): o Vite permite `/@fs/` em todo o workspace | `npx vite --port 5179` em `packages/phone` e `GET /@fs/C:/.../tools/dict-build/dist/pt-BR.dict.bin` -> 200, 1.702.840 bytes; `/@fs/.../languages/` -> 200. `packages/phone/vite.config.ts` não tem `server.fs.allow` nem `server.fs.deny`. Só em dev e em localhost, mas o teste em celular real (depois do M4) exige `--host` | `server.fs.deny` com `**/*.dict.bin` e `**/languages/**`, ou `server.fs.allow` restrito ao pacote, ao `@bwords/theme` e ao `node_modules`; um E2E que peça o caminho `/@fs/` do pacote e espere 403/404 | |

## Mutations injected

| Mutation | Location | Killed |
| --- | --- | --- |
| a word listed by a quicker swipe while this one was judged stays valid twice (PLAY-01 AC 8) | `packages/phone/src/state/round.ts:257` | no |
| the board stays open at exactly endsAt (PLAY-01 AC 20) | `packages/phone/src/model/board-lock.ts:12` | yes |
| send-at-once bound of 3,000 ms shifted by one (PLAY-01 AC 12, C57) | `packages/phone/src/model/submit-queue.ts:19` | yes |
| wake lock let go during the round (PREF-01 AC 4, C106) | `packages/phone/src/state/prefs.ts:52` | yes |
| a tile already in the path joins it again (PLAY-01 AC 4, C49) | `packages/phone/src/model/path.ts:26` | yes |
| words recovered by the welcome lose newest-first order (RECON-01 AC 3, PLAY-01 AC 17) | `packages/phone/src/model/room-view.ts:137` | yes |
| shared words listed without the server's acceptance (RES-01 AC 5) | `packages/phone/src/model/results.ts:65` | yes |
| a refusal removes a word the server had already accepted (PLAY-01 AC 13) | `packages/phone/src/model/found.ts:29` | yes |
| the board opens 1 ms after startsAt (COUNT-01 AC 2, C43) | `packages/phone/src/model/screen.ts:63` | yes |
| countdown number changes 1 ms late at each second (COUNT-01 AC 1) | `packages/phone/src/model/clock.ts:40` | yes |
| the first welcome of a fresh connection flashes Conectado (RECON-01 AC 3) | `packages/phone/src/model/connection-banner.ts:16` | yes |
| history kept across matches (POD-01 AC 4) | `packages/phone/src/state/match.ts:26` | yes |

Rodadas com `mutate.py` (o mesmo injetor do `check_proofs.py --mutations`) direto, para não reescrever `proofs.md` nem rodar todos os E2E enquanto o sub-agente de telas trabalha no mesmo tree; o round 2 do orquestrador roda `check_proofs.py m3-phone --mutations .specs/features/m3-phone/mutations.json`. Todos os arquivos foram restaurados byte a byte.

Mutantes sondados e deixados fora do `mutations.json` por serem equivalentes (nenhum teste pode matá-los, e nenhum é finding): `isLonger` `>` -> `>=` (comprimentos já diferem nesse ramo); `tileAtPoint` `Math.min` -> `Math.max` do lado da peça (o `FitSquare` sempre dá um tabuleiro quadrado); `canStep` sem a guarda `index !== -1` (o servidor só manda valores da lista). O desempate de posição no placar rápido (`placesOf` `>` -> `>=`) sobrevive à prova da C70, mas morre em `players.test.ts` inteiro (`shares the place of a tie and keeps the joining order`); RES-01 AC 6 não fixa empate, então não é finding.

## Own examples

- PLAY-01 AC 5 e AC 10 com "Qu": o caminho [Qu, a] soletra `qua` (3 letras); com mínimo 3 o hash que bate dá "VÁLIDA", com mínimo 4 dá "MUITO CURTA". Passa em HEAD.
- RES-01 AC 6 e POD-01 AC 2 com todo mundo em 0 pontos: os dois jogadores ficam em 1º, o espectador por último sem posição, sala vazia dá lista vazia, `myPlacement` dá 1º no empate do pódio. Passa em HEAD.
- PLAY-01 AC 8 com dois deslizes da mesma palavra soltos antes do primeiro julgamento terminar: em HEAD dá "JÁ ENCONTRADA" e um envio (vira o primeiro finding, porque nenhum teste do repositório segura isso).

## Hard rules (CLAUDE.md) conferidas

- Servidor autoritativo: o celular só julga localmente para o feedback; `submit-result` e `welcome` mandam na lista (`room-view.ts`, `found.ts`).
- Nenhuma palavra antes do resultado: o celular só recebe sal e prefixos (`judge.ts`, `applyHashFrame`); `confirmAccepted` só vê palavras que o próprio celular mandou.
- Token só no `hello` (`net/room-connection.ts`, `net/browser.ts`: o URL é `/api/rooms/<code>/ws`); guardado em `bwords.token.<CODE>`.
- Protocolo só com códigos: `model/messages.ts` mapeia todo `ErrorCode` e `CloseReason` para chaves da tabela (C107).
- Sem CSS Grid nem `gap`, nem cor literal em `src/styles/*.css` (inclusive em variáveis locais); ver o finding das cores em `index.html` e `JoinScreen.tsx`.
- Dicionário por HTTP: ver o finding do Vite `/@fs/`.
