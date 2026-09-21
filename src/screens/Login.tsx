import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, KeyRound, LogIn, UserPlus } from 'lucide-react';
import { PublicTopbar } from '../components/PublicTopbar';
import { ROLE_HOME } from '../data/prototype';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

export function Login() {
  const { login, clearCreatedCredentials } = useSession();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password) { setError('ENTER YOUR OFFICER / EMPLOYEE ID AND PASSWORD'); return; }
    const result = login(loginId, password, remember);
    if (!result.ok) { setError(result.error); return; }
    clearCreatedCredentials();
    navigate(ROLE_HOME[result.user.role]);
  };

  return (
    <div className="app shell">
      <PublicTopbar right={<button className="btn small" onClick={() => navigate('/')}><ArrowLeft size={13} /> HOME</button>} />

      <main className="shell-main login-layout">
        <section className="panel login-panel">
          <div className="panel-title"><span><KeyRound size={13} /></span><b>Official login</b><i /></div>
          <form onSubmit={submit} noValidate>
            <label className="field">
              <span className="field-label">OFFICER / EMPLOYEE ID</span>
              <input value={loginId} onChange={(e) => { setLoginId(e.target.value); setError(''); }} autoComplete="username" autoFocus placeholder="Enter your ID" />
            </label>

            <label className="field">
              <span className="field-label">PASSWORD</span>
              <span className="password-wrap">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} autoComplete="current-password" placeholder="Enter your password" />
                <button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)} title={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </span>
            </label>

            <div className="remember-row">
              <span>REMEMBER DEVICE</span>
              <button type="button" className={`toggle ${remember ? 'on' : ''}`} onClick={() => setRemember((v) => !v)} role="switch" aria-checked={remember} aria-label="Remember device"><i /></button>
            </div>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button type="submit" className="btn primary big full"><LogIn size={15} /> LOGIN</button>

            <div className="link-row">
              <button type="button" className="link-btn" onClick={() => navigate('/request-access')}><UserPlus size={12} /> REQUEST OFFICIAL ACCESS</button>
              <button type="button" className="link-btn" onClick={() => setForgotOpen((v) => !v)}>FORGOT PASSWORD</button>
            </div>

            {forgotOpen && (
              <div className="form-info">To reset your password, contact your system administrator.</div>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
