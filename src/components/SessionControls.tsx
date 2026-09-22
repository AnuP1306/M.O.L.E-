import { LogOut } from 'lucide-react';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import { MineSelector } from './MineSelector';

/** Compact mine selector + logout, placed inside the existing dashboard top bar. */
export function SessionControls() {
  const { user, logout } = useSession();
  const onLogout = () => { logout(); navigate('/'); };
  return (
    <div className="session-controls">
      <MineSelector compact />
      <button className="icon-btn theme-btn" onClick={onLogout} title={`Sign out ${user?.name ?? ''}`}>
        <LogOut size={14} />
        <span>LOGOUT</span>
      </button>
    </div>
  );
}
