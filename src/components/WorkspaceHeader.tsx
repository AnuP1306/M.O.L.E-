import { LogOut } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import { Brand } from './Brand';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MineSelector } from './MineSelector';

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

        <LanguageSwitcher />

        <div className="operator-chip">
          <span>{t(`landing.roles.${user.role}.label`)}</span>
          <b>{user.name}</b>
        </div>

        <button
          className="icon-btn theme-btn"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut size={14} />
          <span>{t('actions.logout').toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
}