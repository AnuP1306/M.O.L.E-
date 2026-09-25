import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PublicTopbar } from '../components/PublicTopbar';
import { ROLE_HOME } from '../data/prototype';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

export function Login() {
  const { t } = useTranslation();
  const { login, clearCreatedCredentials } = useSession();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();

    if (!loginId.trim() || !password) {
      setError('login.missingCredentials');
      return;
    }

    const result = login(loginId, password, remember);

    if (!result.ok) {
      setError(
  result.error === 'AUTHENTICATION FAILED · CHECK ID AND PASSWORD'
    ? 'login.invalidCredentials'
    : result.error
);
      return;
    }

    clearCreatedCredentials();
    navigate(ROLE_HOME[result.user.role]);
  };

  return (
    <div className="app shell">
      <PublicTopbar
        right={
          <button className="btn small" onClick={() => navigate('/')}>
            <ArrowLeft size={13} /> {t('login.home')}
          </button>
        }
      />

      <main className="shell-main login-layout">
        <section className="panel login-panel">
          <div className="panel-title">
            <span><KeyRound size={13} /></span>
            <b>{t('login.title')}</b>
            <i />
          </div>

          <form onSubmit={submit} noValidate>
            <label className="field">
              <span className="field-label">{t('login.officerId')}</span>
              <input
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  setError('');
                }}
                autoComplete="username"
                autoFocus
                placeholder={t('login.idPlaceholder')}
              />
            </label>

            <label className="field">
              <span className="field-label">{t('login.password')}</span>
              <span className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  autoComplete="current-password"
                  placeholder={t('login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            <div className="remember-row">
              <span>{t('login.rememberDevice')}</span>
              <button
                type="button"
                className={`toggle ${remember ? 'on' : ''}`}
                onClick={() => setRemember((v) => !v)}
                role="switch"
                aria-checked={remember}
                aria-label={t('login.rememberDevice')}
              >
                <i />
              </button>
            </div>

            {error && (
  <div className="form-error" role="alert">
    {error.startsWith('login.') ? t(error) : error}
  </div>
)}

            <button type="submit" className="btn primary big full">
              <LogIn size={15} /> {t('login.submit')}
            </button>

            <div className="link-row">
              <button
                type="button"
                className="link-btn"
                onClick={() => navigate('/request-access')}
              >
                <UserPlus size={12} /> {t('login.requestAccess')}
              </button>

              <button
                type="button"
                className="link-btn"
                onClick={() => setForgotOpen((v) => !v)}
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            {forgotOpen && (
              <div className="form-info">{t('login.resetHelp')}</div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}