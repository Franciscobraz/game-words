import { render } from 'preact';
import '@fontsource/nunito-sans/400.css';
import '@fontsource/nunito-sans/700.css';
import '@fontsource/nunito-sans/800.css';
import '@bwords/theme/tokens.css';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './app.tsx';

/** Mounts the TV app (TVUI-01). */
render(<App />, document.getElementById('app')!);
