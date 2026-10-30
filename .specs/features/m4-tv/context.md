# M4 TV Context

**Gathered:** 2026-10-30
**Spec:** `.specs/features/m4-tv/spec.md` (ainda não escrito)
**Status:** spec, design e tarefas aprovados; em execução

Resposta do user a todas as recomendações abertas abaixo: "Aceito mas não gere o prompt ainda, estou ajustando algumas telas no stich, aguarde eu pedir para voce analisar novamente"

---

## Feature Boundary

O cliente da TV (`packages/tv`): lobby com QR, contagem, rodada, página de palavras, resultado final e áudio. Inclui a remoção do fast mode (AD-020) e as mudanças de servidor, protocolo e celular que o fluxo de AD-021 pede.

---

## Implementation Decisions

### Telas e captures

- As telas do Stitch em 16:9 viram as captures depois do ajuste final, como no AD-012. Rodada e pódio saíram cortados na imagem, mas o HTML cabe em 1920x1080: as captures desses saem do HTML renderizado.
- Saem todos os textos e ícones de enfeite, como no AD-005: "ARENA TV", "AO VIVO", "EDIÇÃO FESTA EM FAMÍLIA", "Display 1080p", "Sem controle remoto", ícone de perfil, número de pontos nas peças e os demais listados na análise.

- A tela da rodada não mostra quem está assistindo: a lista traz só quem joga a rodada. Diverge de `docs/screens.md` §4; user: "não precisamos mostrar mais quem está assistindo nessa pagina"

- O timer da rodada não tem o rótulo "TEMPO RESTANTE"; user: "ajustei o tempo restante, não precisamos desse texto"

- A tela da rodada está finalizada como em `captures/tv-round.jpg` (Stitch, `ef797a60`): textos, margens e o QR pequeno no topo ficam como desenhados, mesmo abaixo de 24 px, dentro da faixa de segurança e divergindo de DESIGN §4.2; user: "ignore esse pontos, finalize essa tela, e analise a tela resultado da rodada"

- "Tempo Esgotado" e "Reconectando" são definidas só no código, sem tela no Stitch e sem capture; o visual é aprovado por foto da tela rodando. Tempo Esgotado: a tela da rodada com o timer em "0:00", o tabuleiro esmaecido e "Tempo!" sobre ele, por 2 s, seguindo sozinha para a página de palavras. Reconectando: a tela atual com uma faixa fina "Reconectando…" no topo. user: "pronto, defina assim."

- Diferenças pequenas de medida contra 1920x1080, como 10x10 px, não contam na análise das telas; user: "ignore pequenas diferenças de tamanho como por exemplo 10x10 a mais na medida 1920x1080"

- "Sala Expirada" também é definida só no código, sem tela no Stitch e sem capture: logo "B" e "BWords" no topo, "Sala expirada" no centro e "Aperte OK no controle para abrir uma sala nova" logo abaixo, sem rodapé, código da sala ou QR. O visual é aprovado por foto da tela rodando. user: "corrija isso no codigo"

### Fluxo do resultado (AD-021)

- Em toda rodada: página de palavras, 5 s de espera e depois a página de resultado. Nas rodadas intermediárias, ela mostra o placar acumulado e o celular do anfitrião oferece "Próxima rodada". Só a última mostra o vencedor e "Jogar de novo".
- Na última rodada os celulares vão direto para o pódio, com o resumo pessoal e os botões do anfitrião, sem o "VER PÓDIO". A lista detalhada de palavras daquela rodada não aparece no celular.
- O resultado é uma tela só, entre as rodadas e no fim da partida, como em `captures/tv-round-result.jpg` (Stitch, `8e179fbf`): 1º, 2º e 3º em cartões, os outros abaixo em ordem de pontos e o tabuleiro com a palavra mais longa, com o código e o QR pequeno no topo. Os cartões ficam como no layout, sem círculo e com a mesma altura. A tela "TV - Pódio" sai. user: "2. não, mantem como está. 3. não, mantenha como está no layout. [...] pode remover a tela TV - Pódio atual como voce sugeriu"
- A ordem da palavra mais longa aparece com animação ao abrir a tela: as peças acendem letra por letra, sem linha ligando. user: "a ordem pode ser marcada com animação na hora de exibir, vai acendendo letra por letra."
- Resolvidos no código, sem outra tela; user: "ok, resolva no codigo": entre as rodadas o rodapé diz "Aguardando Ana avançar…"; na última rodada, "Aguardando Ana: jogar de novo ou voltar ao lobby". O título da última rodada é "Ana venceu!", com confete só nela. "(offline)" vira "(desconectado)". Com poucos jogadores, a lista inferior encolhe ou some.

### Áudio

- Efeitos sintetizados com Web Audio, sem arquivos. Se o navegador bloquear o som, o lobby mostra "Aperte OK no controle para liberar o som".

### Fim da sala

- Encerrada pelo anfitrião: abre uma sala nova sozinha.
- Expirada por inatividade: fica em "Sala expirada" até alguém apertar OK ou recarregar.
- Aberta em outra aba: só avisa e para.

### Servir o jogo

- O M4 inclui o Worker servindo a TV em `/tv` e o celular nas outras rotas, sem nunca expor o dicionário, com prova em `wrangler dev`. O deploy só com pedido do user.

### Defaults aceitos

- O resultado passa a trazer o total de palavras possíveis e quem achou cada palavra em comum (`foundBy`), só depois da rodada.
- O total de possíveis respeita o mínimo de letras e o filtro de palavrões da sala.
- Palavras do mesmo tamanho em ordem alfabética; grafias ao lado da palavra, como "SERIA (seria, séria)".
- Rolagem de cerca de 2 palavras por segundo, acelerando para durar no máximo 60 s.
- Sem palavras encontradas: "Nenhuma palavra encontrada", e a TV segue depois dos 5 s.
- "Tempo!" por 2 s antes da página de palavras.
- O botão do anfitrião continua ativo durante a rolagem e, se apertado, a interrompe.
- TV recarregada recomeça a rolagem do início.
- Junto da palavra mais longa: "Ana encontrou!" ou "Ninguém encontrou"; ela é marcada no tabuleiro mesmo sem ninguém ter achado.
- Quem entrou atrasado aparece na lista abaixo do pódio, com seus pontos.
- "Encerrar sala" continua no menu do anfitrião.
- O QR e o texto usam o endereço real onde a TV está aberta.
- O QR grande tem o "B" no centro, desde que continue legível.
- Textos em forma neutra (AD-013).
- As linhas "Vaga Livre #N" ficam no lobby.
- A TV guarda o token no `localStorage` e volta para a mesma sala ao recarregar; com a conexão caída, mostra "Reconectando…".
- O caminho das palavras usa o `findPath(board, word)` do `core`.

### Declined / Undiscussed Gray Areas → Assumptions

Nenhuma.

---

## Specific References

- Análise das telas do Stitch feita em 2026-10-30; o user está ajustando as telas e pede a próxima análise quando terminar.

---

## Deferred Ideas

- A lista de palavrões está vazia (`languages/pt-BR/profanity.txt` só tem comentários): pendência para o M5.
