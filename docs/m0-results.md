# M0: resultados do spike do dicionário

**Veredito: PASSA nos 5 critérios de D3. Recomendação: seguir com o plano (dicionário VERO completo num DAWG servido como asset e carregado no Durable Object).**

## Critérios de D3

| Critério | Valor medido | Limite | Veredito | Detalhe |
| --- | --- | --- | --- | --- |
| Tamanho do binário | 1,62 MB | ≤ 10 MB | PASSA | 1.702.840 bytes, 2.328.458 palavras |
| Memória com o dicionário carregado | 10 MB | ≤ 64 MB | PASSA | Node v24.18.0: heap 8,3 MB + 1,8 MB de ArrayBuffer após carregar; a Cloudflare carregou sem erro de memória |
| Carga a frio | 17 ms (mediana de 5) | ≤ 500 ms | PASSA | Tempo de parede medido no DO (busca no ASSETS + Dawg.fromBuffer), cada amostra num DO novo: 54 ms, 17 ms, 8 ms, 17 ms, 13 ms; CPU 2, 3, 1, 4, 4 ms |
| Solver 6x6 (p95) | 17 ms de CPU | ≤ 50 ms de CPU | PASSA | 100/100 resoluções com CPU do wrangler tail; p50 7 ms, máx. 30 ms |
| Geração 6x6 | 14 ms (p95) | ≤ 1 s | PASSA | 20/20 gerações; tempo de parede da invocação do DO, máx. 16 ms; CPU p95 11 ms |

## Como foi medido

- CPU na Cloudflare: campo `cpuTime` do evento do Durable Object no `wrangler tail --format json`, presente em 126 de 126 requisições. Uma operação por requisição: 1 `/load` de aquecimento do asset, 5 `/load` a frio (cada um num Durable Object novo), 100 `/solve` e 20 `/generate`.
- Tempo de parede no cliente (inclui a rede até a Cloudflare): `/solve` p95 237 ms, `/generate` p95 223 ms.
- Memória: o Workers não expõe o heap; medida no Node v24.18.0 (`process.memoryUsage()` após `gc()`), e na Cloudflare se comprovou que o DO carregou o binário e respondeu.
- Node local: carga 1,76 ms; solver 6x6 p50/p95 1,34/2,93 ms; geração 6x6 p50/p95 1,22/2,04 ms, média de 1 tentativa(s) por tabuleiro.
- Pico de heap do build: 242,8 MB (saída do `unmunch` lida em streaming).

## Contagem de formas por filtro

| Etapa | Formas restantes | Descartadas |
| --- | --- | --- |
| Expandidas pelo `unmunch` | 10.545.886 | - |
| Sem letra maiúscula | 10.469.642 | 76.244 |
| Só letras (sem hífen, apóstrofo, dígito, ponto) | 2.725.425 | 7.744.217 |
| Entre 3 e 16 letras | 2.437.442 | 287.983 |
| Sem duplicatas após normalizar | 2.328.458 | 108.984 |

## Amostras (semente 20261026)

### 50 palavras aceitas

- citarizassemos
- regorgeamento
- salmoeiram
- revigorentavas
- destabocadinha
- simpaticistas
- citarizemos
- debarias
- desencadeies
- granidissimo
- reparariam
- grabanos
- arquirrival
- guarecerei
- igualizei
- limnodinaste
- reopinam
- pincel
- apingentamo
- cocontratarem
- repreensona
- lollardistas
- encaminhadas
- viropexia
- helioporaceas
- lembadorzao
- escarapanteara
- divaricarao
- estuarialissima
- microcebo
- enfronhamo
- eclipsastes
- eliciadorona
- gomificadamente
- ramnitoizinhos
- ombreardes
- intecibilidades
- hinam
- anisidinas
- esvoejem
- sediaveis
- comerciariamos
- balancearemos
- malucados
- voluteadonas
- circunvoaremo
- neopteras
- astralizariam
- afaroladissimos
- epigramassem

### 50 formas descartadas

- correlatar-nos-ão (non-letter)
- desratar-se-ias (non-letter)
- puntado-lhes (non-letter)
- vesse-se-lhe (non-letter)
- calemburasse-as (non-letter)
- desvalisarmos-te (non-letter)
- farroufearem-nos (non-letter)
- candolou-o (non-letter)
- despauapiquemo-los (non-letter)
- esbranquiçava-as (non-letter)
- desportilhava-lhe (non-letter)
- canela-vos (non-letter)
- exaustar-te-ei (non-letter)
- desobumbrou-o (non-letter)
- desempencarem-nas (non-letter)
- enigmar-se-iam (non-letter)
- temperamos-lhe (non-letter)
- aperaltava-nos (non-letter)
- emparedavam-se (non-letter)
- chelda-me (non-letter)
- adligamo-vos (non-letter)
- subjetiviza-la-á (non-letter)
- desassustasse-as (non-letter)
- charolassem-na (non-letter)
- surpreendidíssmas (length)
- encatrafiar-se-ias (non-letter)
- mobile-te (non-letter)
- raízes-de-cobra (non-letter)
- engravidou-te (non-letter)
- aborbulharam-se-lhes (non-letter)
- marafoneado-lhes (non-letter)
- Bolívia-Antártida (uppercase)
- gazofilemos-lhes (non-letter)
- parabenteai-a (non-letter)
- arreatar-nos-ei (non-letter)
- bacorinharem-lhe (non-letter)
- empandoasse-o (non-letter)
- desregulamentar-se (non-letter)
- desenfardar-se-ias (non-letter)
- desdramatizado-me (non-letter)
- enloure-se-lhes (non-letter)
- ataleigassem-me (non-letter)
- Herzegóvina-Nauru (uppercase)
- escamujou-lhe (non-letter)
- vigavam-me (non-letter)
- aculeara-se (non-letter)
- reouvesste-me (non-letter)
- desguiarem-lhe (non-letter)
- almiranteio-a (non-letter)
- arredaste-me (non-letter)

## Observações

- Correção do E1 (flags UTF-8): o `.aff` do VERO declara `FLAG UTF-8`, mas o `unmunch` lê as flags byte a byte. As flags multibyte (À, Á, Ã, ... todas começando pelo byte 0xC3) aplicavam as regras umas das outras e geravam formas falsas como "heptaugadora" e "zooorganica". O build agora regrava o `.aff`/`.dic` em ISO-8859-1 antes do `unmunch` (todo o VERO cabe nele): cada flag vira um byte só, e cada letra das condições como `[^iíhrs]` também, o que antes descartava formas certas como "antiético". As flags de continuação que são só marcadores (NOSUGGEST `Ý` no `SFX 5`) saem, porque o `unmunch` não expande continuação. Resultado: 10.545.886 formas e 2.328.458 palavras, contra 83.189.912 e 11.581.890 antes; o binário caiu de 2.414.708 para 1.702.840 bytes. "heptaugadora" e "zooorganica" não estão mais no binário.
- Formas que ainda passam e vêm do próprio VERO, não do E1: radicais de ênclise sem o hífen (ex.: "enfronhamo", de "enfronhamo-lo"), aumentativos e diminutivos produtivos (ex.: "raposãozões") e as 12 entradas com FORBIDDENWORD (ex.: "ague"), que o `unmunch` ignora. Ficam para o filtro de palavras do marco 1.
- Carga a frio (E2): uma requisição de aquecimento (`loadMs` 760 ms, com o asset ainda fora do cache logo após o deploy) e depois 5 cargas, cada uma num Durable Object novo: 54, 17, 8, 17 e 13 ms. A mediana, 17 ms, decide o critério. A amostra única da rodada anterior (688 ms) foi feita com o asset fora do cache.
- CPU: o `wrangler tail --format json` traz `cpuTime` e `wallTime` (ms inteiros) por invocação, com `executionModel: durableObject` no evento do DO. O tail passa a amostrar acima de cerca de 1 evento por segundo, por isso as requisições foram espaçadas em 1,1 s (e 3 s a mais antes de cada carga a frio). Todas as 126 requisições tiveram evento do DO na primeira tentativa.
- As resoluções e gerações rodaram no DO do aquecimento, já carregado. Uma exceção: a primeira resolução (semente 1) recarregou o dicionário (`loadedNow` verdadeiro), porque a Cloudflare recriou esse DO durante as cargas a frio. Sua CPU de 21 ms inclui a carga, que custa de 1 a 4 ms de CPU, e não muda o p95.
- Com o dicionário corrigido, um 6x6 aleatório tem de 408 a 4.240 palavras (mediana 1.424) no Node.

## Fonte e limpeza

- VERO: `LibreOffice/dictionaries` no commit `67032ee957631908098a72edf48dc81cac27e369` (https://github.com/LibreOffice/dictionaries/tree/67032ee957631908098a72edf48dc81cac27e369/pt_BR).
- Binário: SHA-256 `268a91fe0e168a1fb599f177a09c7908211f65f8833bcb8732d09a23edbcf9d3`.
- Worker `bwords-m0-spike` removido: sim. `wrangler deployments list --name bwords-m0-spike` em 2026-10-26T21:01:47.234Z respondeu "This Worker does not exist on your account".
