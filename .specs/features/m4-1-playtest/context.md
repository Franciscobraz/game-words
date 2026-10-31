# m4-1-playtest Context

**Gathered:** 2026-10-31
**Spec:** ainda não existe; as perguntas abaixo vêm antes dele.
**Status:** à espera das respostas do user

---

## Feature Boundary

As correções pedidas depois do primeiro teste em TV e celular reais, com o M4 publicado na Cloudflare.

---

## O pedido, nas palavras do user

1. "Aparentemente todas as funcionalidades estão funcionando corretamente."
2. "Na tv existe um tempo de inatividade que coloca a tela da tv em descanso, como eu só abro a pagina no navegador e não mexo mais na tv, acaba ficando sem atividade, precisamos encontrar uma solução para manter a tela ativa."
3. "Na listagem das palavras, 1. Devemos deixar mais lento a rolagem das palavras para facilitar a leitura. 2. Navegar automaticamente para a pagina de resultados não foi uma boa decisão, devemos dá o controle de rolar a lista de palavras ao anfitrião e a funcionalidade de ir para tela de resultados manualmente."
4. "A tv pode ter um som e ou musica de fundo tranquilo que não gere ansiedade e perturbação que fique tocando enquanto a partida está em andamento, pode lembrar trilha sonora de jogos antigos, ou musica clássica como piano, o silencio na sala pode ser um problema."
5. "Remover a possibilidade de dar zoom na tela do celular, ao usar os botões da tela do anfitrião muito rapido, acaba dando zoom, esse comportamento foi verificado no safari em um iphone, mas acredito que possa acontecer em outros celulares."
6. "A rota padrão \"/\" pode ser o \"/tv\", já que no celular o acesso vai ser via QRcode na maioria das vezes, então ja vai com /<codigo-da-sala>"
7. "Para próximas versões, fazer um sistema de dica de palavras quando o usuário passa 10s sem tentar e ou enviar nenhuma palavra o sistema pode da dica de palavras apenas com 3 letras, se o mínimo de letras da partida for acima de 3 as dicas ficam desabilitadas, e o usuário no celular deve poder habilitar ou desabilitar as dicas."

---

## Implementation Decisions

Nenhuma ainda. Os itens 3 e 6 contrariam decisões e critérios aprovados (AD-021; C16, que serve o celular em `/`) e viram `AD-NNN` quando o user responder.

---

## Deferred Ideas

- **Dicas de palavras (item 7):** fica para uma próxima versão, fora desta feature. O design terá de resolver um conflito: hoje nenhuma palavra da rodada chega a um cliente antes do resultado (L-008, DESIGN §6.2), e uma dica é exatamente isso.
