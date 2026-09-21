import { Brand } from './Brand';
import { navigate } from '../router';

/** Top bar for landing / login / request-access (no session yet). */
export function PublicTopbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <Brand onClick={() => navigate('/')} />
      <nav />
      <div className="top-actions">
        {right}
      </div>
    </header>
  );
}
