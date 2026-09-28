import { Building2, Cpu, Map as MapIcon, Pencil, Users, Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

export function SiteManagerDashboard() {
  const { t } = useTranslation();
  const { selectedMine, mineSetups } = useSession();
  const setup = selectedMine ? mineSetups[selectedMine.id] : undefined;

  if (!selectedMine || !setup) return null;

  // Keep stored values unchanged; translate known options only for display.
  const displayOption = (value: string) =>
    t(`setupOptions.${value}`, { defaultValue: value });

  return (
    <div className="app shell">
      <WorkspaceHeader />
      <main className="shell-main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">{t('landing.roles.SITE_MANAGER.label')}</div>
            <h1>{t('siteDashboard.title')}</h1>
          </div>
          <button className="btn small" onClick={() => navigate('/site-manager/setup')}>
            <Pencil size={13} /> {t('siteDashboard.editSetup')}
          </button>
        </div>

        <div className="workspace-grid three">
          <section className="panel">
            <div className="panel-title"><span><Building2 size={13} /></span><b>{t('siteDashboard.mine')}</b><i /></div>
            <div className="kv"><span>{t('siteDashboard.name')}</span><b>{selectedMine.name}</b></div>
            <div className="kv"><span>{t('siteDashboard.mineCode')}</span><b>{selectedMine.officialMineCode}</b></div>
            <div className="kv"><span>{t('siteDashboard.district')}</span><b>{selectedMine.district}{selectedMine.state ? `, ${selectedMine.state}` : ''}</b></div>
            <div className="kv"><span>{t('siteDashboard.status')}</span><b>{displayOption(selectedMine.status)}</b></div>
          </section>

          <section className="panel">
            <div className="panel-title"><span><Gauge size={13} /></span><b>{t('siteDashboard.operations')}</b><i /></div>
            <div className="kv"><span>{t('siteDashboard.workingMethod')}</span><b>{displayOption(setup.workingMethod)}</b></div>
            <div className="kv"><span>{t('siteDashboard.gassiness')}</span><b>{displayOption(setup.gassiness)}</b></div>
            <div className="kv"><span>{t('siteDashboard.levels')}</span><b>{setup.levels}</b></div>
            <div className="kv"><span>{t('siteDashboard.maxDepth')}</span><b>{setup.maxDepth} {t('siteDashboard.metres')}</b></div>
            <div className="kv"><span>{t('siteDashboard.workersPerShift')}</span><b>{setup.workforcePerShift}</b></div>
            <div className="kv"><span>{t('siteDashboard.shiftsPerDay')}</span><b>{setup.shiftsPerDay}</b></div>
          </section>

          <section className="panel">
            <div className="panel-title"><span><MapIcon size={13} /></span><b>{t('siteDashboard.mineMap')}</b><i /></div>
            <div className="kv">
              <span>{t('siteDashboard.source')}</span>
              <b>{t(setup.mapMethod === 'UPLOAD' ? 'siteDashboard.uploadedMap' : 'siteDashboard.slamMapping')}</b>
            </div>
            {setup.mapMethod === 'UPLOAD'
              ? <div className="kv"><span>{t('siteDashboard.file')}</span><b>{setup.mapFileName}</b></div>
              : <div className="kv"><span>{t('siteDashboard.status')}</span><b>{t('siteDashboard.readyToStart')}</b></div>}
          </section>

          <section className="panel">
            <div className="panel-title"><span><Users size={13} /></span><b>{t('siteDashboard.team')}</b><i /></div>
            {setup.team.map((member, index) => (
              <div className="kv" key={index}>
                <span>{displayOption(member.designation).toUpperCase()}</span>
                <b>{member.name}<small className="kv-sub">{member.mobile}</small></b>
              </div>
            ))}
          </section>

          <section className="panel span-2">
            <div className="panel-title">
              <span><Cpu size={13} /></span>
              <b>{t('siteDashboard.roverFleet', { count: setup.rovers.length })}</b>
              <i />
            </div>
            {setup.rovers.map((rover) => (
              <div className="kv" key={rover.roverId}>
                <span>{rover.roverId}<small className="kv-sub">{rover.serial}</small></span>
                <b>{rover.payloads.map(displayOption).join(' · ')}</b>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}