import { Building2, Cpu, Map as MapIcon, Pencil, Users, Gauge } from 'lucide-react';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

/** Mine Operations landing for the Site Manager: shows the saved setup. */
export function SiteManagerDashboard() {
  const { selectedMine, mineSetups } = useSession();
  const setup = selectedMine ? mineSetups[selectedMine.id] : undefined;
  if (!selectedMine || !setup) return null;

  return (
    <div className="app shell">
      <WorkspaceHeader />
      <main className="shell-main">
        <div className="page-heading">
          <div>
            <div className="eyebrow">SITE MANAGER</div>
            <h1>MINE OPERATIONS</h1>
          </div>
          <button className="btn small" onClick={() => navigate('/site-manager/setup')}><Pencil size={13} /> EDIT SETUP</button>
        </div>

        <div className="workspace-grid three">
          <section className="panel">
            <div className="panel-title"><span><Building2 size={13} /></span><b>Mine</b><i /></div>
            <div className="kv"><span>NAME</span><b>{selectedMine.name}</b></div>
            <div className="kv"><span>MINE CODE</span><b>{selectedMine.officialMineCode}</b></div>
            <div className="kv"><span>DISTRICT</span><b>{selectedMine.district}{selectedMine.state ? `, ${selectedMine.state}` : ''}</b></div>
            <div className="kv"><span>STATUS</span><b>{selectedMine.status}</b></div>
          </section>

          <section className="panel">
            <div className="panel-title"><span><Gauge size={13} /></span><b>Operations</b><i /></div>
            <div className="kv"><span>WORKING METHOD</span><b>{setup.workingMethod}</b></div>
            <div className="kv"><span>GASSINESS</span><b>{setup.gassiness}</b></div>
            <div className="kv"><span>LEVELS / SEAMS</span><b>{setup.levels}</b></div>
            <div className="kv"><span>MAX DEPTH</span><b>{setup.maxDepth} m</b></div>
            <div className="kv"><span>WORKERS / SHIFT</span><b>{setup.workforcePerShift}</b></div>
            <div className="kv"><span>SHIFTS / DAY</span><b>{setup.shiftsPerDay}</b></div>
          </section>

          <section className="panel">
            <div className="panel-title"><span><MapIcon size={13} /></span><b>Mine map</b><i /></div>
            <div className="kv"><span>SOURCE</span><b>{setup.mapMethod === 'UPLOAD' ? 'UPLOADED MAP' : 'SLAM MAPPING'}</b></div>
            {setup.mapMethod === 'UPLOAD'
              ? <div className="kv"><span>FILE</span><b>{setup.mapFileName}</b></div>
              : <div className="kv"><span>STATUS</span><b>READY TO START</b></div>}
          </section>

          <section className="panel">
            <div className="panel-title"><span><Users size={13} /></span><b>Team</b><i /></div>
            {setup.team.map((m, i) => (
              <div className="kv" key={i}><span>{m.designation.toUpperCase()}</span><b>{m.name}<small className="kv-sub">{m.mobile}</small></b></div>
            ))}
          </section>

          <section className="panel span-2">
            <div className="panel-title"><span><Cpu size={13} /></span><b>Rover fleet · {setup.rovers.length}</b><i /></div>
            {setup.rovers.map((r) => (
              <div className="kv" key={r.roverId}><span>{r.roverId}<small className="kv-sub">{r.serial}</small></span><b>{r.payloads.join(' · ')}</b></div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
