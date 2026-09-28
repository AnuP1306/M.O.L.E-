import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useSession } from '../state/SessionContext';

export function NoActiveRescue() {
  const { t } = useTranslation();
  const { user, selectedMine } = useSession();

  if (!user || !selectedMine) return null;

  return (
    <div className="app shell">
      <WorkspaceHeader />
      <main className="shell-main">
        <section className="panel idle-panel">
          <div className="idle-icon"><ShieldCheck size={34} /></div>
          <div className="eyebrow">
            {t('rescueIdle.operator')} · {selectedMine.name.toUpperCase()}
          </div>
          <h1>{t('rescueIdle.title')}</h1>
          <p>{t('rescueIdle.description')}</p>
          <span className="badge safe">{t('rescueIdle.standby')}</span>
        </section>
      </main>
    </div>
  );
}