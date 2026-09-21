import { useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Plus, Send, X } from 'lucide-react';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { useSession } from '../state/SessionContext';
import type { WorkerAssignment } from '../types';

const SHIFTS = ['Shift A · 06:00–14:00', 'Shift B · 14:00–22:00', 'Shift C · 22:00–06:00'];
const TRADES = ['Miner / Loader', 'Driller', 'Electrician', 'Mechanic', 'Overman', 'Sirdar', 'Timberman', 'Surveyor', 'Other'];

const blankWorker = (): WorkerAssignment => ({ name: '', workerId: '', trade: TRADES[0], area: '' });
const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

type Errors = Record<string, string>;

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}{required && <i> *</i>}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function DispatcherDeployment() {
  const { selectedMine, deployments, saveDeployment } = useSession();
  const [date, setDate] = useState(today());
  const [shift, setShift] = useState(SHIFTS[0]);
  const [incharge, setIncharge] = useState('');
  const [workers, setWorkers] = useState<WorkerAssignment[]>([blankWorker(), blankWorker(), blankWorker()]);
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState('');
  if (!selectedMine) return null;

  const recent = deployments.filter((d) => d.mineId === selectedMine.id).slice(0, 6);
  const clear = (key: string) => setErrors((e) => { if (!e[key]) return e; const next = { ...e }; delete next[key]; return next; });
  const updateWorker = (i: number, patch: Partial<WorkerAssignment>, key: string) => {
    setWorkers((list) => list.map((w, idx) => (idx === i ? { ...w, ...patch } : w))); clear(key); setNotice('');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (!date) found.date = 'Select the deployment date';
    if (!incharge.trim()) found.incharge = 'Shift in-charge is required';
    // rows left completely empty are ignored; partially filled rows must be complete
    const filled = workers.map((w, i) => ({ w, i })).filter(({ w }) => w.name.trim() || w.workerId.trim() || w.area.trim());
    if (!filled.length) found.workers = 'Add at least one worker to the deployment';
    filled.forEach(({ w, i }) => {
      if (!w.name.trim()) found[`w.${i}.name`] = 'Required';
      if (!w.workerId.trim()) found[`w.${i}.id`] = 'Required';
      if (!w.area.trim()) found[`w.${i}.area`] = 'Required';
    });
    setErrors(found);
    if (Object.keys(found).length) { document.querySelector('.has-error, .form-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }

    const result = saveDeployment({
      date, shift, shiftIncharge: incharge.trim(), remarks: remarks.trim(),
      workers: filled.map(({ w }) => ({ name: w.name.trim(), workerId: w.workerId.trim(), trade: w.trade, area: w.area.trim() })),
    });
    if (!result) return;
    setNotice(`${result.updated ? 'DEPLOYMENT UPDATED' : 'DEPLOYMENT RECORDED'} · ${result.deployment.workers.length} WORKERS · ${shift.split(' · ')[0].toUpperCase()}`);
    setWorkers([blankWorker(), blankWorker(), blankWorker()]);
    setRemarks('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app shell">
      <WorkspaceHeader />
      <main className="shell-main form-page wide">
        <div className="page-heading">
          <div>
            <div className="eyebrow">DISPATCHER · {selectedMine.name.toUpperCase()}</div>
            <h1>DAILY UNDERGROUND WORKER DEPLOYMENT</h1>
          </div>
        </div>

        {notice && <div className="form-success" role="status"><CheckCircle2 size={16} /> {notice}</div>}

        <form className="access-form" onSubmit={submit} noValidate>
          <section className="panel">
            <div className="panel-title"><span>01</span><b>Shift details</b><i /></div>
            <div className="form-grid">
              <Field label="DEPLOYMENT DATE" required error={errors.date}><input type="date" value={date} onChange={(e) => { setDate(e.target.value); clear('date'); setNotice(''); }} /></Field>
              <Field label="SHIFT" required>
                <select value={shift} onChange={(e) => { setShift(e.target.value); setNotice(''); }}>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="SHIFT IN-CHARGE" required error={errors.incharge}><input value={incharge} onChange={(e) => { setIncharge(e.target.value); clear('incharge'); }} /></Field>
              <Field label="MINE"><input value={selectedMine.name} readOnly /></Field>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title"><span>02</span><b>Underground personnel · {workers.filter((w) => w.name.trim()).length}</b><i /></div>
            {errors.workers && <div className="form-error">{errors.workers}</div>}
            <div className="roster">
              <div className="roster-head"><span>WORKER NAME</span><span>WORKER ID</span><span>TRADE</span><span>ASSIGNED UNDERGROUND AREA</span><span /></div>
              {workers.map((w, i) => (
                <div className="roster-row" key={i}>
                  <label className={errors[`w.${i}.name`] ? 'has-error' : ''}><input aria-label="Worker name" placeholder="Name" value={w.name} onChange={(e) => updateWorker(i, { name: e.target.value }, `w.${i}.name`)} /></label>
                  <label className={errors[`w.${i}.id`] ? 'has-error' : ''}><input aria-label="Worker ID" placeholder="ID" value={w.workerId} onChange={(e) => updateWorker(i, { workerId: e.target.value }, `w.${i}.id`)} /></label>
                  <label><select aria-label="Trade" value={w.trade} onChange={(e) => updateWorker(i, { trade: e.target.value }, `w.${i}.trade`)}>{TRADES.map((t) => <option key={t}>{t}</option>)}</select></label>
                  <label className={errors[`w.${i}.area`] ? 'has-error' : ''}><input aria-label="Assigned area" placeholder="Gallery / panel / district" value={w.area} onChange={(e) => updateWorker(i, { area: e.target.value }, `w.${i}.area`)} /></label>
                  <button type="button" className="row-remove" onClick={() => setWorkers((list) => list.length > 1 ? list.filter((_, idx) => idx !== i) : list)} aria-label="Remove worker" disabled={workers.length <= 1}><X size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" className="btn small" onClick={() => setWorkers((list) => [...list, blankWorker()])}><Plus size={13} /> ADD WORKER</button>
          </section>

          <section className="panel">
            <div className="panel-title"><span>03</span><b>Remarks (optional)</b><i /></div>
            <label className="field">
              <textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Special instructions, restricted areas, equipment issued…" />
            </label>
          </section>

          <div className="form-actions">
            <button type="submit" className="btn primary big"><Send size={15} /> CONFIRM DEPLOYMENT</button>
          </div>
        </form>

        {recent.length > 0 && (
          <section className="panel recent-panel">
            <div className="panel-title"><span>LOG</span><b>Recent deployments</b><i /></div>
            {recent.map((d) => (
              <div className="kv" key={d.id}>
                <span>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · {d.shift.split(' · ')[0].toUpperCase()}</span>
                <b>{d.workers.length} workers<small className="kv-sub">In-charge: {d.shiftIncharge}</small></b>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
