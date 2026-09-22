import { Crosshair, LifeBuoy, LogIn, Map as MapIcon, Radio, UserPlus, Users, Wind } from 'lucide-react';
import { PublicTopbar } from '../components/PublicTopbar';
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLE_OPTIONS } from '../data/prototype';
import { navigate } from '../router';

const capabilities = [
  { icon: <MapIcon size={18} />, title: 'UNDERGROUND MINE MAPPING', text: 'Keep an up-to-date layout of galleries, shafts and junctions.' },
  { icon: <Users size={18} />, title: 'DAILY WORKER DEPLOYMENT', text: 'Record which personnel are deployed to which underground areas each shift.' },
  { icon: <Wind size={18} />, title: 'ENVIRONMENTAL MONITORING', text: 'Watch methane, CO, oxygen, temperature and water-ingress readings.' },
  { icon: <Radio size={18} />, title: 'REMOTE ROVER OPERATIONS', text: 'Drive the rescue rover from the surface with camera, LiDAR and drill controls.' },
  { icon: <Crosshair size={18} />, title: 'SURVIVOR DETECTION', text: 'Flag possible survivors from thermal and vital-sign cues.' },
  { icon: <LifeBuoy size={18} />, title: 'EMERGENCY RESCUE COORDINATION', text: 'Coordinate hazards, rescue targets and missions during an incident.' },
];

export function Landing() {
  return (
    <div className="app shell">
      <PublicTopbar right={<button className="btn small" onClick={() => navigate('/login')}><LogIn size={13} /> OFFICIAL LOGIN</button>} />

      <main className="shell-main landing">
        <div className="landing-grid-bg" aria-hidden />

        <section className="hero">
          <div className="eyebrow">AI-POWERED UNDERGROUND COAL MINE SAFETY & RESCUE</div>
          <h1 className="hero-title">M.O.L.E.</h1>
          <div className="hero-sub">MINE OPERATIONS & LIFE-SAVING EXPLORER</div>
          <p className="hero-lead">
            An operations system for underground coal mines. M.O.L.E. brings mine mapping, daily
            worker deployment, environmental monitoring, remote rover operations, survivor detection
            and emergency rescue coordination into a single control-room console.
          </p>
          <div className="hero-actions">
            <button className="btn primary big" onClick={() => navigate('/login')}><LogIn size={15} /> OFFICIAL LOGIN</button>
            <button className="btn ghost big" onClick={() => navigate('/request-access')}><UserPlus size={15} /> REQUEST OFFICIAL ACCESS</button>
          </div>
        </section>

        <section className="panel capability-panel">
          <div className="panel-title"><span><Radio size={13} /></span><b>System capabilities</b><i /></div>
          <div className="capability-grid">
            {capabilities.map((c, index) => (
              <div className="capability" key={c.title}>
                <div className="capability-icon">{c.icon}</div>
                <div>
                  <small>CAP-{String(index + 1).padStart(2, '0')}</small>
                  <b>{c.title}</b>
                  <p>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="role-strip">
          <div className="role-strip-title">ACCESS IS ISSUED BY ROLE</div>
          {ROLE_OPTIONS.map((role) => (
            <div className="role-card" key={role}>
              <b>{ROLE_LABELS[role]}</b>
              <span>{ROLE_DESCRIPTIONS[role]}</span>
            </div>
          ))}
        </section>
      </main>

      <footer className="shell-footer">
        <span>M.O.L.E.</span>
        <span>UNDERGROUND COAL MINE SAFETY & RESCUE</span>
      </footer>
    </div>
  );
}
