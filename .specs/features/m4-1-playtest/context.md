# m4-1-playtest Context

**Gathered:** 2026-10-31
**Spec:** ainda não existe.
**Status:** respostas recebidas; o spec começa depois do fechamento do M4

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

Os itens 3 e 6 e o pódio sincronizado contrariam decisões e critérios aprovados (AD-021; C11, o pódio direto no celular; C16, o celular em `/`) e viram `AD-NNN` no spec.

### Tela da TV sempre ativa

- O teste foi numa LG Nanocell, com o navegador que vem na TV, mas a solução não depende de modelo nem de navegador: várias técnicas em camadas, sem nada que os jogadores percebam.
- O design avalia a música de fundo como uma das camadas e, além dela, a Screen Wake Lock, o vídeo mudo em loop e alguma ação periódica imperceptível. A prova final é na TV real.
- user: "a tv em especifico é uma LG Nanocell e o navegador é um padrão que ja vem instalado, mas não devemos nos prender a nenhum modelo de tv ou navegador, temos que achar uma solução para inatividade, talvez tocar uma musica de fundo resolva a inatividade em alguns navegadores/televisão, talvez programar um toque ou algum ação na tv que seja imperceptivel aos usuários e não atrapalhe o jogo"

### Lista de palavras

- A lista rola sozinha, a 1 palavra por segundo, sem o limite de 60 s.
- Os botões ▲ e ▼ no celular do anfitrião assumem o controle ao primeiro toque.
- "Ver resultado" fica disponível no celular do anfitrião o tempo todo; a TV não vai mais sozinha para o resultado.
- user: "concordo com o recomendado" (perguntas 2 e 3)

- Pedido de 2026-11-03: destacar uma palavra por vez enquanto a lista desce, com um som de "check" a cada destaque. user: "Na lista de palavras, coloque o funcionamento de grifar e ou destacar uma palavra por vez enquanto a tela desce, para guiar a leitura dos usuários, junto efeito de grifar deve tocar um som de \"check\" ou \"pontuação\" valida."

### Música

- Música original no estilo de jogos antigos, calma, gerada no navegador, sem arquivo nem licença. O user pode trocá-la depois.
- Toca da primeira contagem até o resultado da última rodada, sem recomeçar a cada rodada, em silêncio no lobby, e mais baixa que os outros sons.
- O lobby do anfitrião tem a opção "Música", para ligar e desligar.
- user: "concordo com o recomendado, depois eu decido se coloco outra musica" (pergunta 4); "concordo" (pergunta 5); "sim" (pergunta 6)

### Rotas

- `/` abre a TV, e `/tv` continua funcionando.
- A TV mostra o endereço completo da sala, como `X/KBXT`.
- A tela de digitar o código vai para `/join`, e o celular volta para lá ao sair de uma sala.
- user: "a tela de entrar com codigo pode virar \"/join\""

### Pódio sincronizado

- O pódio abre na mesma hora na TV e nos celulares; os celulares não o abrem mais direto ao fim da última rodada.
- Enquanto a TV mostra as palavras, o celular mostra uma tela intermediária que manda olhar para a TV.
- user: "Sincronize a exibição do pódio no mesmo momento entre a tv e os celulares para manter a atenção dos jogadores na tela da tv na hora que as palavras estiverem sendo exibidas, no celular pode ter uma tela intermediaria que manda apenas olhar para tv para conferir a exibição das palavras encontradas"

### Zoom no celular

- O zoom por toque duplo e por pinça sai de todas as telas do celular. A prova final é num iPhone real.

---

### Tela de resultado da rodada (pedido de 2026-11-03)

- user: "Novos requisitos: 1. Na pagina de resultado da rodada, 1. Deve ser mostrado quantas palavras aquela pessoa encontrou, hoje só é mostrado quantos pontos ela fez. (o layout no stitch da pagina está corrigido) 2. A area que mostra a maior palavra do tabuleiro deve vir acima do tabuleiro que mostra. (o layout no stitch da pagina está corrigido) 3. nessa pagina deve tocar uma musica animada de fim da rodada, festejar o podio(pode manter criando como estamos criando os outros sons)."
- A referência é a tela "TV - Resultado da Rodada" do Stitch (projeto 13555119467933870727, screen `8e179fbf565d4dd0bb10dfa9c5c3117d`). O screenshot do Stitch está desatualizado; o HTML da tela tem o layout corrigido: o cartão da maior palavra acima do tabuleiro e "N plvrs · P pts" em cada cartão e linha ("1 plvr · 1 pt" no singular). A capture sai do HTML renderizado a 1920x1080. user: "veja novamente no stitch, ele não perdeu os pontos na pagina de resultado da rodada"
- Respostas de 2026-11-03:
  - O cartão do código fica sem "CÓDIGO DA SALA". user: "Pode remover o rótulo, não precisamos dele. já é bastante claro que o codigo e o qrcode é referente a sala"
  - Pontos e palavras andam juntos: entre as rodadas, os da rodada; no resultado da última rodada, a soma da partida dos dois. Muda TVRES-01 AC 2, que mostrava pontos acumulados em todo resultado. user: "Mantenha coerencia entre pontos e palavras, deve ser mostrados pontos e palavras por rodada, na rodada final mostrar o somatorio dos 2 valores."
  - "plvrs" abreviado, como no Stitch. user: "mantenha \"plvrs\" abreviado"
  - Uma vinheta só, a mesma em todas as rodadas, de cerca de 30 s, em loop enquanto o resultado estiver na tela. user: "Mantenha a mesma vinheta em todas as salas, ela deve ser mais longa, pode ter 30s e ficar rodando em looping."
  - Entre as rodadas, a ordem e as posições seguem os pontos da rodada, com o título "Classificação da Rodada N"; no resultado da última rodada, seguem a soma da partida. user: "Sim, pela rodada" (pergunta: "Entre as rodadas, o placar ordena pelos pontos da rodada?")
- Perguntas feitas antes, com a recomendação: (1) o cartão do código sem "CÓDIGO DA SALA", como no Stitch; (2) palavras da partida inteira, somadas pelo servidor, para combinar com os pontos acumulados; (3) "plvrs", como no Stitch; (4) vinheta curta a cada resultado e comemoração mais longa no da última rodada, com a música de fundo em silêncio no resultado, a opção "Música" desligando as duas e sem repetir numa TV recarregada.

### Pendências do fechamento do M4 (2026-11-03)

- Entram nesta feature, como recomendado:
  - um socket que abre e cai antes do `welcome` não deixa prazo esquecido que derrube a conexão seguinte (`packages/core/src/client/room-connection.ts`);
  - na rodada, a faixa "Reconectando…" fica abaixo do cartão do código, sem cobri-lo;
  - o config de E2E do celular usa 4 workers, como o da TV;
  - o lobby da TV diz "Quem entrar primeiro vira anfitrião(ã)" (AD-013);
  - `docs/DESIGN.md` cita `wrangler.jsonc` no lugar de `wrangler.toml`.
- O flash de cerca de 100 ms ao recarregar a TV na rolagem fica como está; a rolagem muda nesta feature.
- A pasta `C:\c\`, fora do repositório, com 3 imagens de teste: o user aprovou apagar, mas a trava de segurança do Claude Code recusou `rm -rf` nela, e a remoção fica com o user.
- user: "aceito as sugestões das 7 pendencias, pode seguir com o fechamento do M4"

## Deferred Ideas

- **Dicas de palavras (item 7):** fica para uma próxima versão, fora desta feature. O design terá de resolver um conflito: hoje nenhuma palavra da rodada chega a um cliente antes do resultado (L-008, DESIGN §6.2), e uma dica é exatamente isso.
