import { render } from 'preact';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/700.css';
import '@fontsource/nunito-sans/800.css';
import './styles/tokens.css';

/** Mounts the phone app; the screens arrive with the app shell (UI-01). */
function App() {
  return <main class="app" />;
}

render(<App />, document.getElementById('app')!);
