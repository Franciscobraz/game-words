# M4.1 Playtest verification

**Verdict**: FAIL
**Mutations**: 3 - probed C17, C62, C77
**Proofs**: `proofs.md` at 6392af4 (139 pass, 0 fail; mutations 3 killed, 0 not)
**Verifier**: independent sub-agent (author != verifier)

## Findings

| Finding | Evidence | Fix | Closed |
| --- | --- | --- | --- |
| O JSDoc da opção `music` cita critérios que o amendment renumerou: "música ligada numa sala nova" e "sala guardada sem `music`" são MUSIC-01 AC 13-14, não AC 8-9 (AC 8 hoje é a aba substituída, AC 9 o "Reconectando…"); o style guide §7 pede o requisito certo no JSDoc | `packages/core/src/room/protocol.ts:110` - `(MUSIC-01 AC 8-9)`; `packages/core/src/room/settings.ts:29` - `(MUSIC-01 AC 9)` | trocar para `MUSIC-01 AC 13-14` em `protocol.ts` e `MUSIC-01 AC 14` em `settings.ts`; só comentário, sem decisão do user | |

## Mutations

| Mutation | Proof | Killed |
| --- | --- | --- |
| `afterWelcome` em `words` manda `round-results` a todos, não só à TV (vazamento L-008 no `welcome`) - `machine.ts:210` | C17 | yes |
| Resultado entre as rodadas ordenado pelo `score` da partida, não pelos pontos da rodada - `standings.ts:43` | C62 | yes |
| Aceleração da música só com mais de 15 000 ms restantes (`>=` -> `>`) - `music.ts:50` | C77 | yes |

## Exemplos próprios (throwaway, apagados)

1. **Painel "Jogadores", empate (WORDCTL-01 AC 24, 29):** empate no topo entre o primeiro e o último a entrar, com `results.players` na ordem inversa da entrada; e 10 jogadores todos empatados em 1 ponto. Resultado: `a:1, d:1, b:0, c:0`, só `a` com `leader`, e os dez na ordem de entrada. Passou.
2. **Resultado entre as rodadas sem pontos (RESULT-02 AC 6, 10):** rodada do meio em que ninguém pontuou, com placares da partida diferentes (Ana 30, Beto 10, Caio 20) e uma espectadora atrasada. Resultado: Ana, Beto e Caio no 1º, com 0 plvrs e 0 pts, sem coroa, na ordem de entrada; a atrasada no 4º com 0 e 0. Passou.

## Observações sem achado

- O spec contra as captures: o "RODADA 1" e o "10 na sala" do painel de `tv-words.png` estão construídos (`WordsPlayersPanel.tsx`); as diferenças de `tv-round-result.png` estão todas em `## Differences from the source` com `Confirmed: y`.
- `endRound` manda aos celulares, em `words`, a mensagem `players` com placar e vitórias novas: não traz palavra da rodada (L-008 vale para palavras), e C17 cobre essa mensagem.
- Nenhum teste instável na rodada do `check_proofs.py`.
