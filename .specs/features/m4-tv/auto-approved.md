# M4 TV - aprovações automáticas

**Autorização, 2026-10-30:** user: "Eu vou precisar sair, pode aprovar os defaults das fases 8 e 9 automaticamente, gerar uma anotação do que foi aprovado, e iniciar a fase 10 automaticamente, quando voltar vejo se tudo terminou."

Esta anotação lista o que foi aprovado em nome do user, para ele revisar quando voltar. Nada aqui foi enviado por push.

## Defaults das fases 8 e 9

T28 a T33, commits `7aa84e8` a `973ae05`. Conferido pelo orquestrador em `973ae05`, pelo código de saída: `tsc` e lint verdes, Vitest 996, E2E da TV 71, E2E do celular 79, `packages/phone` sem nenhuma mudança. O E2E do play não foi repetido pelo orquestrador (10 verdes pelo subagente).

Aprovados em nome do user:

1. Na TV, `kicked` abre sala nova.
2. `replaced` mantém o token, porque a outra aba o usa. A tela de outra aba tem o layout de "Sala expirada", sem dica, e tecla não faz nada nela.
3. "Sem conexão" fica em vermelho, "Reconectando…" em cor neutra, e a dica do OK na mesma linha da faixa.
4. A janela de 30 s vai da primeira queda até o `welcome`. Um socket que abre e cai não a zera.
5. Tecla antes do limite de 10 min não faz nada. Depois do limite, ela volta a "Reconectando…", com nova janela de 30 s.
6. Áudio: tons de 880, 440 e 660 Hz; apito de 2400 Hz com vibrato de 28 Hz por 0,6 s; ganho 0,5 no volume 100. Nenhum humano ouviu ainda.
7. Com o som bloqueado, o efeito é pulado, não adiado.
8. Recarregar no meio da rolagem não toca o efeito de início da rolagem. Resultado atrasado, numa TV que via a rodada, toca.
9. Arquivos além dos previstos: `ExitNotice`, `state/any-press.ts`, `state/sound.ts`, `testing/fake-audio.ts`, `e2e/cuttable-room.ts`, `e2e/record-sounds.ts`, `e2e/audio.spec.ts`.

## Não aprovado: fica para o user decidir

Estes itens não são defaults, então não entram na autorização.

- **Bug existente em `packages/core/src/client/room-connection.ts`:** se um socket abre e cai antes do `welcome`, `startReconnecting` agenda um segundo prazo e perde o cancelamento do primeiro. Esse prazo órfão derruba uma conexão saudável depois do `welcome`, aos 30 s no celular e aos 10 min na TV. O caso é raro, porque com a rede caída o socket nem abre. A correção proposta tem uma linha (`cancelOffline ??= schedule(...)`), mas altera o comportamento do celular nesse caso.
- **Pasta `C:\c\` fora do repositório:** um spec temporário do subagente a criou, com 3 PNGs de conferência. A remoção foi bloqueada. Não foi apagada.

## Instabilidades vistas nas fases 8 e 9

- `install` seguido de `pauseAt` no mesmo instante falhou uma vez com "Cannot fast-forward to the past". O helper novo foi corrigido, mas o padrão continua em `round.spec`, `words.spec` e outros.
- `result.spec`, "says when nobody found the longest word", falhou uma vez sem causa conhecida. Não reproduziu em 210 repetições.

