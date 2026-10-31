# Deploy na Cloudflare

O BWords roda inteiro num Worker com um Durable Object (`bwords`), no plano Free. O Worker serve a TV, o celular e o WebSocket; nada fora da Cloudflare é necessário.

## Antes do primeiro deploy

1. **Subdomínio:** o endereço final é `bwords.<subdomínio>.workers.dev`, e ele aparece no QR e na tela da TV. Confira no painel da Cloudflare, em Workers & Pages, se o subdomínio da conta não tem dados pessoais. Troque-o lá antes de publicar, se preciso.
2. **Login:** `npx wrangler whoami` deve mostrar a conta certa, com a permissão `workers_scripts (write)`. Sem login, rode `npx wrangler login`.
3. **Dicionário:** `npm run dict:build` uma vez, se `tools/dict-build/dist/pt-BR` não existir.

## Publicar

Pare o `wrangler dev` antes: o `assets:build` apaga e remonta `packages/server/public/`, a pasta que ele serve.

```bash
npm run deploy
```

O comando gera os clientes, monta `packages/server/public/` e publica. Para só simular, sem publicar:

```bash
npx wrangler deploy --dry-run --outdir .wrangler/dry-run -c packages/server/wrangler.jsonc
```

O ID da conta não fica no `wrangler.jsonc`: o `wrangler` o tira do login, e o repositório continua sem dados da conta.

## Conferir depois de publicar

| Endereço | Esperado |
| --- | --- |
| `/tv` | abre a TV e cria uma sala |
| `/` e `/<CÓDIGO>` | abrem o celular |
| `/pt-BR/dict.bin` e `/pt-BR/meta.json` | 404: o dicionário nunca é servido (PROTO-01 AC 8) |

Depois, jogue uma partida com uma TV e um celular reais e leia o QR de longe. Em HTTPS, o celular usa `wss` e têm efeito o `crypto.subtle` e o Wake Lock, que a rede local não permite testar.

## Voltar atrás

- `npx wrangler deployments list -c packages/server/wrangler.jsonc` lista as versões publicadas.
- `npx wrangler rollback -c packages/server/wrangler.jsonc` volta para a versão anterior.
- `npx wrangler delete -c packages/server/wrangler.jsonc` remove o Worker e as salas guardadas nele. Não tem volta.

## Privacidade

O repositório é público. Não escreva nele o endereço real, o subdomínio nem o ID da conta: nos documentos, use `<conta>`.
