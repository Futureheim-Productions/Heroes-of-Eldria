import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './styles/globals.css';
import { App } from './app/App';
import { installFakeLandscape } from '@/components/layout/fakeLandscape';

installFakeLandscape(); // before the first render, so nothing is ever laid out upright

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
