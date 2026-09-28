import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import { MineSelector } from './MineSelector';

export function SessionControls() {
  const { t } = useTranslation();
  const { user, logout } = useSession();

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="session-controls">
      <MineSelector compact />
      <button
        className="icon-btn theme-btn"
        onClick={onLogout}
        title={t('session.signOut', { name: user?.name ?? '' })}
      >
        <LogOut size={14} />
        <span>{t('actions.logout').toUpperCase()}</span>
      </button>
    </div>
  );
}