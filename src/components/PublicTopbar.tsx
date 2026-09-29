import { Brand } from './Brand';
import { navigate } from '../router';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../theme';

/** Top bar for landing / login / request-access (no session yet). */
export function PublicTopbar({ right }: { right?: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <header className="topbar">
      <Brand onClick={() => navigate('/')} />
      <nav />
      <div className="top-actions">
        <LanguageSwitcher />
        <button className="icon-btn theme-btn" onClick={toggleTheme} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          <span>{dark ? 'LIGHT' : 'DARK'}</span>
        </button>
        {right}
      </div>
    </header>
  );
}
