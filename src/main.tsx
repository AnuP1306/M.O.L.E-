import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './AppShell.tsx';
import { SessionProvider } from './state/SessionProvider.tsx';
import { LanguageProvider } from './i18n/index.tsx';
import { ThemeProvider } from './theme.tsx';
import './index.css';
import './shell.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <SessionProvider>
          <AppShell />
        </SessionProvider>
      </ThemeProvider>
    </LanguageProvider>
  </StrictMode>
);
