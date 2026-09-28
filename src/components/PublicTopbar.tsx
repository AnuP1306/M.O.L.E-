import { Brand } from './Brand';
import { LanguageSwitcher } from './LanguageSwitcher';
import { navigate } from '../router';

export function PublicTopbar({ right }: { right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <Brand onClick={() => navigate('/')} />
      <nav />
      <div className="top-actions">
        <LanguageSwitcher />
        {right}
      </div>
    </header>
  );
}