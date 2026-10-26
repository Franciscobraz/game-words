import { LanguagePack, type PackMeta } from '@bwords/core';
import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
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

function App() {
  const [load, setLoad] = useState<Load>({ state: 'loading' });

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
        <button type="button" disabled={!ready}>
          Novo tabuleiro
        </button>
      </div>
      <div data-testid="board" class="board" aria-disabled={ready ? 'false' : 'true'} />
    </main>
  );
}

render(<App />, document.getElementById('app')!);
