import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './AppShell.tsx';
import './i18n';
import { SessionProvider } from './state/SessionProvider.tsx';
import { AutoTranslate } from './components/AutoTranslate';
import './index.css';
import './shell.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
   <SessionProvider>
  <AppShell />
  <AutoTranslate />
</SessionProvider>
  </StrictMode>
);
