import { useState } from 'react';
import { BatteryCharging, Camera, CheckCircle2, Radio, Radar, Signal, ShieldCheck, ArrowLeft } from 'lucide-react';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { navigate } from '../router';
import { useSession } from '../state/SessionContext';

export function SlamPreparation() {
  const { selectedMine, mineSetups } = useSession();
  const setup = selectedMine ? mineSetups[selectedMine.id] : undefined;
  const [placed, setPlaced] = useState(false);
  const [verified, setVerified] = useState(false);

  if (!selectedMine || !setup) return null;
  const rover = setup.rovers[0];

  const checks = [
    { label: 'BATTERY', value: '94%', icon: <BatteryCharging size={14} /> },
    { label: 'CAMERA', value: 'READY', icon: <Camera size={14} /> },
    { label: 'SIGNAL / COMMUNICATION', value: '98%', icon: <Signal size={14} /> },
    { label: 'LiDAR', value: 'READY', icon: <Radar size={14} /> },
    { label: 'IMU / SENSORS', value: 'READY', icon: <Radio size={14} /> },
  ];

  return (
    <div className="app shell">
      <WorkspaceHeader />
      <main className="shell-main form-page wide">
        <div className="page-heading">
          <div>
            <div className="eyebrow">SITE MANAGER · {selectedMine.name.toUpperCase()}</div>
            <h1>START SLAM MAPPING</h1>
          </div>
        </div>

        <section className="panel">
          <div className="panel-title"><span>01</span><b>Rover placement</b><i /></div>
          <div className="kv"><span>ROVER</span><b>{rover?.roverId ?? 'MOLE-01'}</b></div>
          <div className="kv"><span>STARTING LOCATION</span><b>MINE ENTRANCE / DESIGNATED ACCESS POINT</b></div>
          <button
            type="button"
            className={`btn ${placed ? 'success-btn' : 'primary'} big`}
            onClick={() => setPlaced(true)}
          >
            {placed ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
            {placed ? 'ROVER POSITION CONFIRMED' : 'CONFIRM ROVER IS AT MINE ENTRANCE'}
          </button>
        </section>

        <section className={`panel ${!placed ? 'panel-muted' : ''}`}>
          <div className="panel-title"><span>02</span><b>Rover telemetry verification</b><i /></div>
          <div className="stat-grid">
            {checks.map((check) => (
              <div className="stat" key={check.label}>
                <span>{check.label}</span>
                <b className="green">{check.icon} {check.value}</b>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={`btn ${verified ? 'success-btn' : 'primary'} big`}
            disabled={!placed}
            onClick={() => setVerified(true)}
            style={{ marginTop: 14 }}
          >
            {verified ? <CheckCircle2 size={15} /> : <ShieldCheck size={15} />}
            {verified ? 'TELEMETRY VERIFIED' : 'VERIFY ROVER TELEMETRY'}
          </button>
        </section>

        <section className={`panel ${!verified ? 'panel-muted' : ''}`}>
          <div className="panel-title"><span>03</span><b>Mapping authorization</b><i /></div>
          <p className="form-note" style={{ marginTop: 0 }}>
            The rover is ready to begin the mine mapping sequence from the designated starting point.
          </p>
          <div className="form-actions">
            <button type="button" className="btn ghost big" onClick={() => navigate('/site-manager')}>
              <ArrowLeft size={15} /> BACK
            </button>
            <button
              type="button"
              className="btn primary big"
              disabled={!verified}
              onClick={() => navigate('/site-manager/operations')}
            >
              <Radar size={15} /> START SLAM MAPPING
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
