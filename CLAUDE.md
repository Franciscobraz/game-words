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

## Regras que não se quebram

- **O servidor é autoritativo.** Toda regra de jogo é decidida no servidor com funções do `core`; os clientes só mostram e pedem.
- **Nenhuma palavra da rodada chega a um cliente antes do resultado**, exceto a que o próprio jogador acabou de enviar. Os celulares só recebem prefixos de hash com salt (L-008, DESIGN §6.2).
- **O dicionário fica só no servidor:** o pacote de idioma nunca é servido por HTTP (PROTO-01 AC 8).
- **Tokens nunca vão na URL**, só na mensagem `hello`.
- **O protocolo só carrega códigos** (`'nickname-taken'`, `'kicked'`); o texto que o jogador vê sai da tabela de strings do cliente.
- **O repositório é público:** nada de dados pessoais, e-mails, subdomínios de conta ou segredos em código, docs ou commits.
- **Licenças:** código MIT; o dicionário segue a licença do VERO (LGPL/MPL) e fica em `languages/` e no pacote gerado.

## Pronto quer dizer

- Os testes nascem dos critérios do spec; nenhum teste é enfraquecido, pulado ou apagado para passar.
- Antes de cada commit passam `npx tsc -b`, `npx vitest run`, o lint do pacote tocado e os E2E da feature.
- Tela com capture em `.specs/features/<feature>/captures/` é conferida contra ela a 390 px (celular) ou 1920 px (TV), mas o layout é fluido: o celular funciona de 320 a 480 px e a TV de 720p a 1080p (AD-016). Responsividade vem antes de bater pixel com a capture.
- Um commit atômico por tarefa, em *conventional commits* em inglês.

## Onde está cada coisa

- `docs/DESIGN.md` - regras do jogo, sala, celular, TV, dicionário e marcos
- `docs/screens.md` - descrição das telas; as captures binding ficam no spec de cada feature
- `.specs/STATE.md` - decisões (`AD-NNN`) e o ponto em que o trabalho parou
- `.specs/LESSONS.md` - lições de verificações passadas
- `.specs/features/<feature>/` - spec, design, tasks e provas de cada marco
- `packages/theme/tokens.css` - paleta, tipografia, raios e espaços de todas as telas; nenhuma cor literal fora dele (AD-017)

## Ambiente

- **Pacote do dicionário:** o binário pt-BR é git-ignored. Rode `npm run dict:build` uma vez antes de `npm run debug`, `npm run play` ou do servidor; os testes usam um pacote de fixture e não precisam dele.
- **Portas:** 8787 `wrangler dev`, 5173 `play`, 5174 `debug`, 5175 celular.
- **Windows:** os scripts Python da skill rodam com `PYTHONUTF8=1` (ver o Handoff em `.specs/STATE.md`).

## Comandos

- `npm test` - Vitest (core e server)
- `npm run build` - `tsc -b` em todos os pacotes
- `npm run dict:build` - gera o pacote pt-BR em `tools/dict-build/dist`
- `npm run debug` - `wrangler dev` (8787) e a página de debug (5174)
- `npx playwright test` - E2E
