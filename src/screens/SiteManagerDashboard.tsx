import { Building2, Cpu, Map as MapIcon, Pencil, Users, Gauge, Radar, Upload, FileText } from 'lucide-react';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';
import { useRef } from 'react';

/** Mine Operations landing for the Site Manager: shows the saved setup. */
export function SiteManagerDashboard() {
  const { selectedMine, mineSetups, saveMineSetup } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
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
            <div className="kv"><span>PANELS</span><b>{setup.panels}</b></div>
            <div className="kv"><span>GALLERIES</span><b>{setup.galleries}</b></div>
            <div className="kv"><span>WORKING AREAS</span><b>{setup.workingAreas}</b></div>
          </section>

          <section className="panel">
            <div className="panel-title"><span><MapIcon size={13} /></span><b>Mine map</b><i /></div>
            <div className="kv"><span>CURRENT SOURCE</span><b>{setup.mapMethod === 'UPLOAD' && setup.mapFileName ? 'UPLOADED MAP' : 'NOT MAPPED'}</b></div>
            {setup.mapFileName && <div className="kv"><span>FILE</span><b><FileText size={13} /> {setup.mapFileName}</b></div>}
            <input ref={fileRef} type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                saveMineSetup({ ...setup, mapMethod: 'UPLOAD', mapFileName: file.name });
                e.currentTarget.value = '';
              }} />
            <div className="page-heading-actions" style={{ marginTop: 12 }}>
              <button className="btn small" type="button" onClick={() => fileRef.current?.click()}><Upload size={13} /> UPLOAD EXISTING MINE MAP</button>
              <button className="btn small primary" type="button" onClick={() => navigate('/site-manager/slam')}><Radar size={13} /> START SLAM MAPPING</button>
            </div>
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
