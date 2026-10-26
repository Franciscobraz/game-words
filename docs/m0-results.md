# M0: resultados do spike do dicionário

**Veredito: FALHA em 1 de 5 critérios (Carga a frio). Recomendação: adotar o plano B indicado em cada critério.**

## Critérios de D3

| Critério | Valor medido | Limite | Veredito | Detalhe |
| --- | --- | --- | --- | --- |
| Tamanho do binário | 1,62 MB | ≤ 10 MB | PASSA | 1.702.840 bytes, 2.328.458 palavras |
| Memória com o dicionário carregado | 10,7 MB | ≤ 64 MB | PASSA | Node v24.18.0: heap 8,3 MB + 2,4 MB de ArrayBuffer após carregar; a Cloudflare carregou sem erro de memória |
| Carga a frio | 688 ms | ≤ 500 ms | FALHA | Tempo de parede medido no DO (busca no ASSETS + Dawg.fromBuffer); invocação do DO 712 ms, CPU 4 ms |
| Solver 6x6 (p95) | 21 ms de CPU | ≤ 50 ms de CPU | PASSA | 100/100 resoluções com CPU do wrangler tail; p50 10 ms, máx. 29 ms |
| Geração 6x6 | 18 ms (p95) | ≤ 1 s | PASSA | 20/20 gerações; tempo de parede da invocação do DO, máx. 21 ms; CPU p95 18 ms |

### Plano B por critério em FALHA

- **Carga a frio**: Plano B: embutir o binário no bundle do Worker em vez de buscá-lo nos assets, ou carregar o dicionário de forma preguiçosa antes da primeira rodada (ao criar a sala).

## Como foi medido

- CPU na Cloudflare: campo `cpuTime` do evento do Durable Object no `wrangler tail --format json`, presente em 121 de 121 requisições. Uma operação por requisição: 1 `/load` a frio, 100 `/solve` e 20 `/generate`.
- Tempo de parede no cliente (inclui a rede até a Cloudflare): `/solve` p95 243 ms, `/generate` p95 233 ms.
- Memória: o Workers não expõe o heap; medida no Node v24.18.0 (`process.memoryUsage()` após `gc()`), e na Cloudflare se comprovou que o DO carregou o binário e respondeu.
- Node local: carga 1,52 ms; solver 6x6 p50/p95 1,69/3,2 ms; geração 6x6 p50/p95 1,65/3,19 ms, média de 1 tentativa(s) por tabuleiro.
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

- Qualidade do dicionário: o `.aff` do VERO declara `FLAG UTF-8`, mas o `unmunch` lê as flags byte a byte. As flags de prefixo multibyte (À, Á, Ã, ... todas começando pelo byte 0xC3 em UTF-8) se confundem, e famílias inteiras de prefixos são aplicadas a palavras que não as têm (ex.: `funfar/ajkLMYÀ`). O resultado são 83 milhões de formas e 11,6 milhões de palavras, com muitas combinações que o VERO não aceitaria. A amostra de aceitas mostra isso: "heptaugadora", "zooorganica", "hexapojarao", "poliasseguremo".
- Por isso os números de desempenho são um limite superior: o dicionário medido é maior e mais denso que o real, e o solver encontra mais palavras por tabuleiro (cerca de 1.000 a 2.000 num 6x6). Para o marco 1, a expansão precisa tratar `FLAG UTF-8`: converter as flags para `FLAG num` antes do `unmunch`, ou expandir com o próprio Hunspell. Isso muda DICT-01 AC 2 e pede uma decisão do usuário.
- Carga a frio: a CPU do `/load` foi de 4 ms. O tempo vem da busca do binário nos static assets logo após o deploy. Uma rodada anterior, descartada porque o `wrangler tail` amostrou os eventos e só 22 de 121 requisições trouxeram CPU, mediu `loadMs` = 78 ms para o mesmo binário. Com uma única amostra por deploy, o valor oscila; o veredito usa a rodada oficial.
- CPU: o `wrangler tail --format json` traz `cpuTime` e `wallTime` (ms inteiros) por invocação, com `executionModel: durableObject` no evento do DO. O tail passa a amostrar acima de cerca de 1 evento por segundo, por isso as requisições foram espaçadas em 1,1 s. Todas as 121 tiveram evento do DO na primeira tentativa.
- O DO ficou quente durante toda a medição: só o `/load` fez a carga (`loadedNow` verdadeiro em 1 de 121 respostas).

## Fonte e limpeza

- VERO: `LibreOffice/dictionaries` no commit `67032ee957631908098a72edf48dc81cac27e369` (https://github.com/LibreOffice/dictionaries/tree/67032ee957631908098a72edf48dc81cac27e369/pt_BR).
- Binário: SHA-256 `268a91fe0e168a1fb599f177a09c7908211f65f8833bcb8732d09a23edbcf9d3`.
- Worker `bwords-m0-spike` removido: sim. `wrangler deployments list --name bwords-m0-spike` em 2026-10-26T20:41:12.312Z respondeu "This Worker does not exist on your account".
