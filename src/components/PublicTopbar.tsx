import { Brand } from './Brand';
import { LanguageSwitcher } from './LanguageSwitcher';
import { navigate } from '../router';

/** Top bar for landing / login / request-access (no session yet). */
export function PublicTopbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <Brand onClick={() => navigate('/')} />
      <nav />
      <div className="top-actions">
        <div className="top-actions">
  <LanguageSwitcher />
  {right}
</div>
        {right}
      </div>
    </header>
  );
}
