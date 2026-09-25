import { Crosshair, LifeBuoy, LogIn, Map as MapIcon, Radio, UserPlus, Users, Wind } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PublicTopbar } from '../components/PublicTopbar';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_OPTIONS } from '../data/prototype';
import { navigate } from '../router';

const capabilities = [
  { icon: <MapIcon size={18} />, key: 'mapping' },
  { icon: <Users size={18} />, key: 'workers' },
  { icon: <Wind size={18} />, key: 'environment' },
  { icon: <Radio size={18} />, key: 'rover' },
  { icon: <Crosshair size={18} />, key: 'survivors' },
  { icon: <LifeBuoy size={18} />, key: 'rescue' },
] as const;

export function Landing() {
  const { t } = useTranslation();

  return (
    <div className="app shell">
      <PublicTopbar
        right={
          <button className="btn small" onClick={() => navigate('/login')}>
            <LogIn size={13} /> {t('landing.officialLogin')}
          </button>
        }
      />

      <main className="shell-main landing">
        <div className="landing-grid-bg" aria-hidden />

        <section className="hero">
          <div className="eyebrow">{t('landing.eyebrow')}</div>
          <h1 className="hero-title">M.O.L.E.</h1>
          <div className="hero-sub">{t('landing.subtitle')}</div>
          <p className="hero-lead">{t('landing.description')}</p>

          <div className="hero-actions">
            <button className="btn primary big" onClick={() => navigate('/login')}>
              <LogIn size={15} /> {t('landing.officialLogin')}
            </button>
            <button className="btn ghost big" onClick={() => navigate('/request-access')}>
              <UserPlus size={15} /> {t('landing.requestAccess')}
            </button>
          </div>
        </section>

        <section className="panel capability-panel">
          <div className="panel-title">
            <span><Radio size={13} /></span>
            <b>{t('landing.capabilitiesHeading')}</b>
            <i />
          </div>

          <div className="capability-grid">
            {capabilities.map((capability, index) => (
              <div className="capability" key={capability.key}>
                <div className="capability-icon">{capability.icon}</div>
                <div>
                  <small>CAP-{String(index + 1).padStart(2, '0')}</small>
                  <b>{t(`landing.capabilities.${capability.key}.title`)}</b>
                  <p>{t(`landing.capabilities.${capability.key}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="role-strip">
          <div className="role-strip-title">{t('landing.rolesHeading')}</div>
          {ROLE_OPTIONS.map((role) => (
            <div className="role-card" key={role}>
              <b>{t(`landing.roles.${role}.label`)}</b>
<span>{t(`landing.roles.${role}.description`)}</span>
            </div>
          ))}
        </section>
      </main>

      <footer className="shell-footer">
        <span>M.O.L.E.</span>
        <span>{t('landing.footer')}</span>
      </footer>
    </div>
  );
}