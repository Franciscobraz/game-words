# BWords

Jogo de encontrar palavras num tabuleiro de letras, para jogar em grupo na sala de casa. A TV (ou um PC) mostra o jogo, e cada jogador entra pelo celular, lendo um QR code, e usa o celular como controle.

**Jogue agora:** <https://words.chicobraz.com.br/>

Abra o endereço na TV ou no computador para criar uma sala. Nos celulares, leia o QR code da tela ou abra `/join` e digite o código de 4 letras da sala.

## Como funciona

### O jogo

- Todos jogam no mesmo tabuleiro (4x4, 5x5 ou 6x6), ao mesmo tempo, numa rodada cronometrada.
- Uma palavra é formada deslizando o dedo por peças vizinhas nas 8 direções, sem repetir a mesma peça.
- Acentos e Ç são ignorados: formar M-A-E vale "mãe". A peça "Qu" conta como 2 letras.
- Pontos: 3 letras valem 1, 4 valem 2, 5 valem 3 e cada letra a mais soma 1. Uma palavra que só um jogador achou vale o dobro.
- O primeiro celular que entra vira o anfitrião: ele escolhe as configurações (tabuleiro, tempo, rodadas, tamanho mínimo, filtro de palavrões, música) e conduz a partida.
- Depois de cada rodada, a TV mostra todas as palavras encontradas e quem achou cada uma; no fim, o pódio e as vitórias da sessão.
- Até 10 jogadores por sala, sem cadastro. Quem perde a conexão volta para a sala com os mesmos pontos.

As regras completas estão em [docs/DESIGN.md](docs/DESIGN.md), e as telas em [docs/screens.md](docs/screens.md).

### A arquitetura

```
 TV (navegador) ──┐
                  ├── WebSocket ──▶ Cloudflare Worker ──▶ Durable Object (uma sala)
 celulares ───────┘                  serve a TV e o celular     regras do @bwords/core
```

- **Servidor autoritativo:** toda regra é decidida no servidor, num Durable Object por sala, com as funções puras do `core`. Os clientes só mostram o estado e mandam pedidos.
- **O dicionário fica só no servidor.** O celular recebe só hashes salgados das soluções, o que basta para mostrar ✓/✗ na hora sem revelar nenhuma palavra; o servidor confirma e pontua em seguida.
- **Custo zero:** tudo roda no plano Free da Cloudflare (Workers, Durable Objects e Static Assets).
- **TVs antigas:** os clientes são Preact com CSS simples, transpilados para Chrome 53, para rodar em TVs de 2018 em diante.

### O monorepo

| Pasta | Conteúdo |
| --- | --- |
| `packages/core` | regras puras: normalização, gerador de tabuleiro, solver, pontuação, sala e protocolo |
| `packages/server` | Cloudflare Worker + Durable Object da sala |
| `packages/phone` | cliente do celular (Preact + Vite) |
| `packages/tv` | cliente da TV (Preact + Vite) |
| `packages/theme` | paleta, tipografia e espaços de todas as telas |
| `languages/pt-BR` | listas editáveis do dicionário: palavras extras, bloqueadas e palavrões |
| `tools/dict-build` | gera o pacote do dicionário pt-BR a partir do VERO (LibreOffice) |
| `tools/assets-build` | monta os dois clientes na pasta que o Worker serve |
| `tools/play`, `tools/debug` | página para jogar sozinho no navegador e página de debug do servidor |
| `docs/`, `.specs/` | documentos de projeto, specs e decisões |

## Rodar localmente

### Requisitos

- **Node.js 24** (o projeto roda scripts `.ts` direto no Node, sem compilar).
- **npm** (o repositório usa npm workspaces).
- Acesso à internet na primeira geração do dicionário, que baixa as fontes do GitHub.

Não é preciso conta na Cloudflare para rodar localmente: o `wrangler dev` simula o Worker e o Durable Object na sua máquina.

### 1. Instalar e gerar o dicionário

```bash
npm install
```

```bash
npm run dict:build
```

O `dict:build` baixa o dicionário do VERO e a lista de frequências e gera o pacote pt-BR em `tools/dict-build/dist/pt-BR`. Ele fica fora do git e só precisa ser gerado uma vez (ou de novo depois de editar `languages/pt-BR/`).

### 2. Jogar uma partida completa (TV + celulares)

```bash
npm run assets:build
```

```bash
npm run dev -w @bwords/server
```

O primeiro comando gera os dois clientes em `packages/server/public/`; o segundo sobe o Worker em `http://localhost:8787`.

- **TV:** abra `http://localhost:8787/` (ou `/tv`). A sala é criada e o código aparece na tela.
- **Celulares:** abra `http://localhost:8787/<CÓDIGO>` em outra aba ou janela, uma por jogador, ou `http://localhost:8787/join` para digitar o código.

Para simular vários jogadores no mesmo computador, use janelas anônimas ou perfis diferentes do navegador, porque cada jogador guarda o seu token no `localStorage`.

> Recursos que exigem HTTPS, como a Wake Lock (tela sempre acesa) e o `crypto.subtle` no celular, só funcionam por completo no endereço publicado.

### Outros modos de desenvolvimento

| Comando | O que faz | Porta |
| --- | --- | --- |
| `npm run play` | joga sozinho no navegador, sem servidor, para calibrar tabuleiros | 5173 |
| `npm run debug` | sobe o `wrangler dev` e uma página de debug que fala o protocolo da sala | 8787 e 5174 |
| `npm run dev -w @bwords/phone` | Vite do cliente do celular, com hot reload | 5175 |
| `npm run dev -w @bwords/tv` | Vite do cliente da TV, com hot reload | 5176 |

## Testes e build

```bash
npx tsc -b
```

```bash
npm test
```

```bash
npm run lint -w @bwords/phone
```

```bash
npx playwright test -c packages/tv/playwright.config.ts
```

- `npx tsc -b` (ou `npm run build`) confere os tipos de todos os pacotes.
- `npm test` roda o Vitest do `core`, das ferramentas e do servidor (este no runtime `workerd`). Os testes usam um pacote de dicionário de fixture e não dependem do `dict:build`.
- `npm run lint -w @bwords/phone` e `-w @bwords/tv` rodam o ESLint dos clientes.
- Os E2E usam Playwright: `npx playwright test` (o `play`), `-c packages/phone/playwright.config.ts` (o celular) e `-c packages/tv/playwright.config.ts` (a partida inteira pelo Worker; roda o `assets:build` antes). Na primeira vez, instale o navegador com `npx playwright install chromium`.

## Deploy

`npm run deploy` gera os clientes e publica o Worker na Cloudflare. Os passos, a conferência depois de publicar e como voltar atrás estão em [docs/deploy.md](docs/deploy.md).

## Contribuir

- O processo é Spec-Driven Development: cada mudança começa por um spec em `.specs/features/<feature>/`, e as decisões de projeto ficam em [.specs/STATE.md](.specs/STATE.md).
- As regras de código estão no [style guide](docs/style-guide.md). Código em inglês, documentos em português.

## Licença

- Código: MIT.
- Dicionário pt-BR: gerado a partir do VERO (LibreOffice, LGPLv3/MPL) e do FrequencyWords (CC-BY-SA 4.0). Veja o [NOTICE](NOTICE).
