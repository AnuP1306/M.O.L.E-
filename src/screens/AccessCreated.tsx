import { useState } from 'react';
import { CheckCircle2, Copy, Check, Home, LogIn } from 'lucide-react';
import { PublicTopbar } from '../components/PublicTopbar';
import { ROLE_LABELS } from '../data/prototype';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

function CredentialBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ }
  };
  return (
    <div className="cred-block">
      <span>{label}</span>
      <div>
        <b>{value}</b>
        <button type="button" className="cred-copy" onClick={copy} title={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  );
}

export function AccessCreated() {
  const { createdCredentials, clearCreatedCredentials } = useSession();
  if (!createdCredentials) return null;
  const c = createdCredentials;
  const leave = (path: '/login' | '/') => { clearCreatedCredentials(); navigate(path); };

  return (
    <div className="app shell">
      <PublicTopbar />
      <main className="shell-main form-page">
        <section className="panel submitted-panel cred-panel">
          <div className="submitted-head">
            <CheckCircle2 size={30} />
            <div>
              <div className="eyebrow">OFFICIAL ACCESS</div>
              <h1>ACCOUNT CREATED</h1>
            </div>
            <span className="badge safe">ACTIVE</span>
          </div>

          <div className="cred-officer">
            <span>{c.name}</span>
            <span>{ROLE_LABELS[c.role]}</span>
            <span>{c.mineName}</span>
          </div>

          <div className="cred-grid">
            <CredentialBlock label="LOGIN ID" value={c.loginId} />
            <CredentialBlock label="TEMPORARY PASSWORD" value={c.password} />
          </div>

          <div className="form-note">Keep these credentials safe. You will need them to sign in.</div>

          <div className="form-actions">
            <button className="btn ghost big" onClick={() => leave('/')}><Home size={15} /> RETURN TO HOME</button>
            <button className="btn primary big" onClick={() => leave('/login')}><LogIn size={15} /> LOGIN NOW</button>
          </div>
        </section>
      </main>
    </div>
  );
}
