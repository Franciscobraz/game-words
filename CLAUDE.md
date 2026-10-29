# BWords

Jogo de encontrar palavras: uma TV mostra o jogo e cada jogador usa o celular como controle. Monorepo TypeScript: `packages/core` (regras puras), `packages/server` (Cloudflare Worker + Durable Object), clientes Preact em `packages/phone` e `packages/tv`.

## Antes de escrever código

- Siga o style guide do projeto, importado abaixo. Ele vale para toda tarefa, inclusive as que não o mencionam.
- Decisões de projeto ficam em `.specs/STATE.md` (`AD-NNN`) e em `docs/DESIGN.md`. Consulte-as antes de propor algo que as contrarie.
- Código em inglês, documentos em português, com os termos técnicos em inglês (AD-001).

@docs/style-guide.md

## Processo: Spec-Driven Development

- Toda mudança de código passa por Spec-Driven Development: especificar, desenhar, quebrar em tarefas e executar, com a profundidade ajustada ao tamanho da mudança.
- **Skill padrão:** `tlc-spec-driven`. O user pode escolher outra skill de Spec-Driven Development dizendo o nome dela no pedido, para uma feature, ou registrando a troca como decisão em `.specs/STATE.md`, para o projeto todo. Sem essa escolha, use a padrão.
- Uma feature termina com a mesma skill com que começou, porque cada skill tem o seu formato de artefatos. Trocar no meio de uma feature exige pedido explícito do user.
- Nenhum código de feature antes de o spec estar aprovado pelo user.
- Os artefatos ficam em `.specs/features/<feature>/`; as decisões de projeto, em `.specs/STATE.md`.
- Execução fase a fase: ao fim de cada fase, pare, mostre o resultado e pergunte antes de seguir para a próxima.
- Push só com pedido explícito.

## Comandos

- `npm test` - Vitest (core e server)
- `npm run build` - `tsc -b` em todos os pacotes
- `npm run debug` - `wrangler dev` (8787) e a página de debug (5174)
- `npx playwright test` - E2E
