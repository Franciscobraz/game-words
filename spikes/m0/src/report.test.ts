import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { type CfRecord, type ReportInput, buildReport } from './report.ts';

const REPORT = new URL('../../../docs/m0-results.md', import.meta.url);
const CRITERIA = [
  ['Tamanho do binário', '≤ 10 MB'],
  ['Memória com o dicionário carregado', '≤ 64 MB'],
  ['Carga a frio', '≤ 500 ms'],
  ['Solver 6x6 (p95)', '≤ 50 ms de CPU'],
  ['Geração 6x6', '≤ 1 s'],
] as const;

const readReport = () => readFile(REPORT, 'utf8');

/** Table rows of the D3 section: name -> cells. */
function criteriaRows(md: string): Map<string, string[]> {
  const section = md.split('## Critérios de D3')[1]!.split('\n## ')[0]!;
  const rows = new Map<string, string[]>();
  for (const line of section.split('\n')) {
    if (!line.startsWith('| ') || line.startsWith('| Critério') || line.startsWith('| ---')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    rows.set(cells[0]!, cells);
  }
  return rows;
}

function listUnder(md: string, heading: string): string[] {
  const section = md.split(heading)[1]!.split('\n#')[0]!;
  return section.split('\n').filter((l) => l.startsWith('- '));
}

const accepted = Array.from({ length: 50 }, (_, i) => `palavra${String.fromCharCode(97 + (i % 26))}${i}`);
const discarded = Array.from({ length: 50 }, (_, i) => ({ form: `Forma-${i}`, reason: 'non-letter' }));

function input(over: { memoryMb?: number; binBytes?: number; cf?: Partial<ReportInput['cf']>; slow?: boolean } = {}): ReportInput {
  const solves: CfRecord[] = Array.from({ length: 100 }, (_, i) => ({
    route: '/solve', seed: i + 1, status: 200, wallMs: 150, cpuMs: over.slow ? 80 : 10, serverWallMs: 11,
  }));
  const gens: CfRecord[] = Array.from({ length: 20 }, (_, i) => ({
    route: '/generate', seed: i + 1, status: 200, wallMs: 150, cpuMs: 12, serverWallMs: over.slow ? 1500 : 13, attempts: 1,
  }));
  const load: CfRecord = { route: '/load', seed: null, status: 200, wallMs: 900, cpuMs: 4, serverWallMs: 90, loadMs: over.slow ? 900 : 80 };
  return {
    stats: {
      source: { repo: 'LibreOffice/dictionaries', commit: 'a'.repeat(40) },
      counts: {
        expanded: 1000,
        discarded: { uppercase: 10, 'non-letter': 600, length: 40, duplicate: 50 },
        afterUppercase: 990,
        afterNonLetter: 390,
        afterLength: 350,
        afterDedup: 300,
      },
      binBytes: over.binBytes ?? 2_000_000,
      sha256: 'f'.repeat(64),
      peakHeapMb: 700,
      samples: { seed: 1, accepted, discarded },
    },
    node: {
      node: 'v24.0.0', heapUsedMb: 8, arrayBuffersMb: 2, memoryMb: over.memoryMb ?? 10, loadMs: 2,
      solve: { p50Ms: 1, p95Ms: 3 }, generate: { p50Ms: 1, p95Ms: 3, meanAttempts: 1 },
    },
    cf: {
      cpuSource: 'wrangler tail',
      records: [load, ...solves, ...gens],
      removal: { workerRemoved: true, check: 'wrangler deployments list --name bwords-m0-spike', checkOutput: 'This Worker does not exist on your account.', checkedAt: '2026-10-26T00:00:00Z' },
      ...over.cf,
    },
    source: { repo: 'LibreOffice/dictionaries', commit: 'a'.repeat(40) },
  };
}

describe('M0 results report', () => {
  test('lists every D3 criterion with value, limit and verdict', async () => {
    const rows = criteriaRows(await readReport());
    expect([...rows.keys()]).toEqual(CRITERIA.map(([name]) => name));
    for (const [name, limit] of CRITERIA) {
      const [, value, lim, verdict] = rows.get(name)!;
      expect(value).toMatch(/\d/);
      expect(lim).toBe(limit);
      expect(['PASSA', 'FALHA']).toContain(verdict);
    }
  });

  test('marks memory as FAIL when the load was rejected', () => {
    const md = buildReport(
      input({
        cf: {
          loadError: 'HTTP 500: {"error":"Exceeded Memory Limit"}',
          records: [{ route: '/load', seed: null, status: 500, wallMs: 900, cpuMs: 4, serverWallMs: 90 }],
        },
      }),
    );
    const [, value, , verdict, detail] = criteriaRows(md).get('Memória com o dicionário carregado')!;
    expect(verdict).toBe('FALHA');
    expect(value).toContain('carga rejeitada');
    expect(detail).toContain('Exceeded Memory Limit');
    // The same Node reading passes when the Cloudflare load succeeds.
    expect(criteriaRows(buildReport(input())).get('Memória com o dicionário carregado')![3]).toBe('PASSA');
  });

  test('includes per-filter counts', async () => {
    const md = await readReport();
    const stats = JSON.parse(
      await readFile(new URL('../../../tools/dict-build/dist/pt-BR.stats.json', import.meta.url), 'utf8').catch(() => 'null'),
    ) as ReportInput['stats'] | null;
    const section = md.split('## Contagem de formas por filtro')[1]!.split('\n## ')[0]!;
    const rows = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Etapa') && !l.startsWith('| ---'));
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.split('|')[1]!.trim())).toEqual([
      'Expandidas pelo `unmunch`',
      'Sem letra maiúscula',
      'Só letras (sem hífen, apóstrofo, dígito, ponto)',
      'Entre 3 e 16 letras',
      'Sem duplicatas após normalizar',
    ]);
    if (stats) {
      const c = stats.counts;
      const expected = [c.expanded, c.afterUppercase, c.afterNonLetter, c.afterLength, c.afterDedup];
      expect(rows.map((r) => Number(r.split('|')[2]!.trim().replace(/\./g, '')))).toEqual(expected);
    }
  });

  test('includes 50 accepted and 50 discarded samples', async () => {
    const md = await readReport();
    expect(listUnder(md, '### 50 palavras aceitas')).toHaveLength(50);
    const disc = listUnder(md, '### 50 formas descartadas');
    expect(disc).toHaveLength(50);
    for (const d of disc) expect(d).toMatch(/^- .+ \((uppercase|non-letter|length)\)$/);
    expect(md).toMatch(/## Amostras \(semente \d+\)/);
  });

  test('recommends a plan B for each failed criterion', async () => {
    const allFail = buildReport(
      input({ memoryMb: 100, binBytes: 20 * 2 ** 20, slow: true }),
    );
    const rows = criteriaRows(allFail);
    expect([...rows.values()].every((r) => r[3] === 'FALHA')).toBe(true);
    const planB = listUnder(allFail, '### Plano B por critério em FALHA');
    expect(planB.map((l) => /^- \*\*(.+?)\*\*: Plano B: .{20,}/.exec(l)?.[1])).toEqual(CRITERIA.map(([n]) => n));
    expect(buildReport(input())).not.toContain('### Plano B');

    // The real report: every FALHA has its plan B.
    const md = await readReport();
    const failed = [...criteriaRows(md).values()].filter((r) => r[3] === 'FALHA').map((r) => r[0]!);
    const realPlanB = failed.length ? listUnder(md, '### Plano B por critério em FALHA') : [];
    expect(realPlanB.map((l) => /^- \*\*(.+?)\*\*: Plano B: /.exec(l)?.[1])).toEqual(failed);
  });

  test('records the VERO commit and the worker removal', async () => {
    const md = await readReport();
    const source = JSON.parse(await readFile(new URL('../../../tools/dict-build/source.json', import.meta.url), 'utf8')) as {
      commit: string;
    };
    expect(md).toContain(`no commit \`${source.commit}\``);
    expect(md).toMatch(/Worker `bwords-m0-spike` removido: sim\. `wrangler deployments list --name bwords-m0-spike`/);

    const notRemoved = buildReport(
      input({ cf: { removal: { workerRemoved: false, check: 'wrangler deployments list --name bwords-m0-spike', checkOutput: 'Deployment 1', checkedAt: 'x' } } }),
    );
    expect(notRemoved).toContain('removido: NÃO confirmado');
  });
});
