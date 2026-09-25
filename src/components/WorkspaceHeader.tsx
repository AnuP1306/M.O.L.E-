import { LogOut } from 'lucide-react';
import { ROLE_LABELS } from '../data/prototype';
import { navigate } from '../router';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useSession } from '../state/SessionContext';
import { Brand } from './Brand';
import { useTranslation } from 'react-i18next';
import { MineSelector } from './MineSelector';

/** Top bar for the Site Manager / Dispatcher workspaces. */
export function WorkspaceHeader() {
  const { user, logout } = useSession();
  const { t } = useTranslation();
  if (!user) return null;
  return (
    <header className="topbar">
      <Brand />
      <nav />
      <div className="top-actions">
        <MineSelector />
        <div className="top-actions">
  <MineSelector />
  <LanguageSwitcher />
  {/* neeche ka existing code waise hi rehne do */}
</div>
        <div className="operator-chip">
          <span>{ROLE_LABELS[user.role]}</span>
          <b>{user.name}</b>
        </div>
        <button className="icon-btn theme-btn" onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={14} />
          <span>{t('actions.logout').toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
}
