import { useState } from 'react';

import {
  CheckCircle2,
  Copy,
  Check,
  Home,
  LogIn,
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { PublicTopbar } from '../components/PublicTopbar';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

function CredentialBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <div className="cred-block">
      <span>{label}</span>

      <div>
        <b>{value}</b>

        <button
          type="button"
          className="cred-copy"
          onClick={copy}
          title={t('accessCreated.copy', { label })}
          aria-label={t('accessCreated.copy', { label })}
        >
          {copied ? (
            <Check size={14} />
          ) : (
            <Copy size={14} />
          )}
        </button>
      </div>
    </div>
  );
}

export function AccessCreated() {
  const { t } = useTranslation();

  const {
    createdCredentials,
    clearCreatedCredentials,
  } = useSession();

  if (!createdCredentials) return null;

  const c = createdCredentials;

  const leave = (path: '/login' | '/') => {
    clearCreatedCredentials();
    navigate(path);
  };

  return (
    <div className="app shell">
      <PublicTopbar />

      <main className="shell-main form-page">
        <section className="panel submitted-panel cred-panel">
          <div className="submitted-head">
            <CheckCircle2 size={30} />

            <div>
              <div className="eyebrow">
                {t('accessCreated.officialAccess')}
              </div>

              <h1>{t('accessCreated.title')}</h1>
            </div>

            <span className="badge safe">
              {t('accessCreated.active')}
            </span>
          </div>

          <div className="cred-officer">
            <span>{c.name}</span>

            <span>
              {t(`landing.roles.${c.role}.label`)}
            </span>

            <span>{c.mineName}</span>
          </div>

          <div className="cred-grid">
            <CredentialBlock
              label={t('accessCreated.loginId')}
              value={c.loginId}
            />

            <CredentialBlock
              label={t('accessCreated.tempPassword')}
              value={c.password}
            />
          </div>

          <div className="form-note">
            {t('accessCreated.keepSafe')}
          </div>

          <div className="form-actions">
            <button
              className="btn ghost big"
              onClick={() => leave('/')}
            >
              <Home size={15} />
              {t('accessCreated.home')}
            </button>

            <button
              className="btn primary big"
              onClick={() => leave('/login')}
            >
              <LogIn size={15} />
              {t('accessCreated.loginNow')}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}