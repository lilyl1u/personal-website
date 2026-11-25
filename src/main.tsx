import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/700-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles.css';
import App from './App';
import { applyPalette } from './vinyl/palette';

applyPalette();

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
