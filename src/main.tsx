import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './AppShell.tsx';
import { SessionProvider } from './state/SessionProvider.tsx';
import './index.css';
import './shell.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  </StrictMode>
);
