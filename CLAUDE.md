# BWords

Jogo de encontrar palavras: uma TV mostra o jogo e cada jogador usa o celular como controle. Monorepo TypeScript: `packages/core` (regras puras), `packages/server` (Cloudflare Worker + Durable Object), clientes Preact em `packages/phone` e `packages/tv`.

## Antes de escrever código

- Siga o style guide do projeto, importado abaixo. Ele vale para toda tarefa, inclusive as que não o mencionam.
- Decisões de projeto ficam em `.specs/STATE.md` (`AD-NNN`) e em `docs/DESIGN.md`. Consulte-as antes de propor algo que as contrarie.
- Código em inglês, documentos em português, com os termos técnicos em inglês (AD-001).

@docs/style-guide.md

## Comandos

- `npm test` - Vitest (core e server)
- `npm run build` - `tsc -b` em todos os pacotes
- `npm run debug` - `wrangler dev` (8787) e a página de debug (5174)
- `npx playwright test` - E2E
