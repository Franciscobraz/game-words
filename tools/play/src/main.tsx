import { boardSolutions, generateBoard, LanguagePack, type PackMeta, validateSubmission, wordPoints } from '@bwords/core';
import { render } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { Board } from './Board.tsx';
import './style.css';

/** Where the pack files are served; `?pack=/e2e-fixture` swaps in the E2E fixture. */
const PACK_URL = new URLSearchParams(location.search).get('pack') ?? '/pack';

async function fetchFile(name: string): Promise<Response> {
  const res = await fetch(`${PACK_URL}/${name}`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res;
}

async function loadPack(): Promise<LanguagePack> {
  const [dict, common, profanity, spellings, meta] = await Promise.all([
    fetchFile('dict.bin').then((r) => r.arrayBuffer()),
    fetchFile('common.bin').then((r) => r.arrayBuffer()),
    fetchFile('profanity.bin').then((r) => r.arrayBuffer()),
    fetchFile('spellings.bin').then((r) => r.arrayBuffer()),
    fetchFile('meta.json').then((r) => r.json() as Promise<PackMeta>),
  ]);
  return LanguagePack.fromBuffers({ dict, common, profanity, spellings, meta });
}

type Load = { state: 'loading' } | { state: 'error' } | { state: 'ready'; pack: LanguagePack };

const SIZES = [4, 5, 6];
const MIN_LENGTH = 3;
const FILTER_PROFANITY = true;

function App() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [size, setSize] = useState(4);
  const [seed, setSeed] = useState(1);
  const [board, setBoard] = useState<string[][]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const pack = load.state === 'ready' ? load.pack : null;

  const newBoard = (p: LanguagePack) => {
    try {
      setBoard(generateBoard(size, seed, p, { filterProfanity: FILTER_PROFANITY }).board);
      setFeedback('');
    } catch (err) {
      setBoard([]);
      setFeedback(err instanceof Error ? err.message : String(err));
    }
    setFound([]);
  };

  useEffect(() => {
    if (pack) newBoard(pack);
  }, [pack]);

  const solutions = useMemo(
    () => (pack && board.length > 0 ? boardSolutions(board, pack, { minLength: MIN_LENGTH, filterProfanity: FILTER_PROFANITY }) : null),
    [pack, board],
  );

  const submit = (path: number[]) => {
    if (!pack || !solutions) return;
    const result = validateSubmission(board, path, {
      solutions: solutions.words,
      found: new Set(found),
      minLength: MIN_LENGTH,
      filterProfanity: FILTER_PROFANITY,
      pack,
    });
    if (result.ok) {
      setFound([...found, result.word]);
      setFeedback(`Aceita: ${result.word}`);
    } else {
      setFeedback(`Rejeitada: ${result.reason}`);
    }
  };

  const total = found.reduce((sum, w) => sum + wordPoints(w), 0);

  useEffect(() => {
    loadPack().then(
      (pack) => setLoad({ state: 'ready', pack }),
      (err: unknown) => {
        console.error(err);
        setLoad({ state: 'error' });
      },
    );
  }, []);

  const ready = load.state === 'ready';
  return (
    <main>
      <h1>BWords solo</h1>
      <p data-testid="status" class={`status ${load.state}`}>
        {load.state === 'loading' && 'Carregando dicionário…'}
        {load.state === 'error' && (
          <>
            Não foi possível carregar o dicionário. Rode <code>npm run dict:build -- pt-BR</code>.
          </>
        )}
        {ready &&
          `Dicionário ${load.pack.meta.id} carregado: ${load.pack.dict.wordCount.toLocaleString('pt-BR')} palavras`}
      </p>
      <div class="controls">
        <label>
          Tamanho{' '}
          <select data-testid="size" value={size} onChange={(e) => setSize(Number(e.currentTarget.value))}>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}x{s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Semente{' '}
          <input
            data-testid="seed"
            type="number"
            value={seed}
            onInput={(e) => setSeed(Number(e.currentTarget.value))}
          />
        </label>
        <button type="button" disabled={!ready} onClick={() => pack && newBoard(pack)}>
          Novo tabuleiro
        </button>
      </div>
      <div class="game">
        <Board board={board} disabled={!ready} onSubmit={submit} />
        <section class="found">
          <p data-testid="feedback" class="feedback">
            {feedback}
          </p>
          <p data-testid="total" class="total">
            Total: {total}
          </p>
          <ol>
            {found.map((w) => (
              <li key={w} data-testid="found-word">
                <span data-testid="found-spelling">{pack!.spellings(w).join(' / ')}</span>{' '}
                <span data-testid="found-points" class="points">
                  +{wordPoints(w)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}

render(<App />, document.getElementById('app')!);
