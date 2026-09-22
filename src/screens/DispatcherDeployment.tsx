import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, LayoutGrid, MapPin, Pencil, Plus, Send, Sparkles, X } from 'lucide-react';
import { WorkspaceHeader } from '../components/WorkspaceHeader';
import { DEPLOYMENT_REMARK_SAMPLES, pick, randomInt, randomName } from '../data/autofill';
import { useSession } from '../state/SessionContext';
import type { Deployment, LocationAllocation, LocationType, MineSetup } from '../types';

const SHIFTS = ['Shift A · 06:00–14:00', 'Shift B · 14:00–22:00', 'Shift C · 22:00–06:00'];

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  PANEL: 'PANEL',
  GALLERY: 'GALLERY',
  WORKING_AREA: 'WORKING AREA',
};
const LOCATION_TYPES: LocationType[] = ['PANEL', 'GALLERY', 'WORKING_AREA'];

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in local time

let idSeed = 0;
const newLocationId = () => `loc-${Date.now().toString(36)}-${(idSeed++).toString(36)}`;

/** Seed the roster with the panels / galleries / working areas the Site Manager declared during setup. */
function buildDefaultLocations(setup?: MineSetup): LocationAllocation[] {
  if (!setup) return [];
  const rows: LocationAllocation[] = [];
  for (let i = 1; i <= setup.panels; i += 1) rows.push({ id: newLocationId(), name: `Panel ${i}`, type: 'PANEL', workers: 0 });
  for (let i = 1; i <= setup.galleries; i += 1) rows.push({ id: newLocationId(), name: `Gallery ${i}`, type: 'GALLERY', workers: 0 });
  for (let i = 1; i <= setup.workingAreas; i += 1) rows.push({ id: newLocationId(), name: `Working Area ${i}`, type: 'WORKING_AREA', workers: 0 });
  return rows;
}

const blankLocation = (type: LocationType, index: number): LocationAllocation =>
  ({ id: newLocationId(), name: `${LOCATION_TYPE_LABELS[type]} ${index}`, type, workers: 0 });

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
  const { selectedMine, mineSetups, deployments, saveDeployment } = useSession();
  const setup = selectedMine ? mineSetups[selectedMine.id] : undefined;

  const [phase, setPhase] = useState<'form' | 'confirm'>('form');
  const [viewing, setViewing] = useState<Deployment | null>(null);

  const [date, setDate] = useState(today());
  const [shift, setShift] = useState(SHIFTS[0]);
  const [incharge, setIncharge] = useState('');
  const [remarks, setRemarks] = useState('');
  const [locations, setLocations] = useState<LocationAllocation[]>(() => buildDefaultLocations(setup));
  const [errors, setErrors] = useState<Errors>({});
  const [notice, setNotice] = useState('');

  // When the date / shift picked matches an already-saved deployment for this mine, load it so the
  // dispatcher edits the real numbers instead of starting from a blank roster.
  useEffect(() => {
    if (!selectedMine) return;
    const existing = deployments.find((d) => d.mineId === selectedMine.id && d.date === date && d.shift === shift);
    if (existing) {
      setIncharge(existing.shiftIncharge);
      setRemarks(existing.remarks);
      setLocations(existing.allocations);
    } else {
      setIncharge('');
      setRemarks('');
      setLocations(buildDefaultLocations(setup));
    }
    setErrors({});
    setNotice('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMine?.id, date, shift]);

  if (!selectedMine) return null;

  const recent = deployments.filter((d) => d.mineId === selectedMine.id).slice(0, 6);
  const clear = (key: string) => setErrors((e) => { if (!e[key]) return e; const next = { ...e }; delete next[key]; return next; });

  const addLocation = (type: LocationType) => {
    const countOfType = locations.filter((l) => l.type === type).length;
    setLocations((list) => [...list, blankLocation(type, countOfType + 1)]);
  };
  const updateLocation = (id: string, patch: Partial<LocationAllocation>, key: string) => {
    setLocations((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l))); clear(key); setNotice('');
  };
  const removeLocation = (id: string) => setLocations((list) => list.filter((l) => l.id !== id));

  const autoFill = () => {
    setIncharge((v) => v || randomName());
    setRemarks((v) => v || pick(DEPLOYMENT_REMARK_SAMPLES));
    setLocations((list) => {
      const base = list.length ? list : buildDefaultLocations(setup);
      return base.map((l) => ({ ...l, workers: l.workers || randomInt(3, 18) }));
    });
    setErrors({});
  };

  const totalWorkers = (list: LocationAllocation[]) => list.reduce((sum, l) => sum + (Number(l.workers) || 0), 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const found: Errors = {};
    if (!date) found.date = 'Select the deployment date';
    if (!incharge.trim()) found.incharge = 'Shift in-charge is required';
    if (!locations.length) found.locations = 'Add at least one location';
    locations.forEach((l) => {
      if (!l.name.trim()) found[`loc.${l.id}.name`] = 'Required';
      if (!Number.isInteger(Number(l.workers)) || Number(l.workers) < 0) found[`loc.${l.id}.workers`] = 'Enter 0 or more';
    });
    if (!found.locations && totalWorkers(locations) <= 0) found.locations = 'Allocate at least one worker to a location';
    setErrors(found);
    if (Object.keys(found).length) { document.querySelector('.has-error, .form-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }

    const result = saveDeployment({
      date, shift, shiftIncharge: incharge.trim(), remarks: remarks.trim(),
      allocations: locations.map((l) => ({ ...l, name: l.name.trim(), workers: Number(l.workers) || 0 })),
    });
    if (!result) return;
    setNotice(`${result.updated ? 'DEPLOYMENT UPDATED' : 'DEPLOYMENT RECORDED'} · ${totalWorkers(result.deployment.allocations)} WORKERS`);
    setViewing(result.deployment);
    setPhase('confirm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const editAgain = () => {
    if (viewing) {
      setDate(viewing.date); setShift(viewing.shift); setIncharge(viewing.shiftIncharge);
      setRemarks(viewing.remarks); setLocations(viewing.allocations);
    }
    setPhase('form');
  };

  const viewRecent = (d: Deployment) => { setViewing(d); setPhase('confirm'); setNotice(''); };

  if (phase === 'confirm' && viewing) {
    return (
      <div className="app shell">
        <WorkspaceHeader />
        <main className="shell-main form-page wide">
          <div className="page-heading">
            <div>
              <div className="eyebrow">DISPATCHER · {selectedMine.name.toUpperCase()}</div>
              <h1>DEPLOYMENT CONFIRMED</h1>
            </div>
          </div>

          {notice && <div className="form-success" role="status"><CheckCircle2 size={16} /> {notice}</div>}

          <section className="panel">
            <div className="panel-title"><span>01</span><b>Shift details</b><i /></div>
            <div className="kv"><span>DATE</span><b>{new Date(viewing.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</b></div>
            <div className="kv"><span>SHIFT</span><b>{viewing.shift}</b></div>
            <div className="kv"><span>SHIFT IN-CHARGE</span><b>{viewing.shiftIncharge}</b></div>
            <div className="kv"><span>MINE</span><b>{selectedMine.name}</b></div>
            <div className="kv"><span>TOTAL WORKERS DEPLOYED</span><b>{totalWorkers(viewing.allocations)}</b></div>
          </section>

          <section className="panel">
            <div className="panel-title"><span><LayoutGrid size={13} /></span><b>Allocation · {viewing.allocations.length} locations</b><i /></div>
            {viewing.allocations.map((l) => (
              <div className="kv" key={l.id}><span>{LOCATION_TYPE_LABELS[l.type]}</span><b>{l.name}<small className="kv-sub">{l.workers} workers</small></b></div>
            ))}
          </section>

          {viewing.remarks && (
            <section className="panel">
              <div className="panel-title"><span>02</span><b>Remarks</b><i /></div>
              <p className="form-note" style={{ margin: 0 }}>{viewing.remarks}</p>
            </section>
          )}

          <div className="form-actions">
            <button type="button" className="btn ghost big" onClick={() => setPhase('form')}>BACK TO ROSTER</button>
            <button type="button" className="btn primary big" onClick={editAgain}><Pencil size={15} /> EDIT / UPDATE DEPLOYMENT</button>
          </div>

          {recent.length > 0 && (
            <section className="panel recent-panel">
              <div className="panel-title"><span>LOG</span><b>Recent deployments</b><i /></div>
              {recent.map((d) => (
                <button type="button" className="kv kv-clickable" key={d.id} onClick={() => viewRecent(d)}>
                  <span>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · {d.shift.split(' · ')[0].toUpperCase()}</span>
                  <b>{totalWorkers(d.allocations)} workers<small className="kv-sub">In-charge: {d.shiftIncharge}</small></b>
                </button>
              ))}
            </section>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app shell">
      <WorkspaceHeader />
      <main className="shell-main form-page wide">
        <div className="page-heading">
          <div>
            <div className="eyebrow">DISPATCHER · {selectedMine.name.toUpperCase()}</div>
            <h1>DAILY UNDERGROUND WORKER DEPLOYMENT</h1>
          </div>
          <div className="page-heading-actions">
            <button type="button" className="btn small" onClick={autoFill}><Sparkles size={13} /> AUTO-FILL</button>
          </div>
        </div>

        {notice && <div className="form-success" role="status"><CheckCircle2 size={16} /> {notice}</div>}

        <form className="access-form" onSubmit={submit} noValidate>
          <section className="panel">
            <div className="panel-title"><span>01</span><b>Shift details</b><i /></div>
            <div className="form-grid">
              <Field label="DEPLOYMENT DATE" required error={errors.date}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
              <Field label="SHIFT" required>
                <select value={shift} onChange={(e) => setShift(e.target.value)}>{SHIFTS.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field label="SHIFT IN-CHARGE" required error={errors.incharge}><input value={incharge} onChange={(e) => { setIncharge(e.target.value); clear('incharge'); }} /></Field>
              <Field label="MINE"><input value={selectedMine.name} readOnly /></Field>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title"><span>02</span><b>Location allocation · {locations.length}</b><i /></div>
            {!setup && <div className="form-note">The Site Manager has not saved a mine setup yet, so no default panels / galleries are listed. Add locations manually below.</div>}
            {errors.locations && <div className="form-error">{errors.locations}</div>}
            <div className="roster">
              <div className="roster-head location-head"><span>LOCATION NAME</span><span>TYPE</span><span>WORKERS</span><span /></div>
              {locations.map((l) => (
                <div className="roster-row location-row" key={l.id}>
                  <label className={errors[`loc.${l.id}.name`] ? 'has-error' : ''}>
                    <input aria-label="Location name" placeholder="Name" value={l.name} onChange={(e) => updateLocation(l.id, { name: e.target.value }, `loc.${l.id}.name`)} />
                  </label>
                  <label>
                    <select aria-label="Location type" value={l.type} onChange={(e) => updateLocation(l.id, { type: e.target.value as LocationType }, `loc.${l.id}.type`)}>
                      {LOCATION_TYPES.map((t) => <option key={t} value={t}>{LOCATION_TYPE_LABELS[t]}</option>)}
                    </select>
                  </label>
                  <label className={errors[`loc.${l.id}.workers`] ? 'has-error' : ''}>
                    <input aria-label="Number of workers" inputMode="numeric" placeholder="0" value={l.workers} onChange={(e) => updateLocation(l.id, { workers: Number(e.target.value.replace(/\D/g, '')) || 0 }, `loc.${l.id}.workers`)} />
                  </label>
                  <button type="button" className="row-remove" onClick={() => removeLocation(l.id)} aria-label="Remove location"><X size={14} /></button>
                </div>
              ))}
            </div>
            <div className="page-heading-actions">
              <button type="button" className="btn small" onClick={() => addLocation('PANEL')}><Plus size={13} /> ADD PANEL</button>
              <button type="button" className="btn small" onClick={() => addLocation('GALLERY')}><Plus size={13} /> ADD GALLERY</button>
              <button type="button" className="btn small" onClick={() => addLocation('WORKING_AREA')}><MapPin size={13} /> ADD WORKING AREA</button>
            </div>
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
              <button type="button" className="kv kv-clickable" key={d.id} onClick={() => viewRecent(d)}>
                <span>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · {d.shift.split(' · ')[0].toUpperCase()}</span>
                <b>{totalWorkers(d.allocations)} workers<small className="kv-sub">In-charge: {d.shiftIncharge}</small></b>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
