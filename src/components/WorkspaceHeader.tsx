import { LogOut, Moon, Sun } from 'lucide-react';
import { ROLE_LABELS } from '../data/prototype';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import { Brand } from './Brand';
import { MineSelector } from './MineSelector';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useTheme } from '../theme';

/** Top bar for the Site Manager / Dispatcher workspaces. */
export function WorkspaceHeader() {
  const { user, logout } = useSession();
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  if (!user) return null;
  return (
    <header className="topbar">
      <Brand />
      <nav />
      <div className="top-actions">
        <MineSelector />
        <LanguageSwitcher />
        <div className="operator-chip">
          <span>{ROLE_LABELS[user.role]}</span>
          <b>{user.name}</b>
        </div>
        <button
          className="icon-btn theme-btn"
          onClick={toggleTheme}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          <span>{dark ? 'LIGHT' : 'DARK'}</span>
        </button>
        <button
          className="icon-btn theme-btn"
          onClick={() => { logout(); navigate('/'); }}
          title="Logout"
        >
          <LogOut size={14} />
          <span>LOGOUT</span>
        </button>
      </div>
    </header>
  );
}
