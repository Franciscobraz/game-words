/**
 * Writes docs/m0-results.md from the build stats, the Node and Cloudflare benchmark results and the
 * pinned VERO source, with a PASSA/FALHA verdict per D3 criterion.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export interface StatsInput {
  source: { repo: string; commit: string };
  counts: {
    expanded: number;
    discarded: { uppercase: number; 'non-letter': number; length: number; duplicate: number };
    afterUppercase: number;
    afterNonLetter: number;
    afterLength: number;
    afterDedup: number;
  };
  binBytes: number;
  sha256: string;
  peakHeapMb: number;
  samples: { seed: number; accepted: string[]; discarded: { form: string; reason: string }[] };
}

export interface NodeInput {
  node: string;
  heapUsedMb: number;
  arrayBuffersMb: number;
  memoryMb: number;
  loadMs: number;
  solve: { p50Ms: number; p95Ms: number };
  generate: { p50Ms: number; p95Ms: number; meanAttempts: number };
}

export interface CfRecord {
  route: string;
  seed: number | null;
  status: number;
  wallMs: number;
  cpuMs: number | null;
  serverWallMs: number | null;
  loadMs?: unknown;
  attempts?: unknown;
  /** True for the /load that only warms the asset; every other /load is a cold sample on a new DO. */
  warmup?: boolean;
}

export interface CfInput {
  url?: string;
  error?: string;
  loadError?: string;
  cpuSource?: string;
  records?: CfRecord[];
  removal: { workerRemoved: boolean; check: string; checkOutput: string; checkedAt: string };
}

export interface ReportInput {
  stats: StatsInput;
  node: NodeInput;
  cf: CfInput;
  source: { repo: string; commit: string };
  notes?: string[];
}

export type Verdict = 'PASSA' | 'FALHA';

export interface Criterion {
  name: string;
  value: string;
  limit: string;
  verdict: Verdict;
  detail: string;
  planB: string;
}

const MB = 2 ** 20;
const fmt = (n: number, digits = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: digits });
const int = (n: number) => n.toLocaleString('pt-BR');

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]!;
}

const PLAN_B: Record<string, string> = {
  'Tamanho do binário':
    'Plano B: compactar o DAWG (arestas de 3 bytes ou codificação de sufixos) ou cortar formas raras (prefixos compostos e ênclises), com um dicionário enxuto medido de novo.',
  'Memória com o dicionário carregado':
    'Plano B: manter o dicionário fora do DO da sala (um DO compartilhado de dicionário ou um Worker sem estado consultado por RPC), ou adotar um dicionário enxuto.',
  'Carga a frio':
    'Plano B: embutir o binário no bundle do Worker em vez de buscá-lo nos assets, ou carregar o dicionário de forma preguiçosa antes da primeira rodada (ao criar a sala).',
  'Solver 6x6 (p95)':
    'Plano B: resolver uma vez por tabuleiro e guardar o resultado no DO, limitar o tamanho máximo de palavra no solver ou trocar o DFS por uma busca com bitmask de peças usadas.',
  'Geração 6x6':
    'Plano B: gerar o tabuleiro com antecedência (durante a rodada anterior), baixar o mínimo de palavras do 6x6 ou pré-gerar um banco de tabuleiros por semente.',
};

export function evaluate(input: ReportInput): Criterion[] {
  const { stats, node, cf } = input;
  const records = cf.records ?? [];
  const ok = (r: CfRecord) => r.status === 200;
  const loads = records.filter((r) => r.route === '/load');
  const coldAll = records.filter((r) => r.route === '/load' && !r.warmup);
  const coldLoads = coldAll.filter((r) => ok(r) && typeof r.loadMs === 'number');
  const solves = records.filter((r) => r.route === '/solve' && ok(r));
  const gens = records.filter((r) => r.route === '/generate' && ok(r));
  const nums = (xs: (number | null)[]) => xs.filter((x): x is number => typeof x === 'number');

  const criteria: Omit<Criterion, 'planB'>[] = [];

  const binMb = stats.binBytes / MB;
  criteria.push({
    name: 'Tamanho do binário',
    value: `${fmt(binMb, 2)} MB`,
    limit: '≤ 10 MB',
    verdict: binMb <= 10 ? 'PASSA' : 'FALHA',
    detail: `${int(stats.binBytes)} bytes, ${int(stats.counts.afterDedup)} palavras`,
  });

  // BENCH-01 AC 5: any /load the Cloudflare rejected, warm-up or cold, fails the memory criterion.
  const loadRejected = Boolean(cf.loadError) || !loads.length || !loads.every(ok);
  criteria.push({
    name: 'Memória com o dicionário carregado',
    value: loadRejected ? `${fmt(node.memoryMb)} MB (Node); carga rejeitada na Cloudflare` : `${fmt(node.memoryMb)} MB`,
    limit: '≤ 64 MB',
    verdict: !loadRejected && node.memoryMb <= 64 ? 'PASSA' : 'FALHA',
    detail: loadRejected
      ? `A Cloudflare não carregou o binário: ${cf.loadError ?? cf.error ?? 'sem resposta 200 para /load'}`
      : `Node ${node.node}: heap ${fmt(node.heapUsedMb)} MB + ${fmt(node.arrayBuffersMb)} MB de ArrayBuffer após carregar; a Cloudflare carregou sem erro de memória`,
  });

  // Verdict by the median of the cold samples (E2): one slow asset fetch does not decide it alone.
  const coldMs = coldLoads.map((r) => r.loadMs as number);
  const loadMs = coldMs.length ? median(coldMs) : null;
  criteria.push({
    name: 'Carga a frio',
    value: loadMs === null ? 'sem medida' : `${fmt(loadMs, 0)} ms (mediana de ${coldMs.length})`,
    limit: '≤ 500 ms',
    // BENCH-01 AC 7: the verdict needs exactly 5 cold samples, all with status 200 and loadMs.
    verdict: loadMs !== null && coldLoads.length === 5 && coldAll.length === 5 && loadMs <= 500 ? 'PASSA' : 'FALHA',
    detail:
      loadMs === null
        ? 'Nenhum /load a frio devolveu loadMs'
        : `${coldLoads.length === 5 && coldAll.length === 5 ? '' : `${coldLoads.length} de ${coldAll.length} /load a frio válidos; são exigidas 5 amostras. `}Tempo de parede medido no DO (busca no ASSETS + Dawg.fromBuffer), cada amostra num DO novo: ${coldLoads
            .map((r) => `${fmt(r.loadMs as number, 0)} ms`)
            .join(', ')}; CPU ${coldLoads.map((r) => r.cpuMs ?? '?').join(', ')} ms`,
  });

  const solveCpu = nums(solves.map((r) => r.cpuMs));
  const solveP95 = solveCpu.length ? percentile(solveCpu, 95) : null;
  criteria.push({
    name: 'Solver 6x6 (p95)',
    value: solveP95 === null ? 'sem medida' : `${fmt(solveP95, 0)} ms de CPU`,
    limit: '≤ 50 ms de CPU',
    verdict: solveP95 !== null && solveCpu.length === solves.length && solves.length === 100 && solveP95 <= 50 ? 'PASSA' : 'FALHA',
    detail: solveCpu.length
      ? `${solveCpu.length}/${solves.length} resoluções com CPU do wrangler tail; p50 ${fmt(percentile(solveCpu, 50), 0)} ms, máx. ${fmt(Math.max(...solveCpu), 0)} ms`
      : 'Nenhuma resolução com CPU registrada',
  });

  const genWall = nums(gens.map((r) => r.serverWallMs));
  const genP95 = genWall.length ? percentile(genWall, 95) : null;
  const genCpu = nums(gens.map((r) => r.cpuMs));
  criteria.push({
    name: 'Geração 6x6',
    value: genP95 === null ? 'sem medida' : `${fmt(genP95, 0)} ms (p95)`,
    limit: '≤ 1 s',
    verdict: genP95 !== null && genWall.length === gens.length && gens.length === 20 && genP95 <= 1000 ? 'PASSA' : 'FALHA',
    detail: genWall.length
      ? `${genWall.length}/${gens.length} gerações; tempo de parede da invocação do DO, máx. ${fmt(Math.max(...genWall), 0)} ms; CPU p95 ${genCpu.length ? fmt(percentile(genCpu, 95), 0) : '?'} ms`
      : 'Nenhuma geração medida',
  });

  return criteria.map((c) => ({ ...c, planB: c.verdict === 'FALHA' ? PLAN_B[c.name]! : '' }));
}

export function buildReport(input: ReportInput): string {
  const { stats, node, cf, source } = input;
  const criteria = evaluate(input);
  const failed = criteria.filter((c) => c.verdict === 'FALHA');
  const c = stats.counts;
  const records = cf.records ?? [];
  const solves = records.filter((r) => r.route === '/solve');
  const gens = records.filter((r) => r.route === '/generate');
  const clientP95 = (rs: CfRecord[]) => (rs.length ? `${fmt(percentile(rs.map((r) => r.wallMs), 95), 0)} ms` : '-');
  const commitUrl = `https://github.com/${source.repo}/tree/${source.commit}/pt_BR`;
  const L: string[] = [];

  L.push('# M0: resultados do spike do dicionário', '');
  L.push(
    failed.length === 0
      ? '**Veredito: PASSA nos 5 critérios de D3. Recomendação: seguir com o plano (dicionário VERO completo num DAWG servido como asset e carregado no Durable Object).**'
      : `**Veredito: FALHA em ${failed.length} de 5 critérios (${failed.map((f) => f.name).join(', ')}). Recomendação: adotar o plano B indicado em cada critério.**`,
    '',
  );

  L.push('## Critérios de D3', '');
  L.push('| Critério | Valor medido | Limite | Veredito | Detalhe |', '| --- | --- | --- | --- | --- |');
  for (const k of criteria) L.push(`| ${k.name} | ${k.value} | ${k.limit} | ${k.verdict} | ${k.detail} |`);
  L.push('');
  if (failed.length) {
    L.push('### Plano B por critério em FALHA', '');
    for (const f of failed) L.push(`- **${f.name}**: ${f.planB}`);
    L.push('');
  }

  L.push('## Como foi medido', '');
  const cpuCount = records.filter((r) => typeof r.cpuMs === 'number').length;
  const warmups = records.filter((r) => r.route === '/load' && r.warmup);
  const colds = records.filter((r) => r.route === '/load' && !r.warmup);
  L.push(`- CPU na Cloudflare: campo \`cpuTime\` do evento do Durable Object no \`wrangler tail --format json\`, presente em ${cpuCount} de ${records.length} requisições. Uma operação por requisição: ${warmups.length} \`/load\` de aquecimento do asset, ${colds.length} \`/load\` a frio (cada um num Durable Object novo), ${solves.length} \`/solve\` e ${gens.length} \`/generate\`.`);
  L.push(`- Tempo de parede no cliente (inclui a rede até a Cloudflare): \`/solve\` p95 ${clientP95(solves)}, \`/generate\` p95 ${clientP95(gens)}.`);
  L.push(`- Memória: o Workers não expõe o heap; medida no Node ${node.node} (\`process.memoryUsage()\` após \`gc()\`), e na Cloudflare se comprovou que o DO carregou o binário e respondeu.`);
  L.push(`- Node local: carga ${fmt(node.loadMs, 2)} ms; solver 6x6 p50/p95 ${fmt(node.solve.p50Ms, 2)}/${fmt(node.solve.p95Ms, 2)} ms; geração 6x6 p50/p95 ${fmt(node.generate.p50Ms, 2)}/${fmt(node.generate.p95Ms, 2)} ms, média de ${fmt(node.generate.meanAttempts, 2)} tentativa(s) por tabuleiro.`);
  L.push(`- Pico de heap do build: ${fmt(stats.peakHeapMb)} MB (saída do \`unmunch\` lida em streaming).`, '');

  L.push('## Contagem de formas por filtro', '');
  L.push('| Etapa | Formas restantes | Descartadas |', '| --- | --- | --- |');
  L.push(`| Expandidas pelo \`unmunch\` | ${int(c.expanded)} | - |`);
  L.push(`| Sem letra maiúscula | ${int(c.afterUppercase)} | ${int(c.discarded.uppercase)} |`);
  L.push(`| Só letras (sem hífen, apóstrofo, dígito, ponto) | ${int(c.afterNonLetter)} | ${int(c.discarded['non-letter'])} |`);
  L.push(`| Entre 3 e 16 letras | ${int(c.afterLength)} | ${int(c.discarded.length)} |`);
  L.push(`| Sem duplicatas após normalizar | ${int(c.afterDedup)} | ${int(c.discarded.duplicate)} |`, '');

  L.push(`## Amostras (semente ${stats.samples.seed})`, '');
  L.push(`### ${stats.samples.accepted.length} palavras aceitas`, '');
  for (const w of stats.samples.accepted) L.push(`- ${w}`);
  L.push('', `### ${stats.samples.discarded.length} formas descartadas`, '');
  for (const d of stats.samples.discarded) L.push(`- ${d.form} (${d.reason})`);
  L.push('');

  if (input.notes?.length) {
    L.push('## Observações', '');
    for (const n of input.notes) L.push(`- ${n}`);
    L.push('');
  }

  L.push('## Fonte e limpeza', '');
  L.push(`- VERO: \`${source.repo}\` no commit \`${source.commit}\` (${commitUrl}).`);
  L.push(`- Binário: SHA-256 \`${stats.sha256}\`.`);
  L.push(
    cf.removal.workerRemoved
      ? `- Worker \`bwords-m0-spike\` removido: sim. \`${cf.removal.check}\` em ${cf.removal.checkedAt} respondeu "This Worker does not exist on your account".`
      : `- Worker \`bwords-m0-spike\` removido: NÃO confirmado. Saída de \`${cf.removal.check}\`: ${cf.removal.checkOutput.replace(/\n/g, ' ')}`,
  );
  L.push('');
  return L.join('\n');
}

if (import.meta.main) {
  const root = new URL('../../../', import.meta.url);
  const json = async <T>(p: string) => JSON.parse(await readFile(new URL(p, root), 'utf8')) as T;
  const input: ReportInput = {
    stats: await json<StatsInput>('tools/dict-build/dist/pt-BR.stats.json'),
    node: await json<NodeInput>('spikes/m0/results/node.json'),
    cf: await json<CfInput>('spikes/m0/results/cf.json'),
    source: await json<{ repo: string; commit: string }>('tools/dict-build/source.json'),
    notes: await json<string[]>('spikes/m0/results/notes.json').catch(() => []),
  };
  const out = fileURLToPath(new URL('docs/m0-results.md', root));
  await writeFile(out, buildReport(input));
  console.log(`report -> ${out}`);
}
